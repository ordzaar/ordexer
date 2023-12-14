import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class OrdProvider {
  private readonly logger = new Logger(OrdProvider.name);

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

    const response = await fetch(`${this.configService.get<string>("ordUri")}${path}`, requestOptions);

    if (response.status !== 200) {
      throw new Error(`ORD request failed with status ${response.status}`);
    }

    return response.json() as R;
  }

  async getHeight(): Promise<number> {
    return this.call<number>("/blockheight");
  }

  async getInscription(id: string): Promise<any> {
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
