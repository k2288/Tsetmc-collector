import { Injectable } from '@nestjs/common';
import { MarketDataProvider } from './market-data-provider.interface';
import { MarketSnapshot, MoneyFlowSnapshot } from '../models/market-data.models';

@Injectable()
export class TseClientProvider implements MarketDataProvider {
  readonly providerName = 'tse-client';
  readonly providerVersion = 'tse-client-v1';

  async fetchMarketWatch(): Promise<MarketSnapshot[]> {
    return [];
  }

  async fetchClientTypes(): Promise<MoneyFlowSnapshot[]> {
    return [];
  }
}
