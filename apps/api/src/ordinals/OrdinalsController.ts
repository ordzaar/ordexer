import { Controller, Get, Param } from "@nestjs/common";
import { BitcoinService, OrdProvider } from "@ordzaar/rpcservices";

import { OrdinalsService } from "./OrdinalsService";

@Controller("ordinals")
export class OrdinalsController {
  constructor(
    private bitcoin: BitcoinService,
    private ord: OrdProvider,
    private ordinalsService: OrdinalsService,
  ) {}

  @Get("getInscription/:id")
  async getInscription(@Param("id") id: string) {
    const inscription = await this.ordinalsService.getInscription(id);
    return { inscription };
  }

  @Get("getIncriptionUTXO/:id")
  async getInscriptionUTXO(@Param("id") id: string) {
    const inscriptionUTXO = await this.ordinalsService.getInscriptionUTXO(id);
    return { inscriptionUTXO };
  }

  @Get("getInscriptions/")
  async getInscriptions() {
    const inscriptions = await this.ordinalsService.getInscriptions();
    return { inscriptions };
  }
}
