import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";

import { PrismaHealthIndicator } from "../health/PrismaHealth";
import { HealthController } from "../HealthController";
import { PrismaModule } from "../PrismaModule";

@Module({
  imports: [TerminusModule, HttpModule, PrismaModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator],
})
export class HealthModule {}
