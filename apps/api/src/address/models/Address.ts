import { ScriptPubKey } from "@ordzaar/bitcoin-service";

export type GetSpendablesOptions = {
  address: string;
  value: number;
  safetospend?: boolean;
  filter?: string[];
};

export type SpendableDto = {
  txid: string;
  n: number;
  sats: number;
  scriptPubKey: ScriptPubKey;
};
