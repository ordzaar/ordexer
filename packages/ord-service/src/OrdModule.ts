import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";

import { OrdProvider } from "./providers/OrdProvider";

@Module({
  imports: [HttpModule],
  providers: [OrdProvider],
  exports: [OrdProvider],
})
export class OrdModule {}
