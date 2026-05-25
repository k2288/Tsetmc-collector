import { Injectable } from '@nestjs/common';
import { MarketDataProvider } from './market-data-provider.interface';
import { MarketSnapshot, MoneyFlowSnapshot } from '../models/market-data.models';

@Injectable()
export class TseClientProvider implements MarketDataProvider {
  readonly providerName = 'tse-client';

  async fetchMarketWatch(): Promise<MarketSnapshot[]> {
    // Provider adapter boundary: replace with exact tse-client API calls in production.
    return [];
  }

  async fetchClientTypes(): Promise<MoneyFlowSnapshot[]> {
    return [];
  }
}
