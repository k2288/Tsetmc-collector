import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import { MarketDataProvider } from '../market-data-provider.interface';

@Injectable()
export class TsetmcProvider implements MarketDataProvider {
  readonly name = 'tsetmc';
  private readonly logger = new Logger(TsetmcProvider.name);
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.client = axios.create({
      baseURL: this.configService.get<string>('providers.tsetmc.baseUrl'),
      timeout: this.configService.get<number>('providers.tsetmc.timeoutMs'),
      headers: {
        Accept: 'application/json,text/plain,*/*',
        'User-Agent': 'TsetmcCollector/0.1 (+market-data-infrastructure)',
      },
    });
  }

  async fetchMarketSnapshot(): Promise<unknown> {
    const path = this.configService.get<string>(
      'providers.tsetmc.marketWatchPath',
    );
    this.logger.log(
      JSON.stringify({
        event: 'provider_fetch_started',
        provider: this.name,
        path,
      }),
    );
    const response = await this.client.get(path ?? '/');

    return {
      provider: this.name,
      receivedAt: new Date().toISOString(),
      status: response.status,
      headers: response.headers,
      data: response.data,
    };
  }
}
