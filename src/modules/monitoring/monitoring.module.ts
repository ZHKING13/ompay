import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HealthController } from './health.controller';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { MetricsRegistryService } from './metrics-registry.service';
import { Registry } from 'prom-client';

@Module({
  imports: [
    TerminusModule,
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
    }),
    EventEmitterModule.forRoot(),
  ],
  controllers: [ HealthController],
  providers: [
    MonitoringService,
    MetricsRegistryService,
    {
      provide: Registry,
      useValue: new Registry(), 
    },
  ],
  exports: [MonitoringService, MetricsRegistryService],
})
export class MonitoringModule {}
