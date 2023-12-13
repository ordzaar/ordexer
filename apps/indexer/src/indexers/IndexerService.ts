import { Injectable, Logger } from "@nestjs/common";
import { PrismaPromise } from "@prisma/client";
import { BitcoinService, Block } from "src/bitcoin/BitcoinService";
import { isCoinbaseTx } from "src/bitcoin/utils/Transaction";

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
    private bitcoinSvc: BitcoinService,
    private inscriptionHdl: InscriptionHandler,
    private outputHndl: OutputHandler,
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
      this.logger.log(`reading block ${blockHeight} from node`);
      const block = await this.bitcoinSvc.getBlock(blockhash, 2);

      // ### Block
      // Process the block and extract all the vin and vout information required
      // by subsequent index handlers.
      await this.handleBlock(block);

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
    // eslint-disable-next-line no-restricted-syntax
    for (const tx of block.tx) {
      const { txid } = tx;

      if (isCoinbaseTx(tx) === false) {
        let n = 0;
        // eslint-disable-next-line no-restricted-syntax
        for (const vin of tx.vin) {
          this.vins.push({
            txid,
            n,
            witness: vin.txinwitness ?? [],
            block: {
              hash: block.hash,
              height: block.height,
              time: block.time,
            },
            vout: {
              txid: vin.txid,
              n: vin.vout,
            },
          });
          n += 1;
        }
      }

      let n = 0;
      // eslint-disable-next-line no-restricted-syntax
      for (const vout of tx.vout) {
        this.vouts.push({
          txid,
          n,
          addresses: await this.bitcoinSvc.getAddressessFromVout(vout),
          value: vout.value,
          scriptPubKey: vout.scriptPubKey,
          block: {
            hash: block.hash,
            height: block.height,
            time: block.time,
          },
        });
        n += 1;
      }
    }
  }

  private async commitVinVout(lastBlockHeight: number) {
    this.logger.log(`commiting block: ${lastBlockHeight}`);

    // eslint-disable-next-line no-restricted-syntax
    for (const handler of this.handlers) {
      // this.logger.log(`commiting ${handler.name}`);
      await handler.commit(this.vins, this.vouts, this.dbOperations);
    }

    this.vins = [];
    this.vouts = [];

    // todo save the lastblock height into db
    // todo prisma transaction
    this.dbOperations = [];
  }

  // TODO
  private performReorg() { }
}
