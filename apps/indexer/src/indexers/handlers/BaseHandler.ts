import { VinData, VoutData } from "../types";

export abstract class BaseIndexerHandler {
  abstract commit(vins: VinData[], vouts: VoutData[]): Promise<void>;
  abstract reorg(fromHeight: number): Promise<void>;
}
