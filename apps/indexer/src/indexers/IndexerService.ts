import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPromise } from "@prisma/client";
import { BitcoinService, Block } from "src/bitcoin/BitcoinService";
import { isCoinbaseTx } from "src/bitcoin/utils/Transaction";
import { perf } from "src/utils/Log";
import { promiseLimiter } from "src/utils/Promise";

import { PrismaService } from "../PrismaService";
import { BaseIndexerHandler } from "./handlers/BaseHandler";
import { InscriptionHandler } from "./handlers/InscriptionsHandler";
import { OutputHandler } from "./handlers/OutputHandler";
import { IndexOptions, VinData, VoutData } from "./types";

@Injectable()
export class IndexerService {
  private readonly logger = new Logger(IndexerService.name);

  private vins: VinData[] = [];

  private vouts: VoutData[] = [];

  private dbOperations: PrismaPromise<any>[] = [];

  private handlers: BaseIndexerHandler[] = [];

  constructor(
    private readonly configService: ConfigService,
    private bitcoinSvc: BitcoinService,
    private inscriptionHdl: InscriptionHandler,
    private outputHndl: OutputHandler,
    private prisma: PrismaService,
  ) {
    this.registerHandlers();
  }

  private registerHandlers() {
    this.handlers.push(this.outputHndl, this.inscriptionHdl);
  }

  async index(fromBlock: number, toBlock: number, options: IndexOptions) {
    this.logger.log(`indexing from block ${fromBlock} to ${toBlock}`);

    let blockHeight = fromBlock;

    let blockhash = await this.bitcoinSvc.getBlockHash(fromBlock);

    while (blockhash !== undefined && blockHeight <= toBlock) {
      const readingBlockTs = perf();
      const block = await this.bitcoinSvc.getBlock(blockhash, 2);
      this.logger.log(`reading block: ${blockHeight}, took ${readingBlockTs.now}s`);

      // ### Block
      // Process the block and extract all the vin and vout information required
      // by subsequent index handlers.
      const handleBlockTs = perf();
      await this.handleBlock(block);
      this.logger.log(`handling block: ${blockHeight}, took ${handleBlockTs.now}s`);

      // ### Commit
      // Once we reach configured tresholds we commit the current vins and vouts
      // to the registered index handlers.
      if (this.hasReachedTreshold(blockHeight, options)) {
        await this.commitVinVout(blockHeight - 1);
      }

      blockHeight += 1;
      blockhash = block.nextblockhash;
    }

    await this.commitVinVout(blockHeight - 1);
  }

  private hasReachedTreshold(blockheight: number, options: IndexOptions) {
    if (blockheight !== 0 && blockheight % options.threshold.numBlocks === 0) {
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
    // lazy address promises, resolve the address lookup later by concurent process
    const voutsAddressPromisesLimiter = promiseLimiter<string[]>(this.configService.get<number>("voutPromiseLimiter")!);

    // use a native loop instead of a 'for-of' loop for performance reasons
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
        voutsAddressPromisesLimiter.push(async () => this.bitcoinSvc.getAddressessFromVout(block.tx[i].vout[j]));

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

    // insert resolved addresses to existing vouts
    const voutsAddresses = await voutsAddressPromisesLimiter.run();
    for (let j = 0; j < voutsAddresses.length; j += 1) {
      this.vouts[this.vouts.length - voutsAddresses.length + j].addresses = voutsAddresses[j];
    }
  }

  private async commitVinVout(lastBlockHeight: number) {
    this.logger.log(`commiting block: ${lastBlockHeight}`);

    for (let i = 0; i < this.handlers.length; i += 1) {
      await this.handlers[i].commit(this.vins, this.vouts, this.dbOperations);
    }

    await this.prisma.$transaction(this.dbOperations);

    this.vins = [];
    this.vouts = [];

    // todo save the lastblock height into db
    // todo prisma transaction
    this.dbOperations = [];
  }

  // TODO
  private performReorg() { }
}
