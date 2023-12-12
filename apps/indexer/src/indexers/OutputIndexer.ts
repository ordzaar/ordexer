import { Logger } from "@nestjs/common";
import { PrismaPromise } from "@prisma/client";

import { PrismaService } from "../PrismaService";
import { BaseIndexer, VinData, VoutData } from "./BaseIndexer";

export class OutputIndexer extends BaseIndexer  {

  private readonly logger: Logger;

  constructor(
    private prisma: PrismaService,
  ) {
    super("inscription");
    this.logger = new Logger(OutputIndexer.name);
  }

  async start(height: number): Promise<void> {
    this.logger.log("Starting inscription indexer at height", height);
  }

  async index(vins: VinData[], vouts: VoutData[]): Promise<PrismaPromise<any>[]> {

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

    await this.prisma.output.createMany({
      data: outputs,
      skipDuplicates: true,
    });

    const spentUpdates: PrismaPromise<VinRow>[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const vin of vins) {
      spentUpdates.push(
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

    await this.prisma.$transaction(spentUpdates);

    return [];
  }

  async indexBlock(height: number): Promise<PrismaPromise<void>[]> {
    this.logger.log("Indexing block at height", height);
    return [];   
  }

  async indexBlocks(startHeight: number, endHeight: number): Promise<PrismaPromise<void>[]> {
    this.logger.log("Indexing blocks from", startHeight, "to", endHeight);
    return [];   
  }

  async reorg(height: number): Promise<void> {
    this.logger.log("Reorging inscription indexer at height", height);
  }
};

type VoutRow = {
  addresses: string[];
  value: number;
  voutBlockHash: string;
  voutBlockHeight: number;
  voutTxid: string;
  voutTxIndex: number;
}

type VinRow = VoutRow & {
  spent: boolean;
  vinBlockHash: string | null;
  vinBlockHeight: number| null;
  vinTxid: string| null;
  vinTxIndex: number| null;
}
