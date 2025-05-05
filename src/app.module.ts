import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ThrottlerModule,
  ThrottlerGuard,
  ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration';
import { APP_GUARD } from '@nestjs/core';

import { TransactionModule } from './modules/transaction/transaction.module';
import { QRCodeModule } from './modules/qrcode/qrcode.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    EventEmitterModule.forRoot(),

    PrismaModule,

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
        },
      }),
      inject: [ConfigService],
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('rateLimit.ttl') ?? 60,
          limit: configService.get<number>('rateLimit.limit') ?? 10,
        },
      ],
    }),

    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
        level: process.env.LOG_LEVEL || 'debug', 
      },
    }), 
    TransactionModule,
    QRCodeModule,
    MonitoringModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
