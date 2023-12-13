import { RawTransaction, Vin } from "../BitcoinService";

export function isCoinbaseTx(tx: RawTransaction): boolean {
  return tx.vin.length === 1 && isCoinbase(tx.vin[0]);
}

export function isCoinbase(vin: Vin): boolean {
  return "coinbase" in vin;
}

