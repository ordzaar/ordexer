import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { BitcoinService } from "@ordzaar/rpcservices";
import { PrismaService } from "src/PrismaService";

import { IndexerService } from "./IndexerService";
import { INDEXER_LAST_HEIGHT_KEY } from "./types";

@Injectable()
export class IndexerTask {
  private readonly logger = new Logger(IndexerTask.name);

  private indexing = false;

  private reorging = false;

  constructor(
    private readonly configService: ConfigService,
    private indexerService: IndexerService,
    private bitcoinService: BitcoinService,
    private prisma: PrismaService,
  ) {}

  get status() {
    return {
      indexing: this.indexing,
      reorging: this.reorging,
    };
  }

  // Run the check block every x time to check the new block.
  // Once the node block is greater than the indexed block, then index the new block otherwise, skip the process.
  @Cron(CronExpression.EVERY_5_SECONDS)
  async checkForBlock() {
    if (this.indexing) return;
    this.indexing = true;
    this.logger.log("[INDEXER_SCHEDULE] check for block");

    let indexerBlockHeight = -1;
    const indexerRow = await this.prisma.indexer.findUnique({
      where: {
        name: INDEXER_LAST_HEIGHT_KEY,
      },
    });
    if (indexerRow) {
      indexerBlockHeight = indexerRow.block;
    }

    // Check for reorg
    // Reorg is a process to ensure that every indexed block has a matching hash block with the node.
    // https://learnmeabitcoin.com/technical/chain-reorganisation
    // If the indexed block has an unmatched hash with the node block, it will revert to the last matching hash block (the last healthy block).
    // Basically, it will wipe out all data greater than or equal to the unmatched hash block
    // and then reset the last indexed block to the healthy block.
    if (indexerBlockHeight !== -1) {
      this.reorging = true;
      const reorgBlockLength = this.configService.getOrThrow<number>("indexer.reorgLength");
      const lastHealthyBlockHeight = await this.indexerService.getReorgHeight(indexerBlockHeight, reorgBlockLength);
      if (lastHealthyBlockHeight < indexerBlockHeight) {
        this.logger.log("[INDEXER_SCHEDULE|REORG_CHECK] indexed blocks is not healthy, needs to perform reorg");
        this.logger.log("[INDEXER_SCHEDULE|REORG_CHECK] performing reorg..");
        await this.indexerService.performReorg(lastHealthyBlockHeight);

        indexerBlockHeight = lastHealthyBlockHeight;
      }
      this.reorging = false;
    }
    this.logger.log("[INDEXER_SCHEDULE] indexed blocks is healthy");

    const targetBlockHeight = await this.bitcoinService.getBlockCount();
    if (indexerBlockHeight >= targetBlockHeight) {
      this.indexing = false;
      return;
    }

    // Indexing
    this.logger.log("[INDEXER_SCHEDULE] start indexing..");
    const indexOptions = {
      threshold: {
        numBlocks: this.configService.getOrThrow<number>("indexer.threshold.numBlocks"),
        numVins: this.configService.getOrThrow<number>("indexer.threshold.numVins"),
        numVouts: this.configService.getOrThrow<number>("indexer.threshold.numVouts"),
      },
    };
    const fromBlockHeight = indexerBlockHeight + 1;
    await this.indexerService.indexBlock(fromBlockHeight, targetBlockHeight, indexOptions);
  }
}
