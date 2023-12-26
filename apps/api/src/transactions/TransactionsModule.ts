import { Module } from "@nestjs/common";
import { BitcoinModule } from "@ordzaar/bitcoin-service";

import { PrismaModule } from "../PrismaModule";
import { TransactionsController } from "./TransactionsController";

@Module({
  imports: [PrismaModule, BitcoinModule],
  providers: [],
  controllers: [TransactionsController],
  exports: [],
})
export class TransactionsModule {}
