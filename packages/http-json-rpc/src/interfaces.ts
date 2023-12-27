import { Type } from "@nestjs/common";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import { Observable } from "rxjs";

export interface IRpcHandler<T = unknown> {
  invoke(...args);
}

export interface RpcErrorInterface {
  jsonrpc: string;
  method?: string;
  id?: number | string | null;
  error?: any;
}

export interface RpcRequestInterface {
  jsonrpc: string;
  method: string;
  id?: number | string | null;
  params?: any;
}

export interface RpcResultInterface {
  jsonrpc: string;
  method?: string;
  id?: number | string | null;
  result?: any;
}

export interface JsonRpcConfig {
  path: string;
}

export interface JsonRpcOptionsFactory {
  createJsonRpcOptions(): Promise<JsonRpcConfig> | JsonRpcConfig;
}

export interface JsonRpcModuleAsyncOptions {
  imports?: any[];
  useExisting?: Type<JsonRpcOptionsFactory>;
  useClass?: Type<JsonRpcOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<JsonRpcConfig> | JsonRpcConfig;
  inject?: any[];
}

export interface RpcMetadata {
  method?: string;
}

export interface RpcMethodHandler {
  methodName: string;
  callback: (...args: any[]) => Observable<any> | Promise<any> | any;
  rpcMethodName: string;
  instanceWrapper: InstanceWrapper<IRpcHandler<any> | Type<any>>;
}
