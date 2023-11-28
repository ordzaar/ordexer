import { Module } from '@nestjs/common';
import { seconds, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: seconds(60),
        limit: 10,
      },
    ]),
  ],
  exports: [ThrottlerModule],
})
export class CustomThrottlerModule {}
