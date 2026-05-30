import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import { MarketDataProvider, MarketSnapshotRow } from '../market-data-provider.interface';
import { TsetmcParser } from './tsetmc-parser';

@Injectable()
export class TsetmcMarketProvider implements MarketDataProvider {
  readonly name = 'tsetmc';
  private readonly logger = new Logger(TsetmcMarketProvider.name);
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.client = axios.create({
      baseURL: this.configService.get<string>('providers.tsetmc.oldBaseUrl'),
      timeout: this.configService.get<number>('providers.tsetmc.timeoutMs'),
      responseType: 'text',
      headers: this.headers(),
    });
  }

  async fetchMarketSnapshot(): Promise<MarketSnapshotRow[]> {
    const path = '/tsev2/data/MarketWatchInit.aspx?h=0&r=0';
    this.logger.log(JSON.stringify({ event: 'provider_fetch_started', provider: this.name, path }));
    const response = await this.client.get<string>(path);
    return TsetmcParser.parseMarketWatchInit(TsetmcParser.decodeText(response.data));
  }

  private headers(): Record<string, string> {
    return {
      Accept: 'text/plain,*/*',
      Referer: 'http://old.tsetmc.com/Loader.aspx?ParTree=15131F',
      'User-Agent': 'Mozilla/5.0 (compatible; TsetmcCollector/0.1; +market-data)',
    };
  }
}
