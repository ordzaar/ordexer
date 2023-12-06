import { Module } from "@nestjs/common";

import { RpcProvider } from "./providers/RpcProvider";

@Module({
    providers: [ RpcProvider ],
    exports:[ RpcProvider ],
})
export class BitcoinRpcModule {}
