import { Controller, Get } from '@nestjs/common';
import { MarketSnapshotResponse } from '../providers/market-data-provider.interface';
import { MarketDataCollectorService } from './services/market-data-collector.service';

@Controller('market')
export class MarketController {
  constructor(private readonly collector: MarketDataCollectorService) {}

  @Get('snapshot')
  getSnapshot(): Promise<MarketSnapshotResponse> {
    return this.collector.getLiveSnapshot();
  }
}
