import { Module } from "@nestjs/common";
import { BitcoinModule } from "src/bitcoin/BitcoinModule";

import { InscriptionHandler } from "./handlers/InscriptionsHandler";
import { OutputHandler } from "./handlers/OutputHandler";
import { IndexerTask } from "./IndexerSchedule";
import { IndexerService } from "./IndexerService";

@Module({
  imports: [BitcoinModule],
  providers: [IndexerTask, IndexerService, InscriptionHandler, OutputHandler],
  exports: [],
})
export class IndexerModule {}
