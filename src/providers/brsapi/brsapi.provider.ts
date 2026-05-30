import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import { MarketDataProvider, MarketSnapshotRow } from '../market-data-provider.interface';

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

  async fetchMarketSnapshot(): Promise<MarketSnapshotRow[]> {
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

    const data = Array.isArray(response.data) ? response.data : response.data?.data;
    if (!Array.isArray(data)) {
      return [];
    }
    return data
      .map((row: Record<string, unknown>) => ({
        instrumentId: String(row.insCode ?? row.instrumentId ?? row.id ?? ''),
        symbol: row.symbol ? String(row.symbol) : undefined,
        name: row.name ? String(row.name) : undefined,
        lastPrice: Number(row.lastPrice ?? row.last ?? row.price) || undefined,
        adjustedClose: Number(row.close ?? row.finalPrice ?? row.adjustedClose) || undefined,
        openPrice: Number(row.open ?? row.openPrice) || undefined,
        volume: Number(row.volume) || undefined,
        value: Number(row.value) || undefined,
        tradeCount: Number(row.count ?? row.tradeCount) || undefined,
        minPrice: Number(row.low ?? row.minPrice) || undefined,
        maxPrice: Number(row.high ?? row.maxPrice) || undefined,
        yesterdayPrice: Number(row.yesterdayPrice ?? row.yesterday) || undefined,
      }))
      .filter((row: MarketSnapshotRow) => row.instrumentId);
  }
}
