import { Injectable } from '@nestjs/common';
import { MarketSnapshot, MoneyFlowSnapshot } from '../models/market-data.models';
import { ValidationResult, ValidityState } from '../models/market-integrity.models';
@Injectable()
export class ValidationEngineService {
  validateSnapshot(row: Partial<MarketSnapshot | MoneyFlowSnapshot>, providerNow = new Date()): ValidationResult {
    const flags: string[] = [];
    if (!row.symbol || !row.timestampUtc) flags.push('missing_fields');
    if ([row.openPrice, row.highPrice, row.lowPrice, row.closePrice, row.lastPrice, row.bidPrice, row.askPrice].some((v) => (v ?? 0) < 0)) flags.push('negative_prices');
    if (!!(row.bidPrice && row.askPrice && row.askPrice < row.bidPrice)) flags.push('impossible_spread');
    if (row.providerTimestampUtc && row.timestampUtc && row.providerTimestampUtc > row.timestampUtc) flags.push('timestamp_reversal');
    if (row.providerTimestampUtc && providerNow.getTime() - new Date(row.providerTimestampUtc).getTime() > 60_000) flags.push('stale_snapshot');
    if ('volume' in row && typeof row.volume === 'bigint' && row.volume > 10_000_000_000n) flags.push('unrealistic_volume_spike');
    const providerLatencyMs = row.providerTimestampUtc ? Math.max(0, providerNow.getTime() - new Date(row.providerTimestampUtc).getTime()) : 0;
    const stalenessScore = Math.min(100, Math.floor(providerLatencyMs / 1000));
    const qualityScore = Math.max(0, 100 - flags.length * 12 - Math.floor(stalenessScore * 0.1));
    const validityState = flags.length === 0 ? ValidityState.VALID : flags.length < 3 ? ValidityState.WARNING : ValidityState.INVALID;
    return { validityState, qualityFlags: flags, validationReason: flags.join(',') || undefined, stalenessScore, providerLatencyMs, qualityScore };
  }
}
