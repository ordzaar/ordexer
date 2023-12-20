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

  /**
   * Commits chunk of vouts and vins to the database.
   * We use transactions in commiting. If any of the queries fail, the whole transaction is rolled back.
   * This ensures that we don't have any partial data in the database, which may cause future issues. For example, an output that has an unsuccessfully commit vin may be returned as spendable.
   *
   * @param lastBlockHeight - height of the last block in the chunk
   * @param vins - array of vins
   * @param vouts - array of vouts
   * @param prismaTx - prisma transaction
   */
  async commit(
    _: number,
    vins: VinData[],
    vouts: VoutData[],
    prismaTx: Omit<PrismaClient, ITXClientDenyList>,
  ): Promise<void> {
    this.logger.log("[OUTPUT_HANDLER|COMMIT] Committing output..");

    // Outputs are inserted in chunks to improve performance
    // Chunk size is defined in config
    const insertingOutputsTs = perf();
    const outputPrismaPromises: PrismaPromise<Prisma.BatchPayload>[] = [];
    const chunkSize = this.configService.getOrThrow<number>("indexer.outputHandler.insertChunk");
    let outputsChunk: VoutRow[] = [];
    for (let i = 0; i < vouts.length; i += 1) {
      outputsChunk.push({
        addresses: vouts[i].addresses,
        value: vouts[i].value,
        scriptPubKey: vouts[i].scriptPubKey,
        voutBlockHash: vouts[i].block.hash,
        voutBlockHeight: vouts[i].block.height,
        voutTxid: vouts[i].txid,
        voutTxIndex: vouts[i].n,
      });
      // Once we hit chunk size, or we are at the end of the array, we add the chunk query to the array
      if (outputsChunk.length % chunkSize === 0 || i === vouts.length - 1) {
        outputPrismaPromises.push(
          prismaTx.output.createMany({
            data: outputsChunk,
            skipDuplicates: true,
          }),
        );
        outputsChunk = [];
      }
    }
    await Promise.all(outputPrismaPromises);
    this.logger.log(
      `[OUTPUT_HANDLER|COMMIT] inserting ${vouts.length} data to output tx, took ${insertingOutputsTs.now} s`,
    );

    // Update spent outputs by looping vins
    // This updates an output whose vout was inserted in the past
    // There should not be a vin for an output that was not inserted
    // Use the concurrency limiter when updating data to the output db
    // Instead of looping and waiting for the update process one by one
    // We can speed up the update of x number of data at the same time.
    const updatingOutputsTs = perf();
    const outputUpdate = prismaTx.output.update;
    const updatePromiseLimiter = promiseLimiter(
      this.configService.getOrThrow<number>("indexer.outputHandler.updatePromiseLimiter"),
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
