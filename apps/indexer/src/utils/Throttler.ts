import { seconds, Throttle } from '@nestjs/throttler';

type ThrottleOptions = { limit: number; ttl: number };
type ThrottleOpts = MethodDecorator & ClassDecorator;

export const GetRequestThrottler = (options?: ThrottleOptions): ThrottleOpts =>
  options ? Throttle({ default: options }) : Throttle({ default: { ttl: seconds(60), limit: 100 } });

export const PostRequestThrottler = (options?: ThrottleOptions): ThrottleOpts =>
  options ? Throttle({ default: options }) : Throttle({ default: { ttl: seconds(60), limit: 30 } });

export const BotThrottler = (options?: ThrottleOptions): ThrottleOpts =>
  options ? Throttle({ default: options }) : Throttle({ default: { ttl: seconds(60), limit: 10 } });

export const PollingThrottler = (options?: ThrottleOptions): ThrottleOpts =>
  options ? Throttle({ default: options }) : Throttle({ default: { ttl: seconds(60), limit: 100 } });
