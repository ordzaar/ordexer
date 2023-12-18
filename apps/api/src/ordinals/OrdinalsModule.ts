import { Module } from "@nestjs/common";
import { BitcoinModule, OrdModule } from "@ordzaar/rpcservices";

import { PrismaModule } from "../PrismaModule";
import { OrdinalsController } from "./OrdinalsController";

@Module({
  imports: [PrismaModule, BitcoinModule, OrdModule],
  providers: [],
  controllers: [OrdinalsController],
  exports: [],
})
export class OrdinalsModule {}
