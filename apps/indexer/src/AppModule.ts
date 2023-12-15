import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard } from "@nestjs/throttler";

import { appConfig, ENV_VALIDATION_SCHEMA } from "./AppConfig";
import { BitcoinModule } from "./bitcoin/BitcoinModule";
import { IndexerModule } from "./indexers/IndexerModule";
import { CustomCacheInterceptor } from "./interceptors/CustomCacheInterceptor";
import { CustomCacheModule } from "./modules/CustomCacheModule";
import { CustomThrottlerModule } from "./modules/CustomThrottlerModule";
import { HealthModule } from "./modules/HealthModule";
import { OrdModule } from "./ord/OrdModule";
import { OrdTestController } from "./OrdTestController";
import { RpcTestController } from "./RpcTestController";
import { VersionModule } from "./version/VersionModule";

@Module({
  imports: [
    BitcoinModule,
    CustomCacheModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema: ENV_VALIDATION_SCHEMA,
    }),
    CustomThrottlerModule,
    HealthModule,
    OrdModule,
    VersionModule,
    ScheduleModule.forRoot(),
    IndexerModule,
  ],
  controllers: [OrdTestController, RpcTestController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useExisting: CustomCacheInterceptor,
    },
    CustomCacheInterceptor,
  ],
})
export class AppModule {}
