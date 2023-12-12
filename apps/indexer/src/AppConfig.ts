import * as Joi from "joi";
import * as process from "process";

export const DATABASE_URL = "DATABASE_URL";

export function appConfig() {
  return {
    dbUrl: process.env.DATABASE_URL,
    network: process.env.NETWORK,
    bitcoinRpc: {
      uri: process.env.BITCOIN_RPC_URI,
      port: process.env.BITCOIN_RPC_PORT,
      user: process.env.BITCOIN_RPC_USER,
      password: process.env.BITCOIN_RPC_PASSWORD,
    },
    ord: {
      uri: process.env.ORD_URI,
      port: process.env.ORD_PORT
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
  NETWORK: Joi.string(),
  BITCOIN_RPC_URI: Joi.string(),
  BITCOIN_RPC_PORT: Joi.number(),
  BITCOIN_RPC_USER: Joi.string(),
  BITCOIN_RPC_PASSWORD: Joi.string(),
  ORD_URI: Joi.string(),
  ORD_PORT: Joi.number(),
});
