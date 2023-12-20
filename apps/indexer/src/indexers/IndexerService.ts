import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BitcoinService, Block } from "src/bitcoin/BitcoinService";
import { isCoinbaseTx } from "src/bitcoin/utils/Transaction";
import { perf } from "src/utils/Log";
import { promiseLimiter } from "src/utils/Promise";

import { PrismaService } from "../PrismaService";
import { BaseIndexerHandler } from "./handlers/BaseHandler";
import { InscriptionHandler } from "./handlers/InscriptionsHandler";
import { OutputHandler } from "./handlers/OutputHandler";
import { INDEXER_LAST_HEIGHT_KEY, IndexOptions, VinData, VoutData } from "./types";

@Injectable()
export class IndexerService {
  private readonly logger = new Logger(IndexerService.name);

  private vins: VinData[] = [];

  private vouts: VoutData[] = [];

  private handlers: BaseIndexerHandler[] = [];

  constructor(
    private readonly configService: ConfigService,
    private bitcoinService: BitcoinService,
    private inscriptionHandler: InscriptionHandler,
    private outputHandler: OutputHandler,
    private prisma: PrismaService,
  ) {
    this.registerHandlers();
  }

  private registerHandlers() {
    this.handlers.push(this.outputHandler, this.inscriptionHandler);
  }

  async indexBlock(fromBlockHeight: number, toBlockHeight: number, options: IndexOptions) {
    this.logger.log(`[INDEXER|INDEX_BLOCK] indexing from block ${fromBlockHeight} to ${toBlockHeight}..`);

    let blockHeight = fromBlockHeight;

    let blockhash = await this.bitcoinService.getBlockHash(fromBlockHeight);

    while (blockhash && blockHeight <= toBlockHeight) {
      const readingBlockTs = perf();
      const block = await this.bitcoinService.getBlock(blockhash, 2);
      this.logger.log(`[INDEXER|INDEX_BLOCK] reading block: ${blockHeight}, took ${readingBlockTs.now} s`);

      // Process the block and extract all the vin and vout information required
      // by subsequent index handlers.
      const handleBlockTs = perf();
      await this.handleBlock(block);
      this.logger.log(`[INDEXER|INDEX_BLOCK] handling block: ${blockHeight}, took ${handleBlockTs.now} s`);

      // Once we reach configured thresholds we commit the current vins and vouts
      // to the registered index handlers.
      if (this.hasReachedThreshold(blockHeight, options)) {
        await this.commitVinVout(blockHeight);
      }

      blockHeight += 1;
      blockhash = block.nextblockhash;
    }

    await this.commitVinVout(blockHeight);
  }

  async getReorgHeight(indexerBlockHeight: number, reorgBlockLength: number): Promise<number> {
    const targetHeight = indexerBlockHeight - reorgBlockLength;

    let currentBlockHeight = indexerBlockHeight;

    while (currentBlockHeight > targetHeight) {
      const block = await this.bitcoinService.getBlock(currentBlockHeight);
      if (!block) {
        currentBlockHeight -= 1;
        // eslint-disable-next-line no-continue
        continue;
      }

      const output = await this.prisma.output.findFirst({
        where: {
          voutBlockHeight: currentBlockHeight,
        },
      });
      if (!output) {
        currentBlockHeight -= 1;
        // eslint-disable-next-line no-continue
        continue;
      }

      // If the block hash already matches the current output, then there's no need to check further
      if (block.hash === output.voutBlockHash) {
        return currentBlockHeight;
      }

      currentBlockHeight -= 1;
    }

    const msg =
      "[INDEXER|REORG_HEIGHT] reorg block value is more than the threshold, block is not healthy, please check it manually or increase the reorg threshold";
    this.logger.log(msg);
    throw new Error(msg);
  }

  private hasReachedThreshold(blockHeight: number, options: IndexOptions) {
    if (blockHeight !== 0 && blockHeight % options.threshold.numBlocks === 0) {
      return true;
    }
    if (this.vins.length > options.threshold.numVins) {
      return true;
    }
    if (this.vouts.length > options.threshold.numVouts) {
      return true;
    }
    return false;
  }

  private async handleBlock(block: Block<2>) {
    // Lazy address promises, resolve the address lookup later by concurent process
    const voutsAddressPromisesLimiter = promiseLimiter<string[]>(
      this.configService.getOrThrow<number>("voutPromiseLimiter"),
    );

    // Use a native loop instead of a 'for-of' loop for performance reasons
    for (let i = 0; i < block.tx.length; i += 1) {
      if (isCoinbaseTx(block.tx[i]) === false) {
        for (let j = 0; j < block.tx[i].vin.length; j += 1) {
          this.vins.push({
            txid: block.tx[i].txid,
            n: j,
            witness: block.tx[i].vin[j].txinwitness ?? [],
            block: {
              hash: block.hash,
              height: block.height,
              time: block.time,
            },
            vout: {
              txid: block.tx[i].vin[j].txid,
              n: block.tx[i].vin[j].vout,
            },
          });
        }
      }

      for (let j = 0; j < block.tx[i].vout.length; j += 1) {
        voutsAddressPromisesLimiter.push(async () => this.bitcoinService.getAddressesFromVout(block.tx[i].vout[j]));

        this.vouts.push({
          txid: block.tx[i].txid,
          n: j,
          addresses: [],
          value: block.tx[i].vout[j].value,
          scriptPubKey: block.tx[i].vout[j].scriptPubKey,
          block: {
            hash: block.hash,
            height: block.height,
            time: block.time,
          },
        });
      }
    }

    // Insert resolved addresses to existing vouts
    const voutsAddresses = await voutsAddressPromisesLimiter.run();
    for (let j = 0; j < voutsAddresses.length; j += 1) {
      this.vouts[this.vouts.length - voutsAddresses.length + j].addresses = voutsAddresses[j];
    }
  }

  private async commitVinVout(lastBlockHeight: number) {
    this.logger.log(`[INDEXER|COMMIT] commiting block: ${lastBlockHeight}..`);
    this.logger.log(`[INDEXER|COMMIT] total vins: ${this.vins.length}`);
    this.logger.log(`[INDEXER|COMMIT] total vouts: ${this.vouts.length}`);

    const dbTxTs = perf();
    await this.prisma.$transaction(
      async (prismaTx) => {
        for (let i = 0; i < this.handlers.length; i += 1) {
          await this.handlers[i].commit(lastBlockHeight, this.vins, this.vouts, prismaTx);
        }

        // Set the last indexed block into db
        await prismaTx.indexer.upsert({
          where: {
            name: INDEXER_LAST_HEIGHT_KEY,
          },
          update: {
            block: lastBlockHeight,
          },
          create: {
            name: INDEXER_LAST_HEIGHT_KEY,
            block: lastBlockHeight,
          },
        });
      },
      {
        timeout: this.configService.getOrThrow<number>("indexer.transactionTimeout"),
      },
    );
    this.logger.log(`[INDEXER|COMMIT] executing commit data, took ${dbTxTs.now} s`);

    this.vins = [];
    this.vouts = [];
  }

  async performReorg(lastHealthyBlockHeight: number) {
    const dbTxTs = perf();
    await this.prisma.$transaction(
      async (prismaTx) => {
        for (let i = 0; i < this.handlers.length; i += 1) {
          const fromBlockHeight = lastHealthyBlockHeight + 1;
          await this.handlers[i].reorg(fromBlockHeight, prismaTx);
        }

        // Set the last healthy indexed block into db
        await prismaTx.indexer.update({
          where: {
            name: INDEXER_LAST_HEIGHT_KEY,
          },
          data: {
            block: lastHealthyBlockHeight,
          },
        });
      },
      {
        timeout: this.configService.getOrThrow<number>("indexer.transactionTimeout"),
      },
    );
    this.logger.log(`[INDEXER|REORG] executing reorg, took ${dbTxTs.now} s`);
  }
}
