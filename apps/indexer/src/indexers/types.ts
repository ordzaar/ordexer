import { ScriptPubKey } from "src/bitcoin/BitcoinService";


export type IndexOptions = {
  threshold: {
    numBlocks: number;
    numVins: number;
    numVouts: number;
  };
};

export type VinData = TxMeta & {
  witness: string[];
  block: BlockMeta;
  vout: TxMeta;
};

export type VoutData = TxMeta & {
  addresses: string[];
  value: number;
  scriptPubKey: ScriptPubKey;
  block: BlockMeta;
};

type TxMeta = {
  txid: string;
  n: number;
};

type BlockMeta = {
  hash: string;
  height: number;
  time: number;
};