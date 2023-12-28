import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TransactionsService {
  private readonly logger;

  constructor(private readonly configService: ConfigService) {
    this.logger = new Logger(TransactionsService.name);
  }

  async getTransaction(id: string): Promise<any> {
    this.logger.log(`getTransaction(${id})`);
    return {};
  }

  async relay(): Promise<any> {
    this.logger.log(`relay()`);
    return {};
  }
}
