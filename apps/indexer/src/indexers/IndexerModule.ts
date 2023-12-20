import { Module } from "@nestjs/common";
import { BitcoinModule } from "@ordzaar/rpcservices";

import { OrdModule } from "../ord/OrdModule";
import { PrismaService } from "../PrismaService";
import { InscriptionHandler } from "./handlers/InscriptionsHandler";
import { OutputHandler } from "./handlers/OutputHandler";
import { IndexerTask } from "./IndexerSchedule";
import { IndexerService } from "./IndexerService";

@Module({
  imports: [BitcoinModule, OrdModule],
  providers: [IndexerTask, IndexerService, InscriptionHandler, OutputHandler, PrismaService],
  exports: [],
})
export class IndexerModule {}
