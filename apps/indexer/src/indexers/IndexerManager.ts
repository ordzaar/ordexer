import { BaseIndexer, VinData, VoutData } from "./BaseIndexer";

export class IndexerManager {
  private readonly indexers: BaseIndexer[];

  vins: VinData[] = [];

  vouts: VoutData[] = [];

  constructor(indexers: BaseIndexer[]) {
    this.indexers = indexers;
  }
}


