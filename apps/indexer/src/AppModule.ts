import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard } from "@nestjs/throttler";

import { appConfig, ENV_VALIDATION_SCHEMA } from "./AppConfig";
import { BitcoinRpcModule } from "./bitcoinrpc/BitcoinRpcModule";
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
    BitcoinRpcModule,
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
  ],
  controllers: [
    OrdTestController,
    RpcTestController,
  ],
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
