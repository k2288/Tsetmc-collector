import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import { DailyPrice } from '../market-data-provider.interface';
import { TsetmcParser } from './tsetmc-parser';

@Injectable()
export class TsetmcHistoricalProvider {
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.client = axios.create({
      baseURL: this.configService.get<string>('providers.tsetmc.oldBaseUrl'),
      timeout: this.configService.get<number>('providers.tsetmc.timeoutMs'),
      responseType: 'arraybuffer',
      decompress: true,
      headers: {
        Accept: 'text/plain,*/*',
        Referer: 'http://old.tsetmc.com/Loader.aspx?ParTree=151311&i=',
        'User-Agent': 'Mozilla/5.0 (compatible; TsetmcCollector/0.1; +market-data)',
      },
    });
  }

  async fetchHistory(instrumentId: string): Promise<DailyPrice[]> {
    const response = await this.client.get<ArrayBuffer>(
      `/tsev2/data/Export-txt.aspx?t=i&a=1&b=0&i=${encodeURIComponent(instrumentId)}`,
    );
    return TsetmcParser.parseHistoricalPrices(TsetmcParser.decodeText(response.data));
  }
}
