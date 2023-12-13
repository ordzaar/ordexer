import { Injectable, Logger } from "@nestjs/common";
import { PrismaPromise } from "@prisma/client";

import { VinData, VoutData } from "../types";
import { BaseIndexerHandler } from "./BaseHandler";

@Injectable()
export class OutputHandler extends BaseIndexerHandler {
  private readonly logger = new Logger(OutputHandler.name);

  async commit(vins: VinData[], vouts: VoutData[], prismaPromises: PrismaPromise<any>[]): Promise<void> {
    this.logger.log("commiting output");
  }

  async reorg(fromHeight: number, prismaPromises: PrismaPromise<any>[]): Promise<void> { }
}
