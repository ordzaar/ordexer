import { Logger } from "@nestjs/common";

import { BaseIndexer } from "./BaseIndexer";

export class InscriptionIndexer extends BaseIndexer  {

  private readonly logger: Logger;

  constructor() {
    super("inscription");
    this.logger = new Logger(InscriptionIndexer.name);
  }

  async start(height: number): Promise<void> {
    this.logger.log("Starting inscription indexer at height", height);
  }

  async reorg(height: number): Promise<void> {
    this.logger.log("Reorging inscription indexer at height", height);
  }
};
