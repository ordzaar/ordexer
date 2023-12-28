import { Module } from "@nestjs/common";
import { BitcoinModule } from "@ordzaar/bitcoin-service";

import { PrismaModule } from "../PrismaModule";
import { TransactionsController } from "./controllers/TransactionsController";
import { TransactionsRpcHandler } from "./controllers/TransactionsRpcHandler";
import { TransactionsService } from "./services/TransactionsService";

@Module({
  imports: [PrismaModule, BitcoinModule],
  providers: [TransactionsService, TransactionsRpcHandler],
  controllers: [TransactionsController],
  exports: [TransactionsRpcHandler],
})
export class TransactionsModule {}
