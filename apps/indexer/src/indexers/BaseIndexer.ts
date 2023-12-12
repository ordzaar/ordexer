import { PrismaPromise } from "@prisma/client";

export abstract class BaseIndexer {
    protected readonly name: string;

    constructor(
        name: string,
    ) {
        this.name = name;
    }
    
    abstract start(height: number): Promise<void>;
    abstract index(vins: VinData[], vouts: VoutData[]): Promise<PrismaPromise<void>[]>;
    abstract reorg(height: number): Promise<void>;
}

export type VinData = TxMeta & {
    witness: string[];
    block: BlockMeta;
    vout: TxMeta;
  };
    
  export type VoutData = TxMeta & {
    addresses: string[];
    value: number;
    block: BlockMeta;
  };
  
  type TxMeta = {
    txid: string;
    n: number;
  };
  
  type BlockMeta = {
    hash: string;
    height: number;
  };
