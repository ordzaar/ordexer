import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, RouterModule } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { appConfig, ENV_VALIDATION_SCHEMA } from './AppConfig';
import { CustomCacheInterceptor } from './interceptors/CustomCacheInterceptor';
import { CustomCacheModule } from './modules/CustomCacheModule';
import { CustomThrottlerModule } from './modules/CustomThrottlerModule';
import { HealthModule } from './modules/HealthModule';

@Module({
  imports: [
    CustomCacheModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema: ENV_VALIDATION_SCHEMA,
    }),
    CustomThrottlerModule,
    HealthModule,
  ],
  controllers: [],
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
