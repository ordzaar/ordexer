import { Module } from "@nestjs/common";
import { BitcoinModule } from "@ordzaar/bitcoin-service";
import { OrdModule } from "@ordzaar/ord-service";

import { PrismaModule } from "../PrismaModule";
import { AddressRpcHandler } from "./AddressRpcHandler";
import { AddressController } from "./controllers/AddressController";
import { AddressService } from "./services/AddressService";

@Module({
  imports: [PrismaModule, BitcoinModule, OrdModule],
  providers: [AddressService, AddressRpcHandler],
  controllers: [AddressController],
  exports: [AddressRpcHandler],
})
export class AddressModule {}
