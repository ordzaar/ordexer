import { Type } from "@nestjs/common";
import { ApplicationConfig, NestContainer } from "@nestjs/core";
import { GuardsConsumer } from "@nestjs/core/guards/guards-consumer";
import { GuardsContextCreator } from "@nestjs/core/guards/guards-context-creator";
import { STATIC_CONTEXT } from "@nestjs/core/injector/constants";
import { InterceptorsConsumer } from "@nestjs/core/interceptors/interceptors-consumer";
import { InterceptorsContextCreator } from "@nestjs/core/interceptors/interceptors-context-creator";
import { PipesConsumer } from "@nestjs/core/pipes/pipes-consumer";
import { PipesContextCreator } from "@nestjs/core/pipes/pipes-context-creator";
import { RouteParamsFactory } from "@nestjs/core/router/route-params-factory";
import { RouterExceptionFilters } from "@nestjs/core/router/router-exception-filters";
import { RouterProxyCallback } from "@nestjs/core/router/router-proxy";

import { JsonRpcContextCreator } from "./context/json-rpc-context-creator";
import { JsonRpcProxy } from "./context/json-rpc-proxy";
import { RpcMethodHandler } from "./interfaces";
import { ProxyCallback } from "./types";

export class RpcCallbackProxy {
  private readonly routerProxy = new JsonRpcProxy();

  private readonly executionContextCreator: JsonRpcContextCreator;

  private readonly exceptionsFilter: RouterExceptionFilters;

  constructor(
    private readonly config: ApplicationConfig,
    private readonly container: NestContainer,
  ) {
    const httpAdapterRef = container.getHttpAdapterRef();

    this.executionContextCreator = new JsonRpcContextCreator(
      new RouteParamsFactory(),
      new PipesContextCreator(this.container, this.config),
      new PipesConsumer(),
      new GuardsContextCreator(this.container, this.config),
      new GuardsConsumer(),
      new InterceptorsContextCreator(this.container, this.config),
      new InterceptorsConsumer(),
      httpAdapterRef,
    );
    this.exceptionsFilter = new RouterExceptionFilters(container, this.config, httpAdapterRef);
  }

  public create(rpcMethodHandler: RpcMethodHandler, moduleKey: string) {
    const { instanceWrapper, methodName, callback } = rpcMethodHandler;
    const { instance } = instanceWrapper;

    return this.createCallbackProxy(instance, callback, methodName, moduleKey);
  }

  private createCallbackProxy(
    instance: Type<any>,
    callback: RouterProxyCallback,
    methodName: string,
    moduleRef: string,
    contextId = STATIC_CONTEXT,
    inquirerId?: string,
  ): ProxyCallback {
    const executionContext = this.executionContextCreator.create(
      instance,
      callback as (...args: unknown[]) => unknown,
      methodName,
      moduleRef,
      contextId,
      inquirerId,
    );
    const exceptionFilter = this.exceptionsFilter.create(instance, callback, moduleRef, contextId, inquirerId);
    const proxyCallback = this.routerProxy.createProxy(executionContext as RouterProxyCallback, exceptionFilter);
    return proxyCallback as ProxyCallback;
  }
}
