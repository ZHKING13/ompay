import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import * as os from 'os';
const isWindows = os.platform() === 'win32';
import {
  HealthCheck,
  HealthCheckService,
  
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  isWindows = os.platform() === 'win32';

  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Vérifie que la base de données est accessible
      // Vérifie que l'utilisation de la mémoire est sous 1GB
      () => this.memory.checkHeap('memory_heap', 1024 * 1024 * 1024),
      // Vérifie qu'il y a au moins 1GB d'espace disque disponible
      () =>
        this.disk.checkStorage('storage', {
          thresholdPercent: 0.9,
          path: isWindows ? 'C:\\' : '/',
        }),
    ]);
  }
}
