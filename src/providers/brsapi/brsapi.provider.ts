import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import { MarketDataProvider } from '../market-data-provider.interface';

@Injectable()
export class BrsApiProvider implements MarketDataProvider {
  readonly name = 'brsapi';
  private readonly logger = new Logger(BrsApiProvider.name);
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.client = axios.create({
      timeout: this.configService.get<number>('providers.brsapi.timeoutMs'),
      headers: { Accept: 'application/json,text/plain,*/*' },
    });
  }

  async fetchMarketSnapshot(): Promise<unknown> {
    const url = this.configService.get<string>('providers.brsapi.url');
    const apiKey = this.configService.get<string>('providers.brsapi.apiKey');

    if (!apiKey) {
      throw new Error('BRSAPI_API_KEY is required when BRSAPI_ENABLED=true');
    }

    this.logger.log(
      JSON.stringify({
        event: 'provider_fetch_started',
        provider: this.name,
        url,
      }),
    );
    const response = await this.client.get(url ?? '', {
      params: { key: apiKey },
    });

    return {
      provider: this.name,
      receivedAt: new Date().toISOString(),
      status: response.status,
      headers: response.headers,
      data: response.data,
    };
  }
}
