import { Injectable, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { ITXClientDenyList, Omit } from "@prisma/client/runtime/library";

import { OrdInscription, OrdProvider } from "../../ord/providers/OrdProvider";
import { VinData, VoutData } from "../types";
import { Envelope } from "../utils/Envelope";
import { getInscriptionFromEnvelope, Inscription as RawInscription } from "../utils/Inscription";
import { INSCRIPTION_EPOCH_BLOCK } from "../utils/Network";
import { isOIP2Meta, validateOIP2Meta } from "../utils/Oip";
import { parseLocation } from "../utils/Transaction";
import { BaseIndexerHandler } from "./BaseHandler";

@Injectable()
export class InscriptionHandler extends BaseIndexerHandler {
  private readonly logger: Logger;

  constructor(private ord: OrdProvider) {
    super();
    this.logger = new Logger(InscriptionHandler.name);
  }

  /**
   * Commits chunk of inscriptions to the database.
   * We use transactions in commiting. If any of the queries fail, the whole transaction is rolled back.
   * This ensures that we don't have any partial data in the database, which may cause future issues.
   *
   * @param lastBlockHeight - height of the last block in the chunk
   * @param vins - array of vins
   * @param vouts - array of vouts
   * @param prismaTx - prisma transaction
   */
  async commit(
    lastBlockHeight: number,
    vins: VinData[],
    _: VoutData[],
    prismaTx: Omit<PrismaClient, ITXClientDenyList>,
  ): Promise<void> {
    if (lastBlockHeight < INSCRIPTION_EPOCH_BLOCK) {
      this.logger.log("inscriptions indexer has not passed epoch block");
      return;
    }

    this.logger.log("[INSCRIPTION_HANDLER|COMMIT] commiting insription..");

    // Wait for the block to be indexed by Ord Server
    // Ord server may be slightly behind the Bitcoin Node as it needs to index new blocks
    await this.ord.waitForBlock(lastBlockHeight);

    // Extracts inscriptions from vins
    const inscriptions = await this.getInscriptions(vins, prismaTx);

    // Inserts new inscriptions into the database
    await this.insertInscriptions(inscriptions, prismaTx);

    // Updates inscriptions that have been transferred to new owners
    await this.transferInscriptions(
      vins.map(({ vout }) => `${vout.txid}:${vout.n}`),
      prismaTx,
    );
  }

  async reorg(fromHeight: number, prismaTx: Omit<PrismaClient, ITXClientDenyList>): Promise<void> {
    await prismaTx.inscription.deleteMany({
      where: {
        height: {
          gte: fromHeight,
        },
      },
    });
  }

  /**
   * Extracts inscriptions from vins.
   *
   * @param vins - array of vins
   * @param prismaTx - prisma transaction
   */
  async getInscriptions(vins: VinData[], prismaTx: Omit<PrismaClient, ITXClientDenyList>) {
    const envelopes: Envelope[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const vin of vins) {
      const envelope = Envelope.fromTxinWitness(vin.txid, vin.witness);
      if (envelope && envelope.isValid) {
        envelopes.push(envelope);
      }
    }

    const ordData = new Map<string, OrdInscription>();
    const chunkSize = 5_000;
    for (let i = 0; i < envelopes.length; i += chunkSize) {
      const chunk = envelopes.slice(i, i + chunkSize);
      const data = await this.ord.getInscriptionsForIds(chunk.map((item) => item.id));
      // eslint-disable-next-line no-restricted-syntax
      for (const item of data) {
        ordData.set(item.inscription_id, item);
      }
    }

    const inscriptions: RawInscription[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const envelope of envelopes) {
      const inscription = await getInscriptionFromEnvelope(prismaTx, envelope, ordData);
      if (inscription !== undefined) {
        inscriptions.push(inscription);
      }
    }
    return inscriptions;
  }

  /**
   * Inserts inscriptions into the database.
   *
   * @param rawInscriptions - array of inscriptions
   * @param prismaTx - prisma transaction
   */
  async insertInscriptions(rawInscriptions: RawInscription[], prismaTx: Omit<PrismaClient, ITXClientDenyList>) {
    const inscriptions: Inscription[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const inscription of rawInscriptions) {
      const output = await prismaTx.output.findUniqueOrThrow({
        where: {
          voutTxid_voutTxIndex: {
            voutTxid: inscription.outpoint.split(":")[0],
            voutTxIndex: parseInt(inscription.outpoint.split(":")[1], 10),
          },
        },
      });
      const entry: Partial<Inscription> = {
        inscriptionId: inscription.id,
        creator: inscription.creator,
        owner: inscription.owner,
        sat: inscription.sat,
        mimeType: inscription.media.mime.type,
        mimeSubtype: inscription.media.mime.subtype,
        mediaType: inscription.media.type,
        mediaCharset: inscription.media.charset,
        mediaSize: inscription.media.size,
        mediaContent: inscription.media.content,
        timestamp: inscription.timestamp,
        height: inscription.height,
        fee: inscription.fee,
        genesis: inscription.genesis,
        number: inscription.number,
        outpoint: inscription.outpoint,
        ometa: inscription.meta,
        outputId: output.id,
      };
      if (inscription.oip) {
        entry.meta = inscription.oip;
        if (isOIP2Meta(inscription.oip)) {
          entry.verified = await validateOIP2Meta(prismaTx, inscription.oip);
        }
      }

      inscriptions.push(entry as Inscription);
    }

    await prismaTx.inscription.createMany({
      data: inscriptions,
      skipDuplicates: true,
    });
  }

  /**
   * Transfers inscriptions to new owners.
   *
   * @param outpoints - array of outpoints
   * @param prismaTx - prisma transaction
   */
  async transferInscriptions(outpoints: string[], prismaTx: Omit<PrismaClient, ITXClientDenyList>) {
    if (outpoints.length === 0) {
      return 0;
    }

    let count = 0;

    const chunkSize = 10_000;
    for (let i = 0; i < outpoints.length; i += chunkSize) {
      const chunk = outpoints.slice(i, i + chunkSize);
      const docs = await prismaTx.inscription.findMany({
        where: {
          outpoint: {
            in: chunk,
          },
        },
        select: {
          id: true,
        },
      });
      await this.commitTransfers(
        docs.map((doc) => doc.id),
        prismaTx,
      );
      count += docs.length;
    }

    return count;
  }

  /**
   * Helper method to commit transfers to the database.
   *
   * @param ids - array of inscription ids
   * @param prismaTx - prisma transaction
   */
  async commitTransfers(ids: string[], prismaTx: Omit<PrismaClient, ITXClientDenyList>) {
    const chunkSize = 5_000;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const data = await this.ord.getInscriptionsForIds(chunk);
      // eslint-disable-next-line no-restricted-syntax
      for (const item of data) {
        const [txid, n] = parseLocation(item.satpoint);
        const output = await prismaTx.output.findUnique({
          where: {
            voutTxid_voutTxIndex: {
              voutTxid: txid,
              voutTxIndex: n,
            },
          },
        });

        await prismaTx.inscription.update({
          where: {
            inscriptionId: item.inscription_id,
          },
          data: {
            owner: output?.addresses[0] ?? "",
            outpoint: `${txid}:${n}`,
          },
        });
      }
    }
  }
}

export type Inscription = {
  inscriptionId: string;
  parent?: string;
  children: string[];
  creator: string;
  owner?: string;
  sat: number;
  mimeType: string;
  mimeSubtype: string;
  mediaType: string;
  mediaCharset: string;
  mediaSize: number;
  mediaContent: string;
  timestamp: number;
  height: number;
  fee: number;
  genesis: string;
  number: number;
  sequence: number;
  outpoint: string;
  ethereum: string;
  ometa?: any;
  meta?: any;
  verified?: boolean;
  outputId: string;
};
