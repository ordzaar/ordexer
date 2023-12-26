import { RawTransaction, Vin } from "../BitcoinService";
import { BitcoinRpcError } from "../errors/RpcError";

export function isCoinbaseTx(tx: RawTransaction): boolean {
  return tx.vin.length === 1 && isCoinbase(tx.vin[0]);
}

export function isCoinbase(vin: Vin): boolean {
  return "coinbase" in vin;
}

export function parseLocation(location: string): [string, number] {
  const [txid, vout] = location.split(":");
  if (txid === undefined || vout === undefined) {
    throw new BitcoinRpcError(`Failed to parse location ${location}`);
  }
  // eslint-disable-next-line radix
  return [txid, parseInt(vout)];
}
