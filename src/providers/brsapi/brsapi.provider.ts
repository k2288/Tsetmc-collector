import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  MarketDataProvider,
  MarketQueueLevel,
  MarketSnapshotResponse,
  NormalizedMarketInstrument,
  ProviderEndpointDescription
} from '../market-data-provider.interface';

@Injectable()
export class BrsApiProvider implements MarketDataProvider {
  readonly providerName = 'brsapi';

  private readonly client: AxiosInstance;
  private readonly baseUrl = process.env.BRSAPI_BASE_URL || 'https://Api.BrsApi.ir';
  private readonly apiKey = process.env.BRSAPI_KEY || 'FreeSV0E1LSgB9RDjuf0QorSLViX8pPG';
  private readonly type = process.env.BRSAPI_SYMBOL_TYPE || '1';

  readonly endpoints: ProviderEndpointDescription[] = [
    {
      url: `${this.baseUrl}/Tsetmc/AllSymbols.php?key=<BRSAPI_KEY>&type=${this.type}`,
      purpose: 'Fallback JSON endpoint for all Tehran market symbols, scraped by BRSAPI from TSETMC.',
      responseStructure:
        'JSON array of symbol records. BRSAPI uses TSETMC filter-style keys: l18/l30 for symbol/name, pl for last price, pc for closing price, tvol for traded volume, tno for trade count, and zd/qd/pd plus zo/qo/po levels for buy/sell queues.'
    }
  ];

  constructor() {
    this.client = axios.create({
      timeout: Number(process.env.BRSAPI_TIMEOUT_MS || 15000),
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent':
          process.env.BRSAPI_USER_AGENT ||
          'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/106.0.0.0'
      },
      validateStatus: (status) => status >= 200 && status < 300
    });
  }

  async fetchMarketSnapshot(): Promise<MarketSnapshotResponse> {
    const endpoint = `${this.baseUrl}/Tsetmc/AllSymbols.php?key=${encodeURIComponent(this.apiKey)}&type=${encodeURIComponent(this.type)}`;
    const response = await this.client.get<unknown>(endpoint);
    const rows = this.extractRows(response.data);

    return {
      provider: this.providerName,
      fetchedAt: new Date().toISOString(),
      endpoint: this.redactKey(endpoint),
      endpoints: this.endpoints,
      responseStructure: this.endpoints[0].responseStructure,
      symbols: rows.map((row) => this.normalizeRow(row)),
      raw: response.data
    };
  }

  private extractRows(data: unknown): Record<string, unknown>[] {
    const candidate = Array.isArray(data)
      ? data
      : typeof data === 'object' && data !== null
        ? (data as Record<string, unknown>).data ?? (data as Record<string, unknown>).symbols ?? data
        : data;

    if (!Array.isArray(candidate)) {
      throw new Error('BRSAPI response did not contain a symbol array');
    }

    return candidate.filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null);
  }

  private normalizeRow(row: Record<string, unknown>): NormalizedMarketInstrument {
    return {
      symbol: this.requiredString(row, ['l18', 'symbol'], 'unknown'),
      instrumentId: this.optionalString(row, ['id', 'insCode']),
      isin: this.optionalString(row, ['isin']),
      name: this.optionalString(row, ['l30', 'name']),
      lastPrice: this.requiredNumber(row, ['pl', 'lastPrice']),
      closingPrice: this.optionalNumber(row, ['pc', 'closingPrice']),
      volume: this.requiredNumber(row, ['tvol', 'volume']),
      tradeCount: Math.trunc(this.requiredNumber(row, ['tno', 'tradeCount'])),
      tradeValue: this.optionalNumber(row, ['tval', 'tradeValue']),
      tradeTime: this.optionalString(row, ['time']),
      queue: this.extractQueue(row),
      raw: row
    };
  }

  private extractQueue(row: Record<string, unknown>): MarketQueueLevel[] {
    const queue: MarketQueueLevel[] = [];
    for (let level = 1; level <= 5; level += 1) {
      const item: MarketQueueLevel = {
        level,
        bidCount: this.optionalNumber(row, [`zd${level}`]),
        bidVolume: this.optionalNumber(row, [`qd${level}`]),
        bidPrice: this.optionalNumber(row, [`pd${level}`]),
        askPrice: this.optionalNumber(row, [`po${level}`]),
        askVolume: this.optionalNumber(row, [`qo${level}`]),
        askCount: this.optionalNumber(row, [`zo${level}`])
      };
      if (item.bidPrice !== null || item.bidVolume !== null || item.askPrice !== null || item.askVolume !== null) {
        queue.push(item);
      }
    }
    return queue;
  }

  private requiredString(row: Record<string, unknown>, keys: string[], fallback: string): string {
    return this.optionalString(row, keys) || fallback;
  }

  private optionalString(row: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = row[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value).trim();
      }
    }
    return null;
  }

  private requiredNumber(row: Record<string, unknown>, keys: string[]): number {
    const value = this.optionalNumber(row, keys);
    if (value === null) {
      throw new Error(`Missing numeric field. Expected one of: ${keys.join(', ')}`);
    }
    return value;
  }

  private optionalNumber(row: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
      const value = row[key];
      const numberValue = typeof value === 'number' ? value : Number(String(value ?? '').replace(/,/g, '').trim());
      if (Number.isFinite(numberValue)) {
        return numberValue;
      }
    }
    return null;
  }

  private redactKey(endpoint: string): string {
    return endpoint.replace(/key=[^&]+/, 'key=<BRSAPI_KEY>');
  }
}
