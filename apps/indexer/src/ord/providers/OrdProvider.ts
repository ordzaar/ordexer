import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class OrdProvider{

  private readonly logger = new Logger(OrdProvider.name);
  
  constructor(private readonly configService: ConfigService) {
    this.logger = new Logger(OrdProvider.name);
  }
    
  async call<R> (path: string, data?: any): Promise<R> {
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
      `${this.configService.get<string>("ordUri")}${path}`,
      requestOptions
    );
    
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
}