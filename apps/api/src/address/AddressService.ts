import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AddressService {
  private readonly logger;

  constructor(private readonly configService: ConfigService) {
    this.logger = new Logger(AddressService.name);
  }

  async getBalance(address: string): Promise<number> {
    this.logger.log(`getBalance(${address})`);
    return 0;
  }

  async getSpendables(address: string): Promise<any> {
    this.logger.log(`getSpendables(${address})`);
    return {};
  }

  async getUnspents(address: string): Promise<any> {
    this.logger.log(`getUnspents(${address})`);
    return {};
  }
}
