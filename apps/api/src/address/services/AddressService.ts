import { Injectable, Logger } from "@nestjs/common";
import { BitcoinService } from "@ordzaar/bitcoin-service";
import { OrdProvider } from "@ordzaar/ord-service";

import { PrismaService } from "../../PrismaService";
import { GetBalanceDTO, GetSpendablesDTO, GetUnspentsDTO, SpendableDto, UnspentDto } from "../models/Address";

@Injectable()
export class AddressService {
  private readonly logger;

  constructor(
    private readonly prisma: PrismaService,
    private rpc: BitcoinService,
    private ord: OrdProvider,
  ) {
    this.logger = new Logger(AddressService.name);
  }

  async getBalance({ address }: GetBalanceDTO): Promise<number> {
    this.logger.log(`getBalance(${address})`);

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

    const outputValues = await Promise.all(
      outputs.map(async (output) => {
        if (!output.value) {
          // We should not end up here
          // If we end up in this block, it means that the output is not indexed correctly
          this.logger.error(`[API|GET_ADDRESS] Output ${output.id} has no value`);
          const tx = await this.rpc.getRawTransaction(output.voutTxid, true);
          if (tx === undefined) {
            return 0;
          }
          const vout = tx.vout[output.voutTxIndex];
          if (vout === undefined || vout.value === undefined) {
            return 0;
          }
          return vout.value;
        }
        return output.value;
      }),
    );

    const balance = outputValues.reduce((a, b) => a + b, 0);

    return balance;
  }

  async getSpendables({ address, value, safetospend = true, filter = [] }: GetSpendablesDTO): Promise<SpendableDto[]> {
    this.logger.log(`getSpendables(${address})`);

    const spendables: SpendableDto[] = [];
    let totalValue = 0;

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
        inscriptions: {
          none: {},
        },
      },
      include: {
        inscriptions: true,
      },
      orderBy: {
        value: "desc",
      },
    });

    outputs.forEach(async (output) => {
      const outpoint = `${output.voutTxid}:${output.voutTxIndex}`;

      if (filter.includes(outpoint)) {
        return;
      }

      if (safetospend) {
        const ordinals = await this.ord.getOrdinals(outpoint);
        const safeToSpend = await this.ord.getSafeToSpendState(ordinals);
        if (!safeToSpend) {
          return;
        }
      }

      totalValue += output.value;

      const spendable = {
        txid: output.voutTxid,
        n: output.voutTxIndex,
        sats: output.value,
        scriptPubKey: output.scriptPubKey,
      } as SpendableDto;

      spendables.push(spendable);
    });

    if (totalValue < value) {
      throw new Error("Insufficient funds");
    }

    return spendables;
  }

  async getUnspents({ address, options = {}, sort = "desc" }: GetUnspentsDTO): Promise<UnspentDto[]> {
    this.logger.log(`getUnspents(${address})`);

    const height = await this.rpc.getBlockCount();
    const unspents: UnspentDto[] = [];

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
      include: {
        inscriptions: true,
      },
      orderBy: {
        value: sort,
      },
    });

    outputs.forEach(async (output) => {
      const outpoint = `${output.voutTxid}:${output.voutTxIndex}`;

      const unspent = {
        txid: output.voutTxid,
        n: output.voutTxIndex,
        sats: output.value,
        scriptPubKey: output.scriptPubKey,
      } as UnspentDto;

      const ordinals = await this.ord.getOrdinals(outpoint);
      const { inscriptions } = output;

      unspent.ordinals = ordinals;
      unspent.inscriptions = inscriptions;
      unspent.safeToSpend = await this.ord.getSafeToSpendState(ordinals, options.allowedRarity);
      unspent.confirmations = height - output.voutBlockHeight + 1;

      if (options.safetospend && !unspent.safeToSpend) {
        return;
      }

      unspents.push(unspent);
    });

    return unspents;
  }
}
