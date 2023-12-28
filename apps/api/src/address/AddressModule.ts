import { Module } from "@nestjs/common";
import { BitcoinModule } from "@ordzaar/bitcoin-service";
import { OrdModule } from "@ordzaar/ord-service";

import { PrismaModule } from "../PrismaModule";
import { AddressController } from "./AddressController";
import { AddressService } from "./AddressService";

@Module({
  imports: [PrismaModule, BitcoinModule, OrdModule],
  providers: [AddressService],
  controllers: [AddressController],
  exports: [],
})
export class AddressModule {}
