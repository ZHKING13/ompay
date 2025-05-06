import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TangoService } from './tango.service';
import { ApiAuthService } from 'src/service/auth.service';
import { MonitoringModule } from 'src/modules/monitoring/monitoring.module';
import { makeHistogramProvider } from '@willsoto/nestjs-prometheus';
import { AuthModule } from 'src/service/auth.module';

@Module({
  imports: [HttpModule, ConfigModule, MonitoringModule, AuthModule],
  providers: [
    TangoService,
    ApiAuthService,
    makeHistogramProvider({
      name: 'tango_api_request_duration_seconds',
      help: 'Durée des requêtes vers tango en secondes',
      labelNames: ['endpoint'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    }),
  ],
  exports: [TangoService],
})
export class TangoModule {}
