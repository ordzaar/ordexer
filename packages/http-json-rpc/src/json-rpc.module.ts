import { DynamicModule, Inject, Module, OnModuleInit } from "@nestjs/common";
import { ApplicationConfig, DiscoveryModule, HttpAdapterHost, ModuleRef, NestContainer } from "@nestjs/core";

import { JsonRpcConfig } from "./interfaces";
import { JsonRpcExplorer } from "./json-rpc-explorer";
import { JsonRpcServer } from "./json-rpc-server";
import { RpcRoutesResolver } from "./rpc-routes-resolver";

export const JSON_RPC_OPTIONS = "__JSON_RPC_OPTIONS__";

@Module({})
export class JsonRpcModule implements OnModuleInit {
  constructor(
    private rpcServer: JsonRpcServer,
    @Inject(JSON_RPC_OPTIONS) private config: JsonRpcConfig,
    private moduleRef: ModuleRef,
    private nestConfig: ApplicationConfig,
    private httpAdapterHost: HttpAdapterHost,
    private jsonRpcExplorer: JsonRpcExplorer,
  ) {}

  public static forRoot(config: JsonRpcConfig): DynamicModule {
    return {
      module: JsonRpcModule,
      imports: [DiscoveryModule],
      providers: [
        {
          provide: JSON_RPC_OPTIONS,
          useValue: config,
        },
        JsonRpcServer,
        JsonRpcExplorer,
      ],
      exports: [
        {
          provide: JSON_RPC_OPTIONS,
          useValue: config,
        },
      ],
      controllers: [],
    };
  }

  public async onModuleInit() {
    const { container } = this.moduleRef as any as {
      container: NestContainer;
    };
    const routesResolver = new RpcRoutesResolver(container, this.nestConfig, this.config, this.jsonRpcExplorer);
    const prefix = this.nestConfig.getGlobalPrefix();
    const rpcHandlers = routesResolver.resolve(this.httpAdapterHost.httpAdapter, prefix);
    this.rpcServer.run(rpcHandlers, this.config);
  }
}
