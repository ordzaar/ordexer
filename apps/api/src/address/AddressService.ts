import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BitcoinService } from "@ordzaar/bitcoin-service";

import { PrismaService } from "../PrismaService";

@Injectable()
export class AddressService {
  private readonly logger;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private rpc: BitcoinService,
  ) {
    this.logger = new Logger(AddressService.name);
  }

  async getBalance(address: string): Promise<number> {
    this.logger.log(`getBalance(${address})`);

    let balance = 0;
    const outputs = await this.prisma.output.findMany({
      where: {
        addresses: {
          has: address,
        },
        spent: false,
        vinBlockHash: null,
        vinBlockHeight: null,
        vinTxid: null,
        vinTxIndex: null,
      },
    });

    // eslint-disable-next-line no-restricted-syntax
    for (const output of outputs) {
      if (!output.value) {
        // We should not end up here
        // If we end up in this block, it means that the output is not indexed correctly
        this.logger.error(`[API|GET_ADDRESS] Output ${output.id} has no value`);
        const tx = await this.rpc.getRawTransaction(output.voutTxid, true);
        if (tx === undefined) {
          // eslint-disable-next-line no-continue
          continue;
        }
        const vout = tx.vout[output.voutTxIndex];
        if (vout === undefined || vout.value === undefined) {
          // eslint-disable-next-line no-continue
          continue;
        }
        balance += vout.value;
      } else {
        balance += output.value;
      }
    }
    return balance;
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
