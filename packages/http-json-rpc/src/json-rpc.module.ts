import { DynamicModule, Inject, Module, OnModuleInit, Provider } from "@nestjs/common";
import { ApplicationConfig, DiscoveryModule, HttpAdapterHost, ModuleRef, NestContainer } from "@nestjs/core";
import { Injector } from "@nestjs/core/injector/injector";

import { JsonRpcConfig, JsonRpcModuleAsyncOptions, JsonRpcOptionsFactory } from "./index";
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

  public static forRootAsync(options: JsonRpcModuleAsyncOptions): DynamicModule {
    return {
      module: JsonRpcModule,
      imports: [...(options.imports || []), DiscoveryModule],
      providers: [JsonRpcServer, JsonRpcExplorer, ...this.createAsyncProvider(options)],
      exports: [...this.createAsyncProvider(options)],
    };
  }

  private static createAsyncProvider(options: JsonRpcModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(options: JsonRpcModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: JSON_RPC_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    return {
      provide: JSON_RPC_OPTIONS,
      useFactory: async (optionsFactory: JsonRpcOptionsFactory) => optionsFactory.createJsonRpcOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }

  public async onModuleInit() {
    const { container, injector } = this.moduleRef as any as {
      container: NestContainer;
      injector: Injector;
    };
    const routesResolver = new RpcRoutesResolver(
      container,
      this.nestConfig,
      injector,
      this.config,
      this.jsonRpcExplorer,
    );
    const prefix = this.nestConfig.getGlobalPrefix();
    const rpcHandlers = routesResolver.resolve(this.httpAdapterHost.httpAdapter, prefix);
    this.rpcServer.run(rpcHandlers, this.config);
  }
}
