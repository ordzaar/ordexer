import { Injectable, Logger } from "@nestjs/common";

import { VinData, VoutData } from "../types";
import { BaseIndexerHandler } from "./BaseHandler";

@Injectable()
export class InscriptionHandler extends BaseIndexerHandler {
  private readonly logger = new Logger(InscriptionHandler.name);

  async commit(vins: VinData[], vouts: VoutData[]): Promise<void> {
    this.logger.log("commiting insription");
  }

  async reorg(fromHeight: number): Promise<void> {
    this.logger.log(`reorging insription from height ${fromHeight}`);
  }
}
