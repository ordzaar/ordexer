import { ConfigService } from "@nestjs/config";
import { networks } from "bitcoinjs-lib";

const config = new ConfigService();
const network = config.get<string>("bitcoin.network")!;

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
