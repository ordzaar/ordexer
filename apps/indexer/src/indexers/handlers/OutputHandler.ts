import { Injectable, Logger } from "@nestjs/common";
import { PrismaPromise } from "@prisma/client";

import { PrismaService } from "../../PrismaService";
import { VinData, VoutData } from "../types";
import { BaseIndexerHandler } from "./BaseHandler";

@Injectable()
export class OutputHandler extends BaseIndexerHandler {

  private readonly logger: Logger;

  constructor(
    private prisma: PrismaService,
  ) {
    super();
    this.logger = new Logger(OutputHandler.name);
  }

  async commit(vins: VinData[], vouts: VoutData[], prismaPromises: PrismaPromise<any>[]): Promise<void> {
    this.logger.log("commiting output");

    const transactions: PrismaPromise<any>[] = [];
    const outputs: VoutRow[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const vout of vouts) {
      outputs.push({
        addresses: vout.addresses,
        value: vout.value,
        voutBlockHash: vout.block.hash,
        voutBlockHeight: vout.block.height,
        voutTxid: vout.txid,
        voutTxIndex: vout.n,
      })
    }

    transactions.push(this.prisma.output.createMany({
      data: outputs,
      skipDuplicates: true,
    }));

    // eslint-disable-next-line no-restricted-syntax
    for (const vin of vins) {
      transactions.push(
        this.prisma.output.update({
          where: {
            voutTxid_voutTxIndex: {
              voutTxid: vin.vout.txid,
              voutTxIndex: vin.vout.n,
            },
          },
          data: {
            spent: true,
            vinBlockHash: vin.block.hash,
            vinBlockHeight: vin.block.height,
            vinTxid: vin.txid,
            vinTxIndex: vin.n,
          }
        })
      );
    }
    return transactions;
  }

  async reorg(fromHeight: number, prismaPromises: PrismaPromise<any>[]): Promise<void> {
    this.logger.log(`reorging output from height ${fromHeight}`);
    await this.prisma.output.deleteMany({
      where: {
        voutBlockHeight: {
          gte: fromHeight,
        },
      },
    });
    // TODO: update spent outputs
  }
}

type VoutRow = {
  addresses: string[];
  value: number;
  voutBlockHash: string;
  voutBlockHeight: number;
  voutTxid: string;
  voutTxIndex: number;
}
