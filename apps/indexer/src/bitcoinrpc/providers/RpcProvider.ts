import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class RpcProvider {
  private readonly logger = new Logger(RpcProvider.name);

  constructor(private readonly configService: ConfigService) {
    this.logger = new Logger(RpcProvider.name);
  }
  
  async rpc<R> (method: string, params: any[] = []): Promise<R> {
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        Authorization: `Basic ${Buffer.from(
          `${this.configService.get<string>("rpcUser")}:${this.configService.get<string>("rpcPassword")}`
        ).toString("base64")}`,
      },
      body: JSON.stringify({
        jsonrpc: "1.0",
        method,
        params,
      }),
    };

    const response = await fetch(
      this.configService.get<string>("rpcUri")!,
      requestOptions
    );
    
    if (response.status !== 200) {
      throw new Error(`RPC request failed with status ${response.status}`);
    }

    const text = await response.text();
    
    let json: any;

    try {
      json = JSON.parse(text);
    } catch (error) {
      throw new Error(`bitcoin rcp error: ${text}`);
    }

    return json.result;
  }

  async getBlockHash(height: number): Promise<string> {
    return this.rpc<string>("getblockhash", [height]);
  }

  async getBestBlockHash(): Promise<string> {
    return this.rpc<string>("getbestblockhash");
  }

  async getRawTransaction(txid: string, verbose?: false): Promise<string>;
  async getRawTransaction(txid: string, verbose: true): Promise<RawTransaction>;
  async getRawTransaction(txid: string, verbose = false): Promise<string | RawTransaction> {
    return this.rpc<string | RawTransaction>("getrawtransaction", [txid, verbose]);
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
