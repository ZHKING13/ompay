// metrics-registry.service.ts
import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsRegistryService {
  private readonly counters = new Map<string, Counter>();
  private readonly histograms = new Map<string, Histogram>();
  private readonly gauges = new Map<string, Gauge>();

  constructor(private readonly registry: Registry) {}

  getOrCreateCounter(
    name: string,
    help: string,
    labelNames: string[] = [],
  ): Counter {
    if (!this.counters.has(name)) {
      const counter = new Counter({
        name,
        help,
        labelNames,
        registers: [this.registry],
      });
      this.counters.set(name, counter);
    }
    return this.counters.get(name)!;
  }

  getOrCreateHistogram(
    name: string,
    help: string,
    labelNames: string[] = [],
    buckets?: number[],
  ): Histogram {
    if (!this.histograms.has(name)) {
      const histogram = new Histogram({
        name,
        help,
        labelNames,
        buckets: buckets ?? [10, 50, 100, 200, 500, 1000],
        registers: [this.registry],
      });
      this.histograms.set(name, histogram);
    }
    return this.histograms.get(name)!;
  }

  getOrCreateGauge(
    name: string,
    help: string,
    labelNames: string[] = [],
  ): Gauge {
    if (!this.gauges.has(name)) {
      const gauge = new Gauge({
        name,
        help,
        labelNames,
        registers: [this.registry],
      });
      this.gauges.set(name, gauge);
    }
    return this.gauges.get(name)!;
  }
}
