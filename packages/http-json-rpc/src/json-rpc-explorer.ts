import { Injectable } from "@nestjs/common";
import { DiscoveryService, MetadataScanner } from "@nestjs/core";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import { Module } from "@nestjs/core/injector/module";

import { RpcMetadataKey, RpcMethodMetadataKey } from "./context/decorators";
import { RpcMethodHandler } from "./interfaces";

@Injectable()
export class JsonRpcExplorer {
  private metadataScanner = new MetadataScanner();

  constructor(private nestDiscovery: DiscoveryService) {}

  public explore(module: Module): RpcMethodHandler[] {
    const providers = this.nestDiscovery.getProviders({}, [module]);

    const result = providers.reduce((acc, instanceWrapper) => {
      const methods = this.filterHandlers(instanceWrapper);
      return [...acc, ...(methods || [])];
    }, [] as RpcMethodHandler[]);

    return result;
  }

  private filterHandlers(instanceWrapper: InstanceWrapper): RpcMethodHandler[] {
    const { instance } = instanceWrapper;
    if (!instance) {
      return [];
    }

    const metadata = Reflect.getMetadata(RpcMetadataKey, instance.constructor);
    if (metadata === undefined) {
      return [];
    }

    const instancePrototype = Object.getPrototypeOf(instanceWrapper.instance);

    return this.metadataScanner.getAllMethodNames(instancePrototype).map((methodName) => {
      const exploreMethodHandlers = this.exploreMethodHandlers(methodName, instancePrototype);
      const { rpcMethodMetadata, callback } = exploreMethodHandlers!;

      const rpcMethodName =
        metadata.method.length === 0 ? rpcMethodMetadata.name : `${metadata.method}.${rpcMethodMetadata.name}`;

      return {
        callback,
        methodName,
        instanceWrapper,
        rpcMethodName,
      };
    });
  }

  private exploreMethodHandlers(method: string, instancePrototype: any) {
    const callback = instancePrototype[method];
    const rpcMethodMetadata = Reflect.getMetadata(RpcMethodMetadataKey, callback);

    return {
      callback,
      rpcMethodMetadata,
    };
  }
}
