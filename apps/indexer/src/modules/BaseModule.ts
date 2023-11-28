import { DynamicModule, Global, Module, ModuleMetadata } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

const isProduction = process.env.NODE_ENV === 'production';

const getLogtailPino = (): any[] =>
  process.env.LOGTAIL_SOURCE_TOKEN !== undefined
    ? [
        {
          target: '@logtail/pino',
          options: { sourceToken: process.env.LOGTAIL_SOURCE_TOKEN },
        },
      ]
    : [];

/**
 * Baseline module for any Ordzaar nest applications.
 *
 * - `@nestjs/config`, nestjs ConfigModule
 * - `nestjs-pino`, the Pino logger for NestJS
 * - `joi`, for validation of environment variables
 */
@Global()
@Module({
  imports: [
    LoggerModule.forRoot({
      exclude: ['/health', '/version'],
      pinoHttp: {
        name: 'indexer',
        level: isProduction ? 'info' : 'debug',
        transport: {
          targets: [
            ...getLogtailPino(),
            {
              target: 'pino-pretty',
              options: {
                colorize: !isProduction,
                singleLine: !isProduction,
              },
            },
          ],
        },
        autoLogging: {
          ignore: (req) => req.method === 'OPTIONS',
        },
        customSuccessMessage: (req) => `[SUCCESS] ${req.method} ${req.url}`,
        customErrorMessage: (req) => `[ERROR] ${req.method} ${req.url}`,
        serializers: {
          req(req) {
            return isProduction
              ? req
              : {
                  method: req.method,
                  url: req.url,
                  query: req.query,
                  headers: isProduction ? req.headers : {}, // don't print headers on local
                  ip: req.raw.ip,
                  ips: req.raw.ips,
                };
          },
          res(res) {
            return isProduction
              ? res
              : {
                  statusCode: res.statusCode,
                  statusMessage: res.raw.statusMessage,
                  responseTime: res.headers.responseTime,
                  headers: isProduction ? res.headers : {}, // don't print headers on local
                };
          },
        },
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
  ],
})
export class BaseModule {
  static with(metadata: ModuleMetadata): DynamicModule {
    return {
      module: BaseModule,
      global: true,
      ...metadata,
    };
  }
}
