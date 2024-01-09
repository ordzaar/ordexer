import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BitcoinService } from "@ordzaar/bitcoin-service";
import { getSafeToSpendState, OrdProvider } from "@ordzaar/ord-service";
import { Prisma } from "@prisma/client";
import { ApiPagedResponse } from "src/libs/pagination/ApiPagedResponse";

import { PrismaService } from "../../PrismaService";
import { promiseLimiter } from "../../utils/Promise";
import { GetSpendablesQueryDTO, GetUnspentsQueryDTO, SpendableDTO, SpentOrder, UnspentDTO } from "../models/Address";

@Injectable()
export class AddressService {
  private readonly logger;

  constructor(
    private readonly configService: ConfigService,
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

    const outputPromiseLimiter = promiseLimiter<number>(
      this.configService.getOrThrow<number>("api.addresses.outputPromiseLimiter"),
    );

    outputs.forEach((output) => {
      outputPromiseLimiter.push(async () => {
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
      });
    });

    const outputValues = await outputPromiseLimiter.run();
    const balance = outputValues.reduce((a, b) => a + b, 0);

    return balance;
  }

  async getSpendables(
    address: string,
    { value, safetospend = true, filter = [] }: GetSpendablesQueryDTO,
  ): Promise<SpendableDTO[]> {
    const spendables: SpendableDTO[] = [];
    const valuesArray: number[] = [];

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
    });

    const outputPromiseLimiter = promiseLimiter(
      this.configService.getOrThrow<number>("api.addresses.outputPromiseLimiter"),
    );

    outputs.forEach((output) => {
      outputPromiseLimiter.push(async () => {
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

        valuesArray.push(output.value);

        const spendable = {
          id: output.id,
          txid: output.voutTxid,
          n: output.voutTxIndex,
          sats: output.value,
          scriptPubKey: output.scriptPubKey,
        } as SpendableDTO;

        spendables.push(spendable);
      });
    });

    await outputPromiseLimiter.run();

    const totalValue = valuesArray.reduce((a, b) => a + b, 0);

    if (totalValue < value) {
      throw new Error("Insufficient funds");
    }

    return spendables;
  }

  async getUnspents(
    address: string,
    { allowedRarity, safetospend, orderBy, next, size }: GetUnspentsQueryDTO,
  ): Promise<ApiPagedResponse<UnspentDTO>> {
    const spentListOrder = this.getSpentListOrderBy(orderBy);

    const [height, outputs] = await Promise.all([
      this.rpc.getBlockCount(),
      this.prisma.output.findMany({
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
      }),
    ]);

    const outputPromiseLimiter = promiseLimiter<UnspentDTO | null>(
      this.configService.getOrThrow<number>("api.addresses.outputPromiseLimiter"),
    );

    outputs.forEach((output) => {
      outputPromiseLimiter.push(async () => {
        const unspent = {
          id: output.id,
          txid: output.voutTxid,
          n: output.voutTxIndex,
          sats: output.value,
          scriptPubKey: output.scriptPubKey,
        } as UnspentDTO;

        const { inscriptions } = output;

        const outpoint = `${output.voutTxid}:${output.voutTxIndex}`;
        const ordinals = await this.ord.getOrdinals(outpoint);
        unspent.ordinals = ordinals;
        unspent.safeToSpend = await getSafeToSpendState(ordinals, allowedRarity);
        unspent.inscriptions = inscriptions;
        unspent.confirmations = height - output.voutBlockHeight + 1;

        if (safetospend && !unspent.safeToSpend) {
          return null;
        }

        return unspent;
      });
    });

    const unspents = (await outputPromiseLimiter.run()).filter((v) => v !== null) as UnspentDTO[];

    return ApiPagedResponse.of(unspents, size, (unspent) => unspent.id);
  }

  private getSpentListOrderBy(orderBy?: SpentOrder): Prisma.OutputOrderByWithRelationInput {
    const spentOrderByConfig: Record<SpentOrder, Prisma.OutputOrderByWithRelationInput> = {
      [SpentOrder.SATS_ASCENDING]: { value: Prisma.SortOrder.asc },
      [SpentOrder.SATS_DESCENDING]: { value: Prisma.SortOrder.desc },
    };
    return orderBy === undefined ? spentOrderByConfig[SpentOrder.SATS_DESCENDING] : spentOrderByConfig[orderBy];
  }
}
