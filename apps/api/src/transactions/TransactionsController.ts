import { Controller, Get, Param, Post } from "@nestjs/common";
import { BitcoinService } from "@ordzaar/rpcservices";

import { TransactionsService } from "./TransactionsService";

@Controller("transactions")
export class TransactionsController {
  constructor(
    private bitcoin: BitcoinService,
    private transactionsService: TransactionsService,
  ) {}

  @Get("getTransaction/:txid")
  async getTransaction(@Param("txid") txid: string) {
    const transaction = await this.transactionsService.getTransaction(txid);
    return { transaction };
  }

  @Post("relay")
  async relay() {
    const relay = await this.transactionsService.relay();
    return { relay };
  }
}
