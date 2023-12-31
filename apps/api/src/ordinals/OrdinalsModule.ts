import { Module } from "@nestjs/common";
import { BitcoinModule } from "@ordzaar/bitcoin-service";
import { OrdModule } from "@ordzaar/ord-service";

import { PrismaModule } from "../PrismaModule";
import { OrdinalsController } from "./OrdinalsController";
import { OrdinalsService } from "./OrdinalsService";

@Module({
  imports: [PrismaModule, BitcoinModule, OrdModule],
  providers: [OrdinalsService],
  controllers: [OrdinalsController],
  exports: [],
})
export class OrdinalsModule {}
