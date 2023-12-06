import { Controller, Get } from "@nestjs/common";

import { OrdProvider } from "./ord/providers/OrdProvider";

@Controller("ordtest")
export class OrdTestController {
  constructor(private ord: OrdProvider) {}

  @Get("blockheight")
  async getBlockHeight() {
    return this.ord.getHeight();
  }
}