import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CoreApiService } from './core-api.service';
import { makeHistogramProvider } from '@willsoto/nestjs-prometheus';
import { MonitoringModule } from '../../monitoring/monitoring.module';

@Module({
  imports: [HttpModule, ConfigModule, MonitoringModule],
  providers: [
    CoreApiService,
    makeHistogramProvider({
      name: 'core_api_request_duration_seconds',
      help: 'Durée des requêtes vers CoreAPI en secondes',
      labelNames: ['endpoint'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    }),
  ],
  exports: [CoreApiService],
})
export class CoreApiModule {}
