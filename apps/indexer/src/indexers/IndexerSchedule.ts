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
    this.logger.log("check for block");

    // TODO set status reorging & outdated
    // TODO reorg check

    this.indexing = true;

    let fromHeight = 0;
    const indexerRow = await this.prisma.indexer.findFirst({
      where: {
        name: INDEXER_LAST_HEIGHT_KEY,
      },
    });
    if (indexerRow) {
      fromHeight = indexerRow.block + 1;
    }

    const targetBlock = await this.bitcoinSvc.getBlockCount();

    const indexOptions = {
      threshold: {
        numBlocks: this.configService.get<number>("indexerThreshold.numBlocks")!,
        numVins: this.configService.get<number>("indexerThreshold.numVins")!,
        numVouts: this.configService.get<number>("indexerThreshold.numVouts")!,
      },
    };

    if (fromHeight < targetBlock) {
      this.logger.log("start indexing");
      await this.indexerSvc.index(fromHeight, targetBlock, indexOptions);
    }

    this.indexing = false;
  }
}
