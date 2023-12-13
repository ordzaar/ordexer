import { PrismaPromise } from "@prisma/client";

import { VinData, VoutData } from "../types";

export abstract class BaseIndexerHandler {
  abstract commit(vins: VinData[], vouts: VoutData[], prismaPromises: PrismaPromise<any>[]): Promise<void>;
  abstract reorg(fromHeight: number, prismaPromises: PrismaPromise<any>[]): Promise<void>;
}
