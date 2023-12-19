import { PrismaClient } from "@prisma/client";
import { ITXClientDenyList, Omit } from "@prisma/client/runtime/library";

import { VinData, VoutData } from "../types";

export abstract class BaseIndexerHandler {
  abstract commit(
    lastBlockHeight: number,
    vins: VinData[],
    vouts: VoutData[],
    prismaTx: Omit<PrismaClient, ITXClientDenyList>,
  ): Promise<void>;
  abstract reorg(fromHeight: number, prismaTx: Omit<PrismaClient, ITXClientDenyList>): Promise<void>;
}
