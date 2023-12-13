import { Module } from "@nestjs/common";

import { BitcoinService } from "./BitcoinService";

@Module({
    providers: [ BitcoinService ],
    exports:[ BitcoinService ],
})
export class BitcoinModule {}
