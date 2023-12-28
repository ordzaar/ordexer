import { ExceptionsHandler } from "@nestjs/core/exceptions/exceptions-handler";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import { RouterProxyCallback } from "@nestjs/core/router/router-proxy";

export class JsonRpcProxy {
  public createProxy(targetCallback: RouterProxyCallback, exceptionsHandler: ExceptionsHandler) {
    return async <TRequest, TResponse>(req: TRequest, res: TResponse, next: () => void) => {
      try {
        return targetCallback(req, res, next);
      } catch (e) {
        const host = new ExecutionContextHost([req, res, next]);
        exceptionsHandler.next(e, host);

        return e;
      }
    };
  }
}
