import { Injectable } from '@nestjs/common';
import { MarketDataProvider } from '../market-data-provider.interface';

@Injectable()
export class BrsApiProvider implements MarketDataProvider {
  readonly providerName = 'brsapi';

  async fetchMarketSnapshot(): Promise<Record<string, unknown>> {
    return {
      fetchedAt: new Date().toISOString(),
      note: 'stub provider for future BRS API integration',
      symbols: []
    };
  }
}
