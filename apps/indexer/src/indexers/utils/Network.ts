import { networks } from "bitcoinjs-lib";
import * as process from "process";

const network = process.env.NETWORK;

// make this backward compatible with the legacy 'ordit' function
export function getBitcoinNetwork(networkStr?: string): networks.Network {
  const networkEnv = networkStr || network;

  switch (networkEnv) {
    case "mainnet":
      return networks.bitcoin;
    case "testnet":
      return networks.testnet;
    case "regtest":
      return networks.regtest;
    default:
      throw new Error(`invalid bitcoin network: ${network}`);
  }
}

export const INSCRIPTION_EPOCH_BLOCK =
  // eslint-disable-next-line no-nested-ternary
  network === "mainnet" ? 767_429 : network === "testnet" ? 2_413_342 : 0;
