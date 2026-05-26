import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { MarketDataProvider } from '../market-data-provider.interface';

@Injectable()
export class TsetmcProvider implements MarketDataProvider {
  readonly providerName = 'tsetmc';

  async fetchMarketSnapshot(): Promise<Record<string, unknown>> {
    const base = process.env.TSETMC_BASE_URL || 'https://old.tsetmc.com';
    const response = await axios.get(`${base}/Loader.aspx?ParTree=15`, { timeout: 15000 });

    return {
      fetchedAt: new Date().toISOString(),
      endpoint: response.config.url,
      status: response.status,
      body: response.data
    };
  }
}
