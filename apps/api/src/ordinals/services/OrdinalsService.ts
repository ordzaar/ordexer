import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class OrdinalsService {
  private readonly logger;

  constructor(private readonly configService: ConfigService) {
    this.logger = new Logger(OrdinalsService.name);
  }

  async getInscription(id: string): Promise<any> {
    this.logger.log(`getInscription(${id})`);
    return {};
  }

  async getInscriptionUTXO(id: string): Promise<any> {
    this.logger.log(`getInscriptionUTXO(${id})`);
    return {};
  }

  async getInscriptions(): Promise<any> {
    this.logger.log(`getInscriptions()`);
    return {};
  }
}
