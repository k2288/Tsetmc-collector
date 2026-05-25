import { Injectable } from '@nestjs/common';
import {
  MarketSnapshot,
  MoneyFlowSnapshot,
  NormalizedMarketSnapshot,
  NormalizedMoneyFlowSnapshot
} from '../models/market-data.models';
import { NormalizationError } from '../common/errors';

@Injectable()
export class NormalizerService {
  private readonly normalizerVersion = 'normalizer-v2';

  normalizeMarket(data: unknown, providerVersion: string): NormalizedMarketSnapshot[] {
    if (!Array.isArray(data)) throw new NormalizationError('market payload is not an array');
    return data
      .filter((x): x is MarketSnapshot => !!x && typeof x === 'object')
      .filter((x) => x.symbol && x.timestampUtc)
      .map((x) => ({
        ...x,
        providerTimestampUtc: x.providerTimestampUtc ?? x.timestampUtc,
        providerVersion,
        normalizerVersion: this.normalizerVersion,
        qualityScore: this.scoreQuality(x),
        qualityFlags: this.collectFlags(x)
      }));
  }

  normalizeMoneyFlow(data: unknown, providerVersion: string): NormalizedMoneyFlowSnapshot[] {
    if (!Array.isArray(data)) throw new NormalizationError('money flow payload is not an array');
    return data
      .filter((x): x is MoneyFlowSnapshot => !!x && typeof x === 'object')
      .filter((x) => x.symbol && x.timestampUtc)
      .map((x) => ({
        ...x,
        providerTimestampUtc: x.providerTimestampUtc ?? x.timestampUtc,
        providerVersion,
        normalizerVersion: this.normalizerVersion,
        qualityScore: this.scoreQuality(x),
        qualityFlags: this.collectFlags(x)
      }));
  }

  private collectFlags(row: Partial<MarketSnapshot | MoneyFlowSnapshot>): string[] {
    const flags: string[] = [];
    if (!row.symbol || !row.timestampUtc) flags.push('malformed_fields');
    if (!row.providerTimestampUtc) flags.push('partial_payload');
    if (row.providerTimestampUtc && Date.now() - new Date(row.providerTimestampUtc).getTime() > 30_000) flags.push('stale_provider');
    return flags;
  }

  private scoreQuality(row: Partial<MarketSnapshot | MoneyFlowSnapshot>): number {
    return Math.max(0, 1 - this.collectFlags(row).length * 0.25);
  }
}
