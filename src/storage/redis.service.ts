import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;

  constructor(configService: ConfigService) {
    this.client = new Redis({
      host: configService.get<string>('redis.host'),
      port: configService.get<number>('redis.port'),
      password: configService.get<string>('redis.password'),
      keyPrefix: configService.get<string>('redis.keyPrefix'),
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });

    this.client.on('error', (error) => {
      this.logger.warn(
        JSON.stringify({ event: 'redis_error', error: error.message }),
      );
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async ping(): Promise<string> {
    if (this.client.status === 'wait') {
      await this.client.connect();
    }
    return this.client.ping();
  }
}
