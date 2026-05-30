import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import { RealLegalActivity } from '../market-data-provider.interface';
import { TsetmcParser } from './tsetmc-parser';

@Injectable()
export class TsetmcRealLegalProvider {
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.client = axios.create({
      baseURL: this.configService.get<string>('providers.tsetmc.oldBaseUrl'),
      timeout: this.configService.get<number>('providers.tsetmc.timeoutMs'),
      responseType: 'text',
      headers: {
        Accept: 'text/plain,*/*',
        Referer: 'http://old.tsetmc.com/Loader.aspx?ParTree=15131F',
        'User-Agent': 'Mozilla/5.0 (compatible; TsetmcCollector/0.1; +market-data)',
      },
    });
  }

  async fetchAll(): Promise<RealLegalActivity[]> {
    const response = await this.client.get<string>('/tsev2/data/ClientTypeAll.aspx');
    return TsetmcParser.parseRealLegalAll(TsetmcParser.decodeText(response.data));
  }
}
