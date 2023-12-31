import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AxiosResponse } from "axios";
import { networks } from "bitcoinjs-lib";

import { OrdError } from "../errors/OrdError";

@Injectable()
export class OrdProvider {
  private readonly logger;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
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

    let response: AxiosResponse;

    if (requestOptions.method === "POST") {
      response = await this.httpService.axiosRef.post(
        `${this.configService.get<string>("ord.uri")}:${this.configService.get<string>("ord.port")}${path}`,
        requestOptions.body,
        {
          headers: requestOptions.headers,
        },
      );
    } else {
      response = await this.httpService.axiosRef.get(
        `${this.configService.get<string>("ord.uri")}:${this.configService.get<string>("ord.port")}${path}`,
        {
          headers: requestOptions.headers,
        },
      );
    }

    if (response.status !== 200) {
      throw new OrdError(`ORD request failed. Status: ${response.status}, Message: ${response.data}`);
    }

    return response.data as R;
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
        throw new OrdError(`Invalid network config: ${network}`);
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
