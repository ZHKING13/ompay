import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { Response } from 'express';

@ApiTags('Monitoring')
@Controller('monitoring')
export class MonitoringController extends PrometheusController {
  constructor(private readonly monitoringService: MonitoringService) {
    super();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Obtenir toutes les métriques Prometheus' })
  async getMetrics(@Res() response: Response) {
    return super.index(response);
  }
}
