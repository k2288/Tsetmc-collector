import { Injectable } from '@nestjs/common';
import { MarketSnapshot, MoneyFlowSnapshot, NormalizedMarketSnapshot, NormalizedMoneyFlowSnapshot } from '../models/market-data.models';
import { NormalizationError } from '../common/errors';
import { ValidationEngineService } from '../integrity/validation-engine.service';

@Injectable()
export class NormalizerService {
  private readonly normalizerVersion = 'normalizer-v3-phase2';

  constructor(private readonly validator: ValidationEngineService) {}

  normalizeMarket(data: unknown, providerVersion: string): NormalizedMarketSnapshot[] {
    if (!Array.isArray(data)) throw new NormalizationError('market payload is not an array');
    return data
      .filter((x): x is MarketSnapshot => !!x && typeof x === 'object')
      .map((x) => {
        const baseline = {
          ...x,
          providerTimestampUtc: (x.providerTimestampUtc as Date | undefined) ?? x.timestampUtc,
          providerVersion,
          normalizerVersion: this.normalizerVersion
        };
        const verdict = this.validator.validateSnapshot(baseline);
        return { ...baseline, ...verdict };
      })
      .filter((x) => !!x.symbol && !!x.timestampUtc);
  }

  normalizeMoneyFlow(data: unknown, providerVersion: string): NormalizedMoneyFlowSnapshot[] {
    if (!Array.isArray(data)) throw new NormalizationError('money flow payload is not an array');
    return data
      .filter((x): x is MoneyFlowSnapshot => !!x && typeof x === 'object')
      .map((x) => {
        const baseline = {
          ...x,
          providerTimestampUtc: (x.providerTimestampUtc as Date | undefined) ?? x.timestampUtc,
          providerVersion,
          normalizerVersion: this.normalizerVersion
        };
        const verdict = this.validator.validateSnapshot(baseline);
        return { ...baseline, ...verdict };
      })
      .filter((x) => !!x.symbol && !!x.timestampUtc);
  }
}
