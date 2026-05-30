import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import { InstrumentMetadata } from '../market-data-provider.interface';
import { TsetmcParser } from './tsetmc-parser';

@Injectable()
export class TsetmcInstrumentProvider {
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.client = axios.create({
      baseURL: this.configService.get<string>('providers.tsetmc.cdnBaseUrl'),
      timeout: this.configService.get<number>('providers.tsetmc.timeoutMs'),
      headers: {
        Accept: 'application/json,text/plain,*/*',
        'User-Agent': 'Mozilla/5.0 (compatible; TsetmcCollector/0.1; +market-data)',
      },
    });
  }

  async fetchMetadata(instrumentId: string): Promise<InstrumentMetadata> {
    const response = await this.client.get<unknown>(
      `/api/Instrument/GetInstrumentInfo/${encodeURIComponent(instrumentId)}`,
    );
    return TsetmcParser.parseInstrumentMetadata(instrumentId, response.data);
  }
}
