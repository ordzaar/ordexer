import { Injectable, Logger } from "@nestjs/common";
import { PrismaPromise } from "@prisma/client";

import { VinData, VoutData } from "../types";
import { BaseIndexerHandler } from "./BaseHandler";

@Injectable()
export class InscriptionHandler extends BaseIndexerHandler {
  private readonly logger = new Logger(InscriptionHandler.name);

  async commit(vins: VinData[], vouts: VoutData[], dbOperations: PrismaPromise<any>[]): Promise<void> {
    this.logger.log("commiting insription");
  }

  async reorg(fromHeight: number, dbOperations: PrismaPromise<any>[]): Promise<void> { }
}
