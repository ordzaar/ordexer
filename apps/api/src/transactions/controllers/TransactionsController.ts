import { Body, Controller, Post } from "@nestjs/common";
import { BitcoinService } from "@ordzaar/bitcoin-service";

import { GetTransactionDTO } from "../models/Transactions";
import { TransactionsService } from "../services/TransactionsService";

@Controller("transactions")
export class TransactionsController {
  constructor(
    private bitcoin: BitcoinService,
    private transactionsService: TransactionsService,
  ) {}

  @Post("getTransaction/:txid")
  async getTransaction(@Body() getTransactionOptions: GetTransactionDTO) {
    const transaction = await this.transactionsService.getTransaction(getTransactionOptions);
    return { transaction };
  }

  @Post("relay")
  async relay() {
    const relay = await this.transactionsService.relay();
    return { relay };
  }
}
