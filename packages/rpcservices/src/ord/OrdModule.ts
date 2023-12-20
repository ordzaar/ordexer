import { Module } from "@nestjs/common";

import { OrdProvider } from "./providers/OrdProvider";

@Module({
  providers: [OrdProvider],
  exports: [OrdProvider],
})
export class OrdModule {}
