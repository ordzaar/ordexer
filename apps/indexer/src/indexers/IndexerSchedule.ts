import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { BitcoinService } from "src/bitcoin/BitcoinService";

import { IndexerService } from "./IndexerService";

@Injectable()
export class IndexerTask {
  private readonly logger = new Logger(IndexerTask.name);

  private indexing = false;

  private outdated = false;

  private reorging = false;

  // TODO get/insert the value from db
  private dbLastHeight = 100000;

  constructor(
    private readonly configService: ConfigService,
    private indexerSvc: IndexerService,
    private bitcoinSvc: BitcoinService,
  ) {}

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

    const indexOptions = {
      threshold: {
        numBlocks: this.configService.get<number>("indexerThreshold.numBlocks")!,
        numVins: this.configService.get<number>("indexerThreshold.numVins")!,
        numVouts: this.configService.get<number>("indexerThreshold.numVouts")!,
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
