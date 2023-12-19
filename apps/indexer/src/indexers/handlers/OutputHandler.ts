import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, PrismaClient, PrismaPromise } from "@prisma/client";
import { ITXClientDenyList, Omit } from "@prisma/client/runtime/library";
import { ScriptPubKey } from "src/bitcoin/BitcoinService";
import { perf } from "src/utils/Log";
import { promiseLimiter } from "src/utils/Promise";

import { VinData, VoutData } from "../types";
import { BaseIndexerHandler } from "./BaseHandler";

@Injectable()
export class OutputHandler extends BaseIndexerHandler {
  private readonly logger: Logger;

  constructor(private readonly configService: ConfigService) {
    super();
    this.logger = new Logger(OutputHandler.name);
  }

  async commit(
    _: number,
    vins: VinData[],
    vouts: VoutData[],
    prismaTx: Omit<PrismaClient, ITXClientDenyList>,
  ): Promise<void> {
    this.logger.log("[OUTPUT_HANDLER|COMMIT] commiting output..");

    const insertingOutputsTs = perf();
    const outputPrismaPromises: PrismaPromise<Prisma.BatchPayload>[] = [];
    let outputsCunk: VoutRow[] = [];
    for (let i = 0; i < vouts.length; i += 1) {
      outputsCunk.push({
        addresses: vouts[i].addresses,
        value: vouts[i].value,
        scriptPubKey: vouts[i].scriptPubKey,
        voutBlockHash: vouts[i].block.hash,
        voutBlockHeight: vouts[i].block.height,
        voutTxid: vouts[i].txid,
        voutTxIndex: vouts[i].n,
      });
      if (
        outputsCunk.length % this.configService.get<number>("indexer.outputHandler.insertChunk")! === 0 ||
        i === vouts.length - 1
      ) {
        outputPrismaPromises.push(
          prismaTx.output.createMany({
            data: outputsCunk,
            skipDuplicates: true,
          }),
        );
        outputsCunk = [];
      }
    }
    await Promise.all(outputPrismaPromises);
    this.logger.log(
      `[OUTPUT_HANDLER|COMMIT] inserting ${vouts.length} data to output tx, took ${insertingOutputsTs.now} s`,
    );

    const updatingOutputsTs = perf();
    const outputUpdate = prismaTx.output.update;
    const updatePromiseLimiter = promiseLimiter(
      this.configService.get<number>("indexer.outputHandler.updatePromiseLimiter")!,
    );
    for (let i = 0; i < vins.length; i += 1) {
      updatePromiseLimiter.push(async () =>
        outputUpdate({
          where: {
            voutTxid_voutTxIndex: {
              voutTxid: vins[i].vout.txid,
              voutTxIndex: vins[i].vout.n,
            },
          },
          data: {
            spent: true,
            vinBlockHash: vins[i].block.hash,
            vinBlockHeight: vins[i].block.height,
            vinTxid: vins[i].txid,
            vinTxIndex: vins[i].n,
          },
        }),
      );
    }
    await updatePromiseLimiter.run();
    this.logger.log(
      `[OUTPUT_HANDLER|COMMIT] updating ${vins.length} data to output tx, took ${updatingOutputsTs.now} s`,
    );
  }

  async reorg(fromHeight: number, prismaTx: Omit<PrismaClient, ITXClientDenyList>): Promise<void> {
    this.logger.log(`[OUTPUT_HANDLER|REORG] reorging output from height ${fromHeight}..`);
    await prismaTx.output.deleteMany({
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
  scriptPubKey: ScriptPubKey;
  voutBlockHash: string;
  voutBlockHeight: number;
  voutTxid: string;
  voutTxIndex: number;
};
