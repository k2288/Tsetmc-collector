import { createHash } from 'crypto';

import { Injectable } from '@nestjs/common';

import { NormalizedMarketSnapshotDto } from '../dto/normalized-market-snapshot.dto';

@Injectable()
export class MarketDataNormalizer {
  normalize(
    providerName: string,
    rawPayload: unknown,
    capturedAt: Date,
  ): NormalizedMarketSnapshotDto[] {
    if (providerName === 'tsetmc') {
      return this.normalizeTsetmc(rawPayload, capturedAt);
    }

    return this.normalizeGenericProvider(providerName, rawPayload, capturedAt);
  }

  private normalizeTsetmc(
    rawPayload: unknown,
    capturedAt: Date,
  ): NormalizedMarketSnapshotDto[] {
    const data = this.unwrapData(rawPayload);
    const rows = this.findFirstArray(data, [
      'marketwatch',
      'marketWatch',
      'data',
    ]);

    return rows
      .map((row) => this.normalizeTsetmcRow(row, capturedAt))
      .filter((row): row is NormalizedMarketSnapshotDto => row !== undefined);
  }

  private normalizeTsetmcRow(
    row: Record<string, unknown>,
    capturedAt: Date,
  ): NormalizedMarketSnapshotDto | undefined {
    const symbol = this.stringValue(
      row.l18 ?? row.symbol ?? row.instrumentName,
    );
    const instrumentId = this.stringValue(
      row.insCode ?? row.instrumentId ?? row.id,
    );

    if (!symbol && !instrumentId) {
      return undefined;
    }

    const sourceTimestamp = this.parseSourceTimestamp(row, capturedAt);
    const naturalKey = instrumentId ?? symbol ?? 'unknown';
    const dedupeKey = this.createDedupeKey(
      'tsetmc',
      naturalKey,
      sourceTimestamp,
    );

    return {
      providerName: 'tsetmc',
      symbol: symbol ?? naturalKey,
      instrumentId,
      isin: this.stringValue(row.isin ?? row.cIsin),
      name: this.stringValue(row.l30 ?? row.name ?? row.instrumentTitle),
      lastPrice: this.numberValue(row.pDrCotVal ?? row.lastPrice),
      closingPrice: this.numberValue(row.pClosing ?? row.adjustedClose ?? row.closingPrice),
      openingPrice: this.numberValue(row.priceFirst ?? row.openPrice ?? row.openingPrice),
      highPrice: this.numberValue(row.priceMax ?? row.maxPrice ?? row.highPrice),
      lowPrice: this.numberValue(row.priceMin ?? row.minPrice ?? row.lowPrice),
      tradeVolume: this.numberValue(row.qTotTran5J ?? row.volume ?? row.tradeVolume),
      tradeValue: this.numberValue(row.qTotCap ?? row.value ?? row.tradeValue),
      tradeCount: this.numberValue(row.zTotTran ?? row.tradeCount),
      sourceTimestamp,
      capturedAt,
      tradingDate: sourceTimestamp.toISOString().slice(0, 10),
      dedupeKey,
      metadata: row,
    };
  }

  private normalizeGenericProvider(
    providerName: string,
    rawPayload: unknown,
    capturedAt: Date,
  ): NormalizedMarketSnapshotDto[] {
    const data = this.unwrapData(rawPayload);
    const rows = this.findFirstArray(data, ['data', 'symbols', 'items']);

    return rows
      .map((row): NormalizedMarketSnapshotDto | undefined => {
        const symbol = this.stringValue(row.symbol ?? row.ticker ?? row.name);
        if (!symbol) {
          return undefined;
        }
        const sourceTimestamp = this.parseSourceTimestamp(row, capturedAt);
        return {
          providerName,
          symbol,
          instrumentId: this.stringValue(row.instrumentId ?? row.insCode),
          isin: this.stringValue(row.isin),
          name: this.stringValue(row.name),
          lastPrice: this.numberValue(row.lastPrice ?? row.last),
          closingPrice: this.numberValue(row.closingPrice ?? row.close),
          tradeVolume: this.numberValue(row.volume),
          tradeValue: this.numberValue(row.value),
          sourceTimestamp,
          capturedAt,
          tradingDate: sourceTimestamp.toISOString().slice(0, 10),
          dedupeKey: this.createDedupeKey(
            providerName,
            symbol,
            sourceTimestamp,
          ),
          metadata: row,
        };
      })
      .filter((row): row is NormalizedMarketSnapshotDto => row !== undefined);
  }

  private unwrapData(rawPayload: unknown): Record<string, unknown> {
    if (Array.isArray(rawPayload)) {
      return { data: rawPayload };
    }
    if (!this.isRecord(rawPayload)) {
      return {};
    }
    const data = rawPayload.data;
    if (this.isRecord(data)) {
      return data;
    }
    if (Array.isArray(data)) {
      return { data };
    }
    return rawPayload;
  }

  private findFirstArray(
    source: Record<string, unknown>,
    candidateKeys: string[],
  ): Record<string, unknown>[] {
    for (const key of candidateKeys) {
      const value = source[key];
      if (Array.isArray(value)) {
        return value.filter(this.isRecord);
      }
    }

    for (const value of Object.values(source)) {
      if (Array.isArray(value)) {
        return value.filter(this.isRecord);
      }
    }

    return [];
  }

  private parseSourceTimestamp(
    row: Record<string, unknown>,
    capturedAt: Date,
  ): Date {
    const candidate =
      row.sourceTimestamp ?? row.timestamp ?? row.time ?? row.hEven;
    if (candidate instanceof Date) {
      return candidate;
    }
    if (typeof candidate === 'string' || typeof candidate === 'number') {
      const normalized = this.normalizeTimeCandidate(candidate, capturedAt);
      const parsed = new Date(normalized);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return capturedAt;
  }

  private normalizeTimeCandidate(
    candidate: string | number,
    capturedAt: Date,
  ): string | number {
    const value = String(candidate);
    if (/^\d{5,6}$/.test(value)) {
      const padded = value.padStart(6, '0');
      const day = capturedAt.toISOString().slice(0, 10);
      return `${day}T${padded.slice(0, 2)}:${padded.slice(2, 4)}:${padded.slice(4, 6)}.000Z`;
    }
    return candidate;
  }

  private createDedupeKey(
    providerName: string,
    naturalKey: string,
    sourceTimestamp: Date,
  ): string {
    const input = `${providerName}:${naturalKey}:${sourceTimestamp.toISOString()}`;
    return createHash('sha256').update(input).digest('hex');
  }

  private numberValue(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private stringValue(value: unknown): string | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    const parsed = String(value).trim();
    return parsed.length > 0 ? parsed : undefined;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
