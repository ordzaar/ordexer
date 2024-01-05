import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { BitcoinService } from "@ordzaar/bitcoin-service";
import { OrdProvider } from "@ordzaar/ord-service";

import { GetInscriptionsDTO } from "../models/Ordinals";
import { OrdinalsService } from "../services/OrdinalsService";

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

  @Post("getInscriptions/")
  async getInscriptions(@Body() getInscriptionsDTO: GetInscriptionsDTO) {
    const inscriptions = await this.ordinalsService.getInscriptions(getInscriptionsDTO);
    return { inscriptions };
  }
}
