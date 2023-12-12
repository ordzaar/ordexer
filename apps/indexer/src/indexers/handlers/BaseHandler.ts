import { PrismaPromise } from "@prisma/client";

import { VinData, VoutData } from "../types";

export abstract class BaseIndexerHandler {
  abstract commit(vins: VinData[], vouts: VoutData[]): Promise<PrismaPromise<any>[]>;
  abstract reorg(fromHeight: number): Promise<void>;
}
