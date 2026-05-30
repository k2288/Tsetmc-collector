import { Controller, Get, Param } from '@nestjs/common';

import { TsetmcHistoricalProvider } from '../providers/tsetmc/tsetmc-historical.provider';
import { TsetmcMarketProvider } from '../providers/tsetmc/tsetmc-market.provider';

@Controller('market')
export class MarketController {
  constructor(
    private readonly marketProvider: TsetmcMarketProvider,
    private readonly historicalProvider: TsetmcHistoricalProvider,
  ) {}

  @Get('snapshot')
  async snapshot() {
    return this.marketProvider.fetchMarketSnapshot();
  }

  @Get('history/:instrumentId')
  async history(@Param('instrumentId') instrumentId: string) {
    return this.historicalProvider.fetchHistory(instrumentId);
  }
}
