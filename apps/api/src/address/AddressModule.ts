import { Module } from "@nestjs/common";
import { BitcoinModule } from "@ordzaar/bitcoin-service";
import { OrdModule } from "@ordzaar/ord-service";

import { PrismaModule } from "../PrismaModule";
import { AddressController } from "./AddressController";
import { AddressRpcHandler } from "./AddressRpcHandler";
import { AddressService } from "./AddressService";

@Module({
  imports: [PrismaModule, BitcoinModule, OrdModule],
  providers: [AddressService, AddressRpcHandler],
  controllers: [AddressController],
  exports: [AddressRpcHandler],
})
export class AddressModule {}
