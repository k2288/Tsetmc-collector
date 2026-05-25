import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { MetricsService } from '../metrics/metrics.service';

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService, private readonly metrics: MetricsService) {}

  @Get('/health')
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', timestampUtc: new Date().toISOString() };
  }

  @Get('/metrics')
  async prometheus() {
    return this.metrics.registry.metrics();
  }
}
