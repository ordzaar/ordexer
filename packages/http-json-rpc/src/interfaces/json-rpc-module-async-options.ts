import { Type } from "@nestjs/common";

import { JsonRpcConfig } from "./json-rpc-config";
import { JsonRpcOptionsFactory } from "./json-rpc-options-factory";

export interface JsonRpcModuleAsyncOptions {
  imports?: any[];
  useExisting?: Type<JsonRpcOptionsFactory>;
  useClass?: Type<JsonRpcOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<JsonRpcConfig> | JsonRpcConfig;
  inject?: any[];
}
