import { Injectable } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  MarketDataProvider,
  MarketQueueLevel,
  MarketSnapshotResponse,
  NormalizedMarketInstrument,
  ProviderEndpointDescription
} from '../market-data-provider.interface';

const PAPER_TYPE_QUERY = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  .map((type, index) => `paperTypes%5B${index}%5D=${type}`)
  .join('&');

const MARKET_WATCH_PATH =
  `/api/ClosingPrice/GetMarketWatch?market=0&industrialGroup=&${PAPER_TYPE_QUERY}` +
  '&showTraded=false&withBestLimits=true&hEven=0&RefID=0';

const OLD_MARKET_WATCH_PATH = '/tsev2/data/MarketWatchInit.aspx?h=0&r=0';

@Injectable()
export class TsetmcProvider implements MarketDataProvider {
  readonly providerName = 'tsetmc';

  private readonly client: AxiosInstance;
  private readonly cdnBaseUrl = process.env.TSETMC_CDN_BASE_URL || 'https://cdn.tsetmc.com';
  private readonly oldBaseUrl = process.env.TSETMC_OLD_BASE_URL || 'https://old.tsetmc.com';

  readonly endpoints: ProviderEndpointDescription[] = [
    {
      url: `${this.cdnBaseUrl}${MARKET_WATCH_PATH}`,
      purpose: 'Primary JSON market-watch endpoint for all TSETMC paper types with best-limit/order-book rows included.',
      responseStructure:
        'JSON object with a marketwatch array. Each item contains instrument identity, prices (pl/pc/pf/pmin/pmax), volume (tvol), trade count (tno), value (tval), and best-limit columns pd/qd/zd and po/qo/zo by depth level when withBestLimits=true.'
    },
    {
      url: `${this.oldBaseUrl}${OLD_MARKET_WATCH_PATH}`,
      purpose: 'Legacy market-watch initialization endpoint used only if the JSON endpoint is unreachable.',
      responseStructure:
        'Delimited text split by @: market state, semicolon/comma-separated instrument rows, semicolon/comma-separated best-limit rows, and a RefID. Instrument columns follow TSETMC filter names such as pl, pc, tvol, and tno.'
    }
  ];

  constructor() {
    this.client = axios.create({
      timeout: Number(process.env.TSETMC_TIMEOUT_MS || 15000),
      headers: {
        Accept: 'application/json, text/plain, */*',
        Referer: 'https://www.tsetmc.com/',
        'User-Agent':
          process.env.TSETMC_USER_AGENT ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:100.0) Gecko/20100101 Firefox/100.0'
      },
      validateStatus: (status) => status >= 200 && status < 300
    });
  }

  async fetchMarketSnapshot(): Promise<MarketSnapshotResponse> {
    try {
      return await this.fetchJsonMarketWatch();
    } catch (primaryError) {
      try {
        return await this.fetchLegacyMarketWatch();
      } catch (legacyError) {
        const primaryMessage = primaryError instanceof Error ? primaryError.message : String(primaryError);
        const legacyMessage = legacyError instanceof Error ? legacyError.message : String(legacyError);
        throw new Error(`TSETMC endpoints failed. JSON: ${primaryMessage}; legacy: ${legacyMessage}`);
      }
    }
  }

  private async fetchJsonMarketWatch(): Promise<MarketSnapshotResponse> {
    const endpoint = `${this.cdnBaseUrl}${MARKET_WATCH_PATH}`;
    const response = await this.client.get<Record<string, unknown>>(endpoint);
    const rows = this.extractMarketWatchRows(response.data);
    const symbols = rows.map((row) => this.normalizeJsonRow(row));

    return {
      provider: this.providerName,
      fetchedAt: new Date().toISOString(),
      endpoint,
      endpoints: this.endpoints,
      responseStructure: this.endpoints[0].responseStructure,
      symbols,
      raw: response.data
    };
  }

  private async fetchLegacyMarketWatch(): Promise<MarketSnapshotResponse> {
    const endpoint = `${this.oldBaseUrl}${OLD_MARKET_WATCH_PATH}`;
    const response = await this.client.get<string>(endpoint, { responseType: 'text' });
    const parsed = this.parseLegacyMarketWatch(response.data);

    return {
      provider: this.providerName,
      fetchedAt: new Date().toISOString(),
      endpoint,
      endpoints: this.endpoints,
      responseStructure: this.endpoints[1].responseStructure,
      symbols: parsed.symbols,
      raw: parsed.raw
    };
  }

  private extractMarketWatchRows(data: Record<string, unknown>): Record<string, unknown>[] {
    const rows = data.marketwatch ?? data.marketWatch ?? data.marketWatchDto ?? data;
    if (!Array.isArray(rows)) {
      throw new Error('TSETMC response did not contain a marketwatch array');
    }

    return rows.filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null);
  }

  private normalizeJsonRow(row: Record<string, unknown>): NormalizedMarketInstrument {
    return {
      symbol: this.requiredString(row, ['lVal18AFC', 'l18', 'symbol', 'lVal18'], 'unknown'),
      instrumentId: this.optionalString(row, ['insCode', 'id', 'instrumentId']),
      isin: this.optionalString(row, ['cIsin', 'isin', 'instrumentID']),
      name: this.optionalString(row, ['lVal30', 'l30', 'name']),
      lastPrice: this.requiredNumber(row, ['pl', 'pDrCotVal', 'lastPrice']),
      closingPrice: this.optionalNumber(row, ['pc', 'pClosing', 'closingPrice']),
      volume: this.requiredNumber(row, ['tvol', 'qTotTran5J', 'volume']),
      tradeCount: Math.trunc(this.requiredNumber(row, ['tno', 'zTotTran', 'tradeCount'])),
      tradeValue: this.optionalNumber(row, ['tval', 'qTotCap', 'tradeValue']),
      tradeTime: this.normalizeTsetmcTime(this.optionalNumber(row, ['hEven', 'heven', 'lastHEven'])),
      queue: this.extractQueue(row),
      raw: row
    };
  }

  private parseLegacyMarketWatch(text: string): { symbols: NormalizedMarketInstrument[]; raw: Record<string, unknown> } {
    const sections = text.split('@');
    if (sections.length < 5) {
      throw new Error('Unexpected TSETMC legacy response shape');
    }

    const [, marketState, instrumentRows, bestLimitRows, refId] = sections;
    const bestLimits = this.parseLegacyBestLimits(bestLimitRows);
    const symbols = instrumentRows
      .split(';')
      .filter(Boolean)
      .map((line) => this.parseLegacyInstrumentLine(line, bestLimits));

    return { symbols, raw: { marketState, refId, instrumentRowCount: symbols.length } };
  }

  private parseLegacyInstrumentLine(line: string, bestLimits: Map<string, MarketQueueLevel[]>): NormalizedMarketInstrument {
    const cols = line.split(',');
    const row: Record<string, unknown> = {
      insCode: cols[0],
      isin: cols[1],
      l18: cols[2],
      l30: cols[3],
      heven: cols[4],
      pf: cols[5],
      pc: cols[6],
      pl: cols[7],
      tno: cols[8],
      tvol: cols[9],
      tval: cols[10],
      pmin: cols[11],
      pmax: cols[12],
      py: cols[13]
    };

    return {
      symbol: this.requiredString(row, ['l18'], 'unknown'),
      instrumentId: this.optionalString(row, ['insCode']),
      isin: this.optionalString(row, ['isin']),
      name: this.optionalString(row, ['l30']),
      lastPrice: this.requiredNumber(row, ['pl']),
      closingPrice: this.optionalNumber(row, ['pc']),
      volume: this.requiredNumber(row, ['tvol']),
      tradeCount: Math.trunc(this.requiredNumber(row, ['tno'])),
      tradeValue: this.optionalNumber(row, ['tval']),
      tradeTime: this.normalizeTsetmcTime(this.optionalNumber(row, ['heven'])),
      queue: bestLimits.get(String(cols[0])) || [],
      raw: row
    };
  }

  private parseLegacyBestLimits(text: string): Map<string, MarketQueueLevel[]> {
    const result = new Map<string, MarketQueueLevel[]>();
    for (const line of text.split(';').filter(Boolean)) {
      const [insCode, level, askCount, bidCount, bidPrice, askPrice, bidVolume, askVolume] = line.split(',');
      const queueLevel: MarketQueueLevel = {
        level: this.toNumber(level) || 0,
        bidCount: this.toNullableNumber(bidCount),
        bidVolume: this.toNullableNumber(bidVolume),
        bidPrice: this.toNullableNumber(bidPrice),
        askPrice: this.toNullableNumber(askPrice),
        askVolume: this.toNullableNumber(askVolume),
        askCount: this.toNullableNumber(askCount)
      };
      const existing = result.get(insCode) || [];
      existing.push(queueLevel);
      result.set(insCode, existing);
    }
    return result;
  }

  private extractQueue(row: Record<string, unknown>): MarketQueueLevel[] {
    const queue: MarketQueueLevel[] = [];
    const nested = row.bestLimits ?? row.bestLimit ?? row.orderBook;

    if (Array.isArray(nested)) {
      return nested
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .map((item, index) => this.normalizeQueueLevel(item, index + 1));
    }

    for (let level = 1; level <= 5; level += 1) {
      const levelInfo = this.normalizeQueueLevel(row, level);
      if (
        levelInfo.bidPrice !== null ||
        levelInfo.bidVolume !== null ||
        levelInfo.askPrice !== null ||
        levelInfo.askVolume !== null
      ) {
        queue.push(levelInfo);
      }
    }

    return queue;
  }

  private normalizeQueueLevel(row: Record<string, unknown>, level: number): MarketQueueLevel {
    return {
      level,
      bidCount: this.optionalNumber(row, [`zd${level}`, 'zd', 'bidCount']),
      bidVolume: this.optionalNumber(row, [`qd${level}`, 'qd', 'bidVolume']),
      bidPrice: this.optionalNumber(row, [`pd${level}`, 'pd', 'bidPrice']),
      askPrice: this.optionalNumber(row, [`po${level}`, 'po', 'askPrice']),
      askVolume: this.optionalNumber(row, [`qo${level}`, 'qo', 'askVolume']),
      askCount: this.optionalNumber(row, [`zo${level}`, 'zo', 'askCount'])
    };
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
      const value = this.toNullableNumber(row[key]);
      if (value !== null) {
        return value;
      }
    }
    return null;
  }

  private toNullableNumber(value: unknown): number | null {
    const numberValue = this.toNumber(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.replace(/,/g, '').replace(/[−-]$/, (match) => (match ? '-' : '')).trim();
      return Number(normalized);
    }
    return Number.NaN;
  }

  private normalizeTsetmcTime(value: number | null): string | null {
    if (value === null || value <= 0) {
      return null;
    }
    const padded = Math.trunc(value).toString().padStart(6, '0');
    return `${padded.slice(0, 2)}:${padded.slice(2, 4)}:${padded.slice(4, 6)}`;
  }
}

export function describeAxiosError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    return `${axiosError.message}${axiosError.response ? ` (HTTP ${axiosError.response.status})` : ''}`;
  }
  return error instanceof Error ? error.message : String(error);
}
