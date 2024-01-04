import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { btcToSat } from "@ordzaar/bitcoin-service";
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
