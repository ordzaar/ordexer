import { Module } from "@nestjs/common";
import { BitcoinModule } from "@ordzaar/bitcoin-service";

import { PrismaModule } from "../PrismaModule";
import { TransactionsController } from "./TransactionsController";
import { TransactionsService } from "./TransactionsService";

@Module({
  imports: [PrismaModule, BitcoinModule],
  providers: [TransactionsService],
  controllers: [TransactionsController],
  exports: [],
})
export class TransactionsModule {}
