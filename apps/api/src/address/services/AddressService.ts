import { Injectable, Logger } from "@nestjs/common";
import { BitcoinService } from "@ordzaar/bitcoin-service";
import { getSafeToSpendState, OrdProvider } from "@ordzaar/ord-service";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../PrismaService";
import { GetSpendablesQueryDTO, GetUnspentsQueryDTO, SpendableDTO, SpentOrder, UnspentDTO } from "../models/Address";

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

  async getBalance(address: string): Promise<number> {
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

  async getSpendables(
    address: string,
    { value, safetospend = true, filter = [], orderBy, next, size }: GetSpendablesQueryDTO,
  ): Promise<SpendableDTO[]> {
    const spendables: SpendableDTO[] = [];
    let totalValue = 0;

    const spentListOrder = this.getSpentListOrderBy(orderBy);

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
      orderBy: [spentListOrder],
      cursor: next ? { id: next } : undefined,
      take: size + 1, // to get extra 1 to check for next page
    });

    outputs.forEach(async (output) => {
      const outpoint = `${output.voutTxid}:${output.voutTxIndex}`;

      if (filter.includes(outpoint)) {
        return;
      }

      if (safetospend) {
        const ordinals = await this.ord.getOrdinals(outpoint);
        const safeToSpend = await getSafeToSpendState(ordinals);
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
      } as SpendableDTO;

      spendables.push(spendable);
    });

    if (totalValue < value) {
      throw new Error("Insufficient funds");
    }

    return spendables;
  }

  async getUnspents(
    address: string,
    { allowedRarity, safetospend, orderBy, next, size }: GetUnspentsQueryDTO,
  ): Promise<UnspentDTO[]> {
    const height = await this.rpc.getBlockCount();
    const unspents: UnspentDTO[] = [];

    const spentListOrder = this.getSpentListOrderBy(orderBy);

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
      orderBy: [spentListOrder],
      cursor: next ? { id: next } : undefined,
      take: size + 1, // to get extra 1 to check for next page
    });

    outputs.forEach(async (output) => {
      const outpoint = `${output.voutTxid}:${output.voutTxIndex}`;

      const unspent = {
        txid: output.voutTxid,
        n: output.voutTxIndex,
        sats: output.value,
        scriptPubKey: output.scriptPubKey,
      } as UnspentDTO;

      const ordinals = await this.ord.getOrdinals(outpoint);
      const { inscriptions } = output;

      unspent.ordinals = ordinals;
      unspent.inscriptions = inscriptions;
      unspent.safeToSpend = await getSafeToSpendState(ordinals, allowedRarity);
      unspent.confirmations = height - output.voutBlockHeight + 1;

      if (safetospend && !unspent.safeToSpend) {
        return;
      }

      unspents.push(unspent);
    });

    return unspents;
  }

  private getSpentListOrderBy(orderBy?: SpentOrder): Prisma.OutputOrderByWithRelationInput {
    const spentOrderByConfig: Record<SpentOrder, Prisma.OutputOrderByWithRelationInput> = {
      [SpentOrder.VALUE_ASCENDING]: { value: Prisma.SortOrder.asc },
      [SpentOrder.VALUE_DESCENDING]: { value: Prisma.SortOrder.desc },
    };
    return orderBy === undefined ? spentOrderByConfig[SpentOrder.VALUE_DESCENDING] : spentOrderByConfig[orderBy];
  }
}
