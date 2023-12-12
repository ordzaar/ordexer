import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { IndexerService } from "./IndexerService";
import { BitcoinService } from "src/bitcoin/BitcoinService";

@Injectable()
export class IndexerTask {
  private readonly logger = new Logger(IndexerTask.name);

  private indexing = false;
  private outdated = false;
  private reorging = false;

  // TODO get/insert the value from db
  private dbLastHeight = 100000;

  constructor(
    private indexerSvc: IndexerService,
    private bitcoinSvc: BitcoinService,
  ) { }

  get status() {
    return {
      indexing: this.indexing,
      outdated: this.outdated,
      reorging: this.reorging,
    };
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async checkForBlock() {
    if (this.indexing) return;
    this.logger.log("check for block");

    // TODO set status reorging & outdated

    this.indexing = true;

    const lastHeight = this.dbLastHeight;
    // const targetBlock = await this.bitcoinSvc.getBlockCount();
    const targetBlock = 100005;

    // TODO reorg check

    // TODO create config for this
    const indexOptions = {
      threshold: {
        numBlocks: 5_000,
        numVins: 250_000,
        numVouts: 250_000,
      },
    };
    if (lastHeight < targetBlock) {
      this.logger.log("start indexing");
      await this.indexerSvc.index(lastHeight + 1, targetBlock, indexOptions);
    }

    // TODO insert the value to db
    this.dbLastHeight = targetBlock;

    this.indexing = false;
  }
}
