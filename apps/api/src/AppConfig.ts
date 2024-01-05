import * as Joi from "joi";
import * as process from "process";

export const DATABASE_URL = "DATABASE_URL";

export function appConfig() {
  return {
    dbUrl: process.env.DATABASE_URL,
    api: {
      addresses: {
        outputPromiseLimiter: parseInt(process.env.OUTPUT_PROMISE_LIMITER ?? "1", 10),
      },
    },
  };
}

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;
export type AppConfig = DeepPartial<ReturnType<typeof appConfig>>;

export const ENV_VALIDATION_SCHEMA = Joi.object({
  DATABASE_URL: Joi.string(),
  OUTPUT_PROMISE_LIMITER: Joi.number(),
});
