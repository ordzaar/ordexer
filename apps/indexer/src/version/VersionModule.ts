import { Module } from "@nestjs/common";

import { SemaphoreCache } from "../libs/caches/SemaphoreCache";
import { VersionController } from "./VersionController";

@Module({
  providers: [SemaphoreCache],
  controllers: [VersionController],
})
export class VersionModule {}
