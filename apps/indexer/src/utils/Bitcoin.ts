import { address as addr, networks, payments } from "bitcoinjs-lib";
import { RawTransaction, Vin } from "../bitcoin/BitcoinService";

export function isCoinbaseTx(tx: RawTransaction): boolean {
  return tx.vin.length === 1 && isCoinbase(tx.vin[0]);
}

export function isCoinbase(vin: Vin): boolean {
  return "coinbase" in vin;
}

export function extractAddress(script: Buffer, network: "mainnet" | "testnet" | "regtest") {
  const networkLib = network === "mainnet" ? networks.bitcoin : networks[network];
  if (network === undefined) {
    throw new Error("invalid network", network);
  }

  try {
    const address = addr.fromOutputScript(script, networkLib);
    if (address) {
      return address;
    }
  } catch {
    // ignore
  }

  try {
    const address = payments.p2pkh({ output: script, network: networkLib }).address;
    if (address) {
      return address;
    }
  } catch {
    // ignore
  }

  try {
    const address = payments.p2sh({ output: script, network: networkLib }).address;
    if (address) {
      return address;
    }
  } catch {
    // ignore
  }

  try {
    const address = payments.p2wpkh({ output: script, network: networkLib }).address;
    if (address) {
      return address;
    }
  } catch {
    // ignore
  }

  try {
    const address = payments.p2wsh({ output: script, network: networkLib }).address;
    if (address) {
      return address;
    }
  } catch {
    // ignore
  }

  return undefined;
}
