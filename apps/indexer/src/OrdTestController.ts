import { Controller, Get, Param } from "@nestjs/common";

import { OrdProvider } from "./ord/providers/OrdProvider";

@Controller("ordtest")
export class OrdTestController {
  constructor(private ord: OrdProvider) {}

  @Get("blockheight")
  async getBlockHeight() {
    return this.ord.getHeight();
  }

  @Get("inscription/:id")
  async getInscription(@Param("id") id: string) {
    return this.ord.getInscription(id);
  }
}
