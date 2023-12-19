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
      port: process.env.ORD_PORT,
    },
    // only increase it when the node is supports concurency
    voutPromiseLimiter: parseInt(process.env.VOUT_PROMISE_LIMITER ?? "1", 10),
    indexer: {
      threshold: {
        numBlocks: parseInt(process.env.INDEXER_THRESHOLD_NUM_BLOCKS ?? "5000", 10),
        numVins: parseInt(process.env.INDEXER_THRESHOLD_NUM_VINS ?? "250000", 10),
        numVouts: parseInt(process.env.INDEXER_THRESHOLD_NUM_VOUTS ?? "250000", 10),
      },
      transactionTimeout: parseInt(process.env.INDEXER_TRANSACTION_TIMEOUT ?? "1200000", 10), // 20 minutes
      reorgLength: parseInt(process.env.INDEXER_REORG_LENGTH ?? "10", 10),
      outputHandler: {
        insertChunk: parseInt(process.env.INDEXER_OUTPUT_HANDLER_INSERT_CHUNK ?? "20000", 10),
        updatePromiseLimiter: parseInt(process.env.INDEXER_OUTPUT_HANDLER_UPDATE_PROMISE_LIMITER ?? "100", 10),
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
  NETWORK: Joi.string(),
  BITCOIN_RPC_URI: Joi.string(),
  BITCOIN_RPC_PORT: Joi.number(),
  BITCOIN_RPC_USER: Joi.string(),
  BITCOIN_RPC_PASSWORD: Joi.string(),
  ORD_URI: Joi.string(),
  ORD_PORT: Joi.number(),
});
