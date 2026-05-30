import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { ProviderHealthService } from './market-data/services/provider-health.service';
import { RedisService } from './storage/redis.service';

@Controller()
export class AppController {
  constructor(
    private readonly providerHealthService: ProviderHealthService,
    private readonly redisService: RedisService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get('health')
  async health() {
    const [database, redis] = await Promise.allSettled([
      this.dataSource.query('SELECT 1'),
      this.redisService.ping(),
    ]);

    return {
      status:
        database.status === 'fulfilled' && redis.status === 'fulfilled'
          ? 'ok'
          : 'degraded',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: database.status,
        redis: redis.status,
      },
      providers: this.providerHealthService.getAll(),
    };
  }
}
