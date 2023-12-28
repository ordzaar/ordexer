import { ScriptPubKey } from "@ordzaar/bitcoin-service";
import { Rarity } from "@ordzaar/ord-service";

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

export type GetUnspentsOptions = {
  address: string;
  options?: {
    allowedRarity?: Rarity[];
    safetospend?: boolean;
  };
  sort?: "asc" | "desc";
};

export type UnspentDto = {
  txid: string;
  n: number;
  sats: number;
  scriptPubKey: ScriptPubKey;
  txhex?: string;
  ordinals: any;
  inscriptions: any;
  safeToSpend: boolean;
  confirmations: number;
};
