import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as retry from "async-retry";
import { networks } from "bitcoinjs-lib";

import { sleep } from "../utils/Sleep";
import { extractAddress } from "./utils/Address";

@Injectable()
export class BitcoinService {
  private readonly logger;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.logger = new Logger(BitcoinService.name);
  }

  async rpc<R>(method: string, params: any[] = []): Promise<R> {
    const userPassBase64 = Buffer.from(
      `${this.configService.get<string>("bitcoinRpc.user")}:${this.configService.get<string>("bitcoinRpc.password")}`,
    ).toString("base64");
    const authorization = `Basic ${userPassBase64}`;

    const response = await retry(
      async () => {
        try {
          const res = await this.httpService.axiosRef.post(
            `${this.configService.get<string>("bitcoinRpc.uri")}:${this.configService.get<string>("bitcoinRpc.port")}`,
            {
              jsonrpc: "1.0",
              method,
              params,
            },
            {
              headers: {
                "Content-Type": "text/plain",
                Authorization: authorization,
              },
              // This is needed to prevent axios from throwing an error on non-200 responses
              // We handle non-200 responses in the outer block
              validateStatus: () => true,
            },
          );

          // Only 503 responses are handled here
          if (res.status === 503) {
            throw new Error(`RPC request failed with status ${res.status}`);
          }

          return res;
        } catch (error) {
          // This catches the 503, then retries
          this.logger.error(`RPC request failed with error: ${error}`);
          await sleep(5);
          throw error;
        }
      },
      {
        forever: true,
      },
    );

    if (response.status !== 200) {
      throw new Error(`RPC request failed with status ${response.status}`);
    }

    return response.data.result;
  }

  async getBitcoinNetwork() {
    const network = this.configService.get<"mainnet" | "testnet" | "regtest">("network")!;
    switch (network) {
      case "mainnet":
        return networks.bitcoin;
      case "testnet":
        return networks.testnet;
      case "regtest":
        return networks.regtest;
      default:
        throw new Error(`Invalid network config: ${network}`);
    }
  }

  async getBlockHash(height: number): Promise<string> {
    return this.rpc<string>("getblockhash", [height]);
  }

  async getBlockCount(): Promise<number> {
    return this.rpc<number>("getblockcount", []);
  }

  async getBlock(hashOrHeight: string | number, verbosity: 0): Promise<string>;
  async getBlock(hashOrHeight: string | number, verbosity?: 1): Promise<Block>;
  async getBlock(hashOrHeight: string | number, verbosity: 2): Promise<Block<2>>;
  async getBlock(hashOrHeight: string | number, verbosity = 1): Promise<Block | Block<2> | string> {
    let hash = hashOrHeight;
    if (typeof hashOrHeight === "number") {
      hash = await this.getBlockHash(hashOrHeight);
    }
    return this.rpc("getblock", [hash, verbosity]);
  }

  async getRawTransaction(txid: string, verbose?: false): Promise<string>;
  async getRawTransaction(txid: string, verbose: true): Promise<RawTransaction>;
  async getRawTransaction(txid: string, verbose = false): Promise<string | RawTransaction> {
    return this.rpc<string | RawTransaction>("getrawtransaction", [txid, verbose]);
  }

  async deriveAddresses(descriptor: string, range?: number | [number, number]): Promise<string[]> {
    const args: [string, (number | [number, number])?] = [descriptor];
    if (range !== undefined) {
      args.push(range);
    }
    return this.rpc<string[]>("deriveaddresses", args);
  }

  async getAddressesFromVout(vout: Vout) {
    if (vout.scriptPubKey.address !== undefined) {
      return [vout.scriptPubKey.address];
    }
    if (vout.scriptPubKey.addresses) {
      return vout.scriptPubKey.addresses;
    }
    const network = await this.getBitcoinNetwork();
    const address = extractAddress(Buffer.from(vout.scriptPubKey.hex, "hex"), network);
    if (address !== undefined) {
      return [address];
    }
    if (vout.scriptPubKey.desc !== undefined) {
      return this.deriveAddresses(vout.scriptPubKey.desc).catch(() => []);
    }
    return [];
  }
}

export type RawTransaction = {
  hex: string;
  txid: string;
  hash: string;
  size: number;
  vsize: number;
  weight: number;
  version: number;
  locktime: number;
  vin: Vin[];
  vout: Vout[];
  blockhash: string;
  confirmations: number;
  blocktime: number;
  time: number;
};

export type Vin = {
  txid: string;
  vout: number;
  scriptSig: {
    asm: string;
    hex: string;
  };
  txinwitness: string[];
  sequence: number;
};

export type Vout = {
  value: number;
  n: number;
  scriptPubKey: ScriptPubKey;
};

export type ScriptPubKey = {
  asm: string;
  desc: string;
  hex: string;
  reqSigs?: number;
  type: string;
  addresses?: string[];
  address?: string;
};

export type BlockchainInfo = {
  chain: string;
  blocks: number;
  headers: number;
  bestblockhash: string;
  difficulty: number;
  time: number;
  mediantime: number;
  verificationprogress: number;
  initialblockdownload: boolean;
  chainwork: string;
  size_on_disk: number;
  pruned: boolean;
  warnings: string;
};

export type BlockStats = {
  avgFee: number;
  avgFeeRate: number;
  avgTxSize: number;
  blockhash: string;
  feeratePercentiles: number[];
  height: number;
  ins: number;
  maxFee: number;
  maxFeeRate: number;
  maxTxSize: number;
  medianFee: number;
  medianTime: number;
  medianTxSize: number;
  minFee: number;
  minFeeRate: number;
  minTxSize: number;
  outs: number;
  subsidy: number;
  swTotalSize: number;
  swTotalWeight: number;
  swtxs: number;
  time: number;
  totalOut: number;
  totalSize: number;
  totalWeight: number;
  totalfee: number;
  txs: number;
  utxoIncrease: number;
  utxoSizeIncrease: number;
};

export type MemPoolInfo = {
  loaded: boolean;
  size: number;
  bytes: number;
  usage: number;
  maxmempool: number;
  mempoolminfee: number;
  minrelaytxfee: number;
  unbroadcastcount: number;
};

export type RawMempoolTransation = {
  vsize: number;
  weight: number;
  fee: number;
  modifiedfee: number;
  time: number;
  height: number;
  descendantcount: number;
  descendantsize: number;
  descendantfees: number;
  ancestorcount: number;
  ancestorsize: number;
  ancestorfees: number;
  wtxid: string;
  fees: {
    base: number;
    modified: number;
    ancestor: number;
    descendant: number;
  };
  depends: string[];
  spentby: string[];
  bip125_replaceable: boolean;
  unbroadcast: boolean;
};

export type Block<Verbosity = 1> = {
  hash: string;
  confirmations: number;
  size: number;
  strippedsize: number;
  weight: number;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  tx: Verbosity extends 1 ? string[] : RawTransaction[];
  time: number;
  mediantime: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  nTx: number;
  previousblockhash: string;
  nextblockhash: string;
};

export type TxOut = {
  bestblock: string;
  confirmations: number;
  value: number;
  scriptPubKey: ScriptPubKey;
  coinbase: boolean;
};