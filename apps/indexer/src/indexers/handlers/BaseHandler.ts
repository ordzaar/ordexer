import { PrismaPromise } from "@prisma/client";

import { VinData, VoutData } from "../types";

export abstract class BaseIndexerHandler {
  abstract commit(
    height: number,
    vins: VinData[],
    vouts: VoutData[],
    dbOperations: PrismaPromise<any>[],
  ): Promise<void>;
  abstract reorg(fromHeight: number, prismaPromises: PrismaPromise<any>[]): Promise<void>;
}
