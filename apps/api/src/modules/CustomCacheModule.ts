import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 10_000, // 10seconds
      max: 100_000, // 100k items
    }),
  ],
  // exports: [CacheModule],
})
export class CustomCacheModule {}
