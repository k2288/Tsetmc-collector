import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { MarketDataCollectionService } from './market-data-collection.service';

@Injectable()
export class MarketDataSchedulerService {
  private readonly logger = new Logger(MarketDataSchedulerService.name);

  constructor(
    private readonly collectionService: MarketDataCollectionService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async pollMarketData(): Promise<void> {
    this.logger.log(JSON.stringify({ event: 'scheduled_collection_tick' }));
    await this.collectionService.collectAllProviders();
  }
}
