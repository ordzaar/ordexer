import * as Joi from "joi";
import * as process from "process";

export const DATABASE_URL = "DATABASE_URL";

export function appConfig() {
  return {
    dbUrl: process.env.DATABASE_URL,
    rpcUri: process.env.RPC_URI,
    rpcPort: process.env.RPC_PORT,
    rpcUser: process.env.RPC_USER,
    rpcPassword: process.env.RPC_PASSWORD,
    ordUri: process.env.ORD_URI,
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
  RPC_URI: Joi.string(),
  RPC_PORT: Joi.number(),
  RPC_USER: Joi.string(),
  RPC_PASSWORD: Joi.string(),
  ORD_URI: Joi.string(),
});
