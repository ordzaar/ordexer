import { Injectable, Logger } from "@nestjs/common";

import { VinData, VoutData } from "../types";
import { BaseIndexerHandler } from "./BaseHandler";

@Injectable()
export class OutputHandler extends BaseIndexerHandler {
  private readonly logger = new Logger(OutputHandler.name);

  async commit(vins: VinData[], vouts: VoutData[]): Promise<void> {
    this.logger.log("commiting output");

    return;
  }

  async reorg(fromHeight: number): Promise<void> {
    return;
  }
}
