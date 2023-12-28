import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  InjectableOptions,
  SetMetadata,
} from "@nestjs/common";

import { RpcMetadata } from "../interfaces";

export const RpcMetadataKey = "__rpc-metadata__";

export const RpcMethodMetadataKey = "__rpc-method-metadata__";

export const RpcPayload = createParamDecorator((_, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.body.params;
});

export const RpcId = createParamDecorator((_, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.body.id || null;
});

export const RpcVersion = createParamDecorator((_, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.body.jsonrpc;
});

export const RpcMethod = createParamDecorator((_, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.body.method;
});

export const RpcHandler = (data?: RpcMetadata & InjectableOptions) => {
  const method = data ? data.method : "";
  return applyDecorators(SetMetadata(RpcMetadataKey, { method }));
};

export const RpcMethodHandler = (name: string) => applyDecorators(SetMetadata(RpcMethodMetadataKey, { name }));
