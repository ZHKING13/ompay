import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MetricsRegistryService } from './metrics-registry.service';

@Injectable()
export class MonitoringService {
  constructor(private readonly metricsRegistry: MetricsRegistryService) {}

  @OnEvent('payment.created')
  handlePaymentCreated(payload: { countryCode: string; partnerId: string }) {
    const counter = this.metricsRegistry.getOrCreateCounter(
      `payments_total_${payload.countryCode.toLowerCase()}`,
      `Nombre total de paiements pour ${payload.countryCode}`,
      ['status', 'partner'],
    );
    counter.inc({ status: 'created', partner: payload.partnerId });

    const gauge = this.metricsRegistry.getOrCreateGauge(
      'active_payments',
      'Nombre de paiements en cours',
      ['status'],
    );
    gauge.inc({ status: 'pending' });
  }

  @OnEvent('payment.completed')
  handlePaymentCompleted(payload: { countryCode: string; partnerId: string }) {
    const counter = this.metricsRegistry.getOrCreateCounter(
      `payments_total_${payload.countryCode.toLowerCase()}`,
      `Nombre total de paiements pour ${payload.countryCode}`,
      ['status', 'partner'],
    );
    counter.inc({ status: 'completed', partner: payload.partnerId });

    const gauge = this.metricsRegistry.getOrCreateGauge(
      'active_payments',
      'Nombre de paiements en cours',
      ['status'],
    );
    gauge.dec({ status: 'pending' });
    gauge.inc({ status: 'completed' });
  }

  @OnEvent('qrcode.read')
  handleQRCodeRead(payload: {
    countryCode: string;
    partnerId: string;
    status: string;
  }) {
    const counter = this.metricsRegistry.getOrCreateCounter(
      `qrcode_reads_total_${payload.countryCode.toLowerCase()}`,
      `Lectures QR ${payload.countryCode}`,
      ['partner', 'status'],
    );
    counter.inc({ partner: payload.partnerId, status: payload.status });
  }

  recordResponseTime(endpoint: string, method: string, duration: number) {
    const histogram = this.metricsRegistry.getOrCreateHistogram(
      'api_response_time',
      'Temps de réponse API',
      ['endpoint', 'method'],
      [10, 50, 100, 200, 500, 1000, 2000],
    );
    histogram.observe({ endpoint, method }, duration);
  }
}
