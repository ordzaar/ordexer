import { Module } from "@nestjs/common";

import { IndexerTask } from "./IndexerSchedule";
import { BitcoinModule } from "src/bitcoin/BitcoinModule";
import { IndexerService } from "./IndexerService";
import { InscriptionHandler } from "./handlers/InscriptionsHandler";
import { OutputHandler } from "./handlers/OutputHandler";

@Module({
  imports: [BitcoinModule],
  providers: [IndexerTask, IndexerService, InscriptionHandler, OutputHandler],
  exports: [],
})
export class IndexerModule { }
