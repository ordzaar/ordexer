import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { BitcoinService } from "src/bitcoin/BitcoinService";
import { PrismaService } from "src/PrismaService";

import { IndexerService } from "./IndexerService";
import { INDEXER_LAST_HEIGHT_KEY } from "./types";

@Injectable()
export class IndexerTask {
  private readonly logger = new Logger(IndexerTask.name);

  private indexing = false;

  private outdated = false;

  private reorging = false;

  constructor(
    private readonly configService: ConfigService,
    private indexerSvc: IndexerService,
    private bitcoinSvc: BitcoinService,
    private prisma: PrismaService,
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
    this.indexing = true;
    this.logger.log("check for block");

    // TODO set status reorging & outdated

    let indexerBlockHeight = -1;
    const indexerRow = await this.prisma.indexer.findFirst({
      where: {
        name: INDEXER_LAST_HEIGHT_KEY,
      },
    });
    if (indexerRow) {
      indexerBlockHeight = indexerRow.block;
    }

    // check for reorg
    if (indexerBlockHeight !== -1) {
      const reorgBlockLength = this.configService.get<number>("indexer.reorgLength")!;
      const lastHealthyBlockHeight = await this.indexerSvc.getReorgHeight(indexerBlockHeight, reorgBlockLength);
      if (lastHealthyBlockHeight < indexerBlockHeight) {
        this.logger.log("indexer is not healthy, need to perform reorg");
        this.logger.log("performing reorg..");
        await this.indexerSvc.performReorg(lastHealthyBlockHeight);

        indexerBlockHeight = lastHealthyBlockHeight;
      }
    }
    this.logger.log("indexer is healthy");

    const targetBlockHeight = await this.bitcoinSvc.getBlockCount();
    if (indexerBlockHeight >= targetBlockHeight) {
      this.indexing = false;
      return;
    }

    // indexing
    this.logger.log("start indexing..");
    const indexOptions = {
      threshold: {
        numBlocks: this.configService.get<number>("indexer.threshold.numBlocks")!,
        numVins: this.configService.get<number>("indexer.threshold.numVins")!,
        numVouts: this.configService.get<number>("indexer.threshold.numVouts")!,
      },
    };
    const fromBlockHeight = indexerBlockHeight + 1;
    await this.indexerSvc.index(fromBlockHeight, targetBlockHeight, indexOptions);
  }
}
