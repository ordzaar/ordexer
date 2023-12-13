import { Injectable, Logger } from "@nestjs/common";
import { PrismaPromise } from "@prisma/client";
import { ScriptPubKey } from "src/bitcoin/BitcoinService";

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

  async commit(vins: VinData[], vouts: VoutData[], dbOperations: PrismaPromise<any>[]): Promise<void> {
    this.logger.log("commiting output");

    const outputs: VoutRow[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const vout of vouts) {
      outputs.push({
        addresses: vout.addresses,
        value: vout.value,
        scriptPubKey: vout.scriptPubKey,
        voutBlockHash: vout.block.hash,
        voutBlockHeight: vout.block.height,
        voutTxid: vout.txid,
        voutTxIndex: vout.n,
      })
    }

    dbOperations.push(this.prisma.output.createMany({
      data: outputs,
      skipDuplicates: true,
    }));

    // eslint-disable-next-line no-restricted-syntax
    for (const vin of vins) {
      dbOperations.push(
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
    };
  }

  async reorg(fromHeight: number, dbOperations: PrismaPromise<any>[]): Promise<void> {
    this.logger.log(`reorging output from height ${fromHeight}`);
    dbOperations.push(this.prisma.output.deleteMany({
      where: {
        voutBlockHeight: {
          gte: fromHeight,
        },
      },
    }));
    // TODO: update spent outputs
  }
}

type VoutRow = {
  addresses: string[];
  value: number;
  scriptPubKey: ScriptPubKey;
  voutBlockHash: string;
  voutBlockHeight: number;
  voutTxid: string;
  voutTxIndex: number;
}
