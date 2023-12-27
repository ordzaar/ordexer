import { Module } from "@nestjs/common";

import { AddressRpcHandler } from "./AddressRpcHandler";

@Module({
  imports: [],
  providers: [AddressRpcHandler],
  exports: [AddressRpcHandler],
})
export class AddressModule {}
