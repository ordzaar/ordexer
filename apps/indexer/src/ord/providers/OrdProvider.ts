import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { networks } from "bitcoinjs-lib";

@Injectable()
export class OrdProvider {
  private readonly logger;

  constructor(private readonly configService: ConfigService) {
    this.logger = new Logger(OrdProvider.name);
  }

  async call<R>(path: string, data?: any): Promise<R> {
    const requestOptions: any = {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    };

    if (data !== undefined) {
      requestOptions.method = "POST";
      requestOptions.body = JSON.stringify(data);
      requestOptions.headers["Content-Type"] = "application/json";
    }

    const response = await fetch(
      `${this.configService.get<string>("ord.uri")}:${this.configService.get<string>("ord.port")}${path}`,
      requestOptions,
    );

    if (response.status !== 200) {
      throw new Error(`ORD request failed with status ${response.status}`);
    }

    return response.json() as R;
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

  async getHeight(): Promise<number> {
    return this.call<number>("/blockheight");
  }

  async getInscription(id: string): Promise<DetailedInscription> {
    return this.call<any>(`/inscription/${id}`);
  }

  async waitForBlock(height: number, seconds = 1): Promise<void> {
    const currentHeight = await this.getHeight();
    if (currentHeight >= height) {
      return;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, seconds * 1000);
    });
    // eslint-disable-next-line consistent-return
    return this.waitForBlock(height, seconds);
  }

  async getInscriptionsForIds(ids: string[]): Promise<OrdInscription[]> {
    return this.call<OrdInscription[]>(`/inscriptions?`, { ids });
  }
}

export type DetailedInscription = {
  address: string;
  children: string[];
  content_length: number;
  content_type: string;
  genesis_fee: number;
  genesis_height: number;
  inscription_id: string;
  inscription_number: number;
  inscription_sequence: number;
  next: string;
  output_value: number;
  parent: string | null;
  previous: string;
  rune: string | null;
  sat: number;
  satpoint: string;
  timestamp: number;
};

export type OrdInscription = {
  inscription_id: string;
  number: number;
  sequence: number;
  genesis_height: number;
  genesis_fee: number;
  sat: number;
  satpoint: string;
  timestamp: number;
};
