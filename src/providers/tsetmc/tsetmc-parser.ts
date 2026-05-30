import { gunzipSync, inflateSync, unzipSync } from 'node:zlib';

import {
  DailyPrice,
  InstrumentMetadata,
  MarketSnapshotRow,
  OrderBookLevel,
  RealLegalActivity,
  RealLegalSummary,
  RealtimeInstrumentData,
} from '../market-data-provider.interface';

export class TsetmcParser {
  static decodeText(payload: unknown): string {
    if (Buffer.isBuffer(payload)) {
      return this.decodeBuffer(payload);
    }
    if (payload instanceof ArrayBuffer) {
      return this.decodeBuffer(Buffer.from(payload));
    }
    return String(payload ?? '');
  }

  static parseMarketWatchInit(payload: string): MarketSnapshotRow[] {
    const groups = this.parseAtGroups(payload);
    const rows = this.parseRows(groups[2] ?? '');
    return rows
      .map((row) => this.parseMarketWatchRow(row))
      .filter((row): row is MarketSnapshotRow => row !== undefined);
  }

  static parseRealtimeInstrument(
    instrumentId: string,
    payload: string,
  ): RealtimeInstrumentData {
    const sections = payload.split(';');
    const first = this.splitFields(sections[0] ?? '');
    const orderSection = sections.find((section) =>
      this.parseRows(section).some((row) => this.looksLikeOrderBookRow(row)),
    );
    const realLegalSection = sections.find((section) => {
      const fields = this.splitFields(section);
      return fields.length >= 8 && fields.slice(0, 8).every((v) => this.toNumber(v) !== undefined);
    });

    const orderBook = this.parseOrderBook(orderSection ?? '');
    const realLegalSummary = realLegalSection
      ? this.parseRealLegalFields(this.splitFields(realLegalSection))
      : undefined;

    return {
      instrumentId,
      state: this.firstText(first, [1, 2, 15]),
      lastPrice: this.firstNumber(first, [1, 2, 6, 7]),
      adjustedClose: this.firstNumber(first, [3, 4, 10]),
      openPrice: this.firstNumber(first, [4, 5, 11]),
      highPrice: this.firstNumber(first, [5, 6, 12]),
      lowPrice: this.firstNumber(first, [6, 7, 13]),
      volume: this.firstNumber(first, [8, 9, 15]),
      value: this.firstNumber(first, [9, 10, 16]),
      tradeCount: this.firstNumber(first, [7, 8, 14]),
      orderBook,
      realLegalSummary,
    };
  }

  static parseInstrumentMetadata(
    instrumentId: string,
    payload: unknown,
  ): InstrumentMetadata {
    const record = this.unwrapInstrumentInfo(payload);
    return {
      instrumentId: this.stringValue(record.insCode) ?? instrumentId,
      symbol: this.stringValue(record.lVal18AFC ?? record.lVal18 ?? record.symbol),
      sector: this.stringValue(
        record.cSecVal ?? record.sector ?? record.sectorName ?? record.cs,
      ),
      isin: this.stringValue(record.cIsin ?? record.isin),
      eps: this.toNumber(record.eps ?? record.estimatedEPS),
      baseVolume: this.toNumber(record.baseVol ?? record.bVol ?? record.baseVolume),
      totalShares: this.toNumber(record.zTitad ?? record.totalShares),
    };
  }

  static parseRealLegalAll(payload: string): RealLegalActivity[] {
    return this.parseRows(payload)
      .map((row) => {
        const f = this.splitFields(row);
        const instrumentId = this.stringValue(f[0]);
        if (!instrumentId) return undefined;
        return {
          instrumentId,
          ...this.parseRealLegalFields(f.slice(1)),
        };
      })
      .filter((row): row is RealLegalActivity => row !== undefined);
  }

  static parseHistoricalPrices(payload: string): DailyPrice[] {
    return this.parseRows(payload)
      .map((row) => this.parseHistoricalRow(row))
      .filter((row): row is DailyPrice => row !== undefined)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  static parseOrderBook(section: string): OrderBookLevel[] {
    return this.parseRows(section)
      .map((row) => {
        const f = this.splitFields(row);
        if (!this.looksLikeOrderBookRow(row)) return undefined;
        return {
          level: this.toNumber(f[1]) ?? this.toNumber(f[0]) ?? 0,
          askCount: this.toNumber(f[2]),
          askVolume: this.toNumber(f[3]),
          askPrice: this.toNumber(f[4]),
          bidPrice: this.toNumber(f[5]),
          bidVolume: this.toNumber(f[6]),
          bidCount: this.toNumber(f[7]),
        };
      })
      .filter((row): row is OrderBookLevel => row !== undefined)
      .sort((a, b) => a.level - b.level);
  }

  private static parseMarketWatchRow(row: string): MarketSnapshotRow | undefined {
    const f = this.splitFields(row);
    const instrumentId = this.stringValue(f[0]);
    if (!instrumentId) return undefined;

    return {
      instrumentId,
      symbol: this.firstText(f, [2, 3, 18]),
      name: this.firstText(f, [3, 4, 19]),
      tradeCount: this.firstNumber(f, [8, 4]),
      volume: this.firstNumber(f, [9, 5]),
      value: this.firstNumber(f, [10, 6]),
      yesterdayPrice: this.firstNumber(f, [13, 7]),
      openPrice: this.firstNumber(f, [14, 8]),
      minPrice: this.firstNumber(f, [11, 12]),
      maxPrice: this.firstNumber(f, [12, 13]),
      lastPrice: this.firstNumber(f, [15, 7]),
      adjustedClose: this.firstNumber(f, [16, 10]),
    };
  }

  private static parseHistoricalRow(row: string): DailyPrice | undefined {
    const f = this.splitFields(row);
    const dateRaw = f.find((value) => /^\d{8}$/.test(value));
    const dateIndex = dateRaw ? f.indexOf(dateRaw) : -1;
    if (!dateRaw || dateIndex < 0) return undefined;
    const values = f.slice(dateIndex + 1);
    return {
      date: `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`,
      open: this.toNumber(values[0]),
      high: this.toNumber(values[1]),
      low: this.toNumber(values[2]),
      close: this.toNumber(values[3]),
      value: this.toNumber(values[4]),
      volume: this.toNumber(values[5]),
      count: this.toNumber(values[6]),
      adjustedClose: this.toNumber(values[9]) ?? this.toNumber(values[3]),
    };
  }

  private static parseRealLegalFields(f: string[]): RealLegalSummary {
    return {
      realBuyCount: this.toNumber(f[0]),
      legalBuyCount: this.toNumber(f[1]),
      realSellCount: this.toNumber(f[2]),
      legalSellCount: this.toNumber(f[3]),
      realBuyVolume: this.toNumber(f[4]),
      legalBuyVolume: this.toNumber(f[5]),
      realSellVolume: this.toNumber(f[6]),
      legalSellVolume: this.toNumber(f[7]),
      realBuyValue: this.toNumber(f[8]),
      legalBuyValue: this.toNumber(f[9]),
      realSellValue: this.toNumber(f[10]),
      legalSellValue: this.toNumber(f[11]),
    };
  }

  private static parseAtGroups(payload: string): Record<number, string> {
    return payload.split('@').reduce<Record<number, string>>((acc, group, index) => {
      acc[index] = group;
      return acc;
    }, {});
  }

  private static parseRows(section: string): string[] {
    return section
      .split(';')
      .map((row) => row.trim())
      .filter(Boolean);
  }

  private static splitFields(row: string): string[] {
    return row.split(',').map((field) => field.trim());
  }

  private static looksLikeOrderBookRow(row: string): boolean {
    const f = this.splitFields(row);
    return f.length >= 8 && f.slice(1, 8).every((value) => this.toNumber(value) !== undefined);
  }

  private static unwrapInstrumentInfo(payload: unknown): Record<string, unknown> {
    if (!this.isRecord(payload)) return {};
    const nested = payload.instrumentInfo ?? payload.instrument ?? payload.data;
    return this.isRecord(nested) ? nested : payload;
  }

  private static firstNumber(fields: string[], indexes: number[]): number | undefined {
    for (const index of indexes) {
      const value = this.toNumber(fields[index]);
      if (value !== undefined) return value;
    }
    return undefined;
  }

  private static firstText(fields: string[], indexes: number[]): string | undefined {
    for (const index of indexes) {
      const value = this.stringValue(fields[index]);
      if (value && this.toNumber(value) === undefined) return value;
    }
    return undefined;
  }

  private static stringValue(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    const normalized = String(value).trim();
    return normalized ? normalized : undefined;
  }

  private static toNumber(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const normalized = String(value).replace(/,/g, '').trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private static isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private static decodeBuffer(buffer: Buffer): string {
    for (const decode of [unzipSync, gunzipSync, inflateSync]) {
      try {
        return decode(buffer).toString('utf8');
      } catch {
        continue;
      }
    }
    return buffer.toString('utf8');
  }
}
