import { networks } from "bitcoinjs-lib";
import * as process from "process";

const network = process.env.NETWORK;

export function getBitcoinNetwork(): networks.Network {
  switch (network) {
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
