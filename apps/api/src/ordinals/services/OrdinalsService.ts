import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BitcoinService, btcToSat, parseLocation } from "@ordzaar/bitcoin-service";
import { OrdProvider } from "@ordzaar/ord-service";
import { Inscription } from "@prisma/client";

import { PrismaService } from "../../PrismaService";
import { GetInscriptionsDTO } from "../models/Ordinals";

@Injectable()
export class OrdinalsService {
  private readonly logger;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly rpc: BitcoinService,
    private readonly ord: OrdProvider,
  ) {
    this.logger = new Logger(OrdinalsService.name);
  }

  async getInscription(id: string): Promise<any> {
    const inscription = await this.ord.getInscription(id);
    return { inscription };
  }

  async getInscriptionUTXO(id: string): Promise<any> {
    this.logger.log(`getInscriptionUTXO(${id})`);
    return {};
  }

  async getInscriptionUTXOHelper(id: string, attempts: number): Promise<any> {
    this.logger.log(`getInscriptionUTXO(${id})`);
    const inscription = await this.prisma.inscription.findUnique({
      where: {
        inscriptionId: id,
      },
    });

    if (!inscription) {
      return {};
    }

    const [txid, n] = parseLocation(inscription.outpoint);

    const output = await this.prisma.output.findUnique({
      where: {
        voutTxid_voutTxIndex: {
          voutTxid: txid,
          voutTxIndex: n,
        },
      },
    });

    if (output?.vinTxid !== null && output?.vinTxIndex !== null) {
      const data = await this.ord.getInscription(id);
      if (data === undefined || attempts > 3) {
        throw new Error("Unable to resolve utxo from inscription state");
      }
      const [inscriptionTxid, inscriptionN] = data.satpoint.split(":");
      await this.prisma.inscription.update({
        where: {
          inscriptionId: id,
        },
        data: {
          owner: data.address,
          outpoint: `${inscriptionTxid}:${inscriptionN}`,
        },
      });
      return this.getInscriptionUTXOHelper(id, attempts + 1);
    }

    const tx = await this.rpc.getRawTransaction(txid, true);
    if (tx === undefined) {
      throw new Error("Blockchain transaction not found");
    }

    const vout = tx.vout[n];
    if (vout === undefined) {
      throw new Error("Blockchain vout not found");
    }

    const height = await this.rpc.getBlockCount();

    return {
      txid,
      n,
      sats: btcToSat(vout.value),
      scriptPubKey: vout.scriptPubKey,
      safeToSpend: false,
      confirmations: height - output.voutBlockHeight + 1,
    };
  }

  async getInscriptions({
    params = {},
    sort = { key: "number", order: "asc" },
    include,
  }: GetInscriptionsDTO): Promise<any> {
    const apiUrl = this.configService.get<string>("api.url");
    let inscriptions = await this.prisma.inscription.findMany({
      where: {
        creator: params.creator,
        owner: params.owner,
        mimeType: params.mimeType,
        mimeSubtype: params.mimeSubtype,
      },
      orderBy: {
        [sort.key]: sort.order,
      },
    });

    inscriptions.forEach(async (inscription) => {
      // eslint-disable-next-line no-param-reassign
      (inscription as any).mediaContent = `${apiUrl}/content/${inscription.id}`;
    });

    if (include?.includes("value")) {
      inscriptions = await this.includeInscriptionValue(inscriptions);
    }
    return inscriptions;
  }

  async includeInscriptionValue(inscriptions: Inscription[]): Promise<WithValue[]> {
    const outputIds = inscriptions.map((inscription) => inscription.outputId) as string[];
    const data = await this.prisma.output.findMany({
      where: {
        id: {
          in: outputIds,
        },
      },
    });

    return inscriptions.map((inscription) => {
      const utxo = data.find((output) => `${output.voutTxid}:${output.voutTxIndex}` === inscription.outpoint);
      if (utxo) {
        return {
          ...inscription,
          value: btcToSat(utxo.value),
        };
      }
      return inscription;
    }) as WithValue[];
  }
}

type WithValue = Inscription & { $cursor: string; value: number };
