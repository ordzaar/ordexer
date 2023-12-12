import { VinData, VoutData } from "../IndexerService";

export abstract class BaseIndexerHandler {
  abstract commit(vins: VinData[], vouts: VoutData[]): Promise<void>;
  abstract reorg(fromHeight: number): Promise<void>;
}
