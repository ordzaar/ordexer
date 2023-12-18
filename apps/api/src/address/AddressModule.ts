import { Module } from "@nestjs/common";
import { BitcoinModule, OrdModule } from "@ordzaar/rpcservices";

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
