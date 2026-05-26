import { CanonicalTimelineService } from '../../src/integrity/canonical-timeline.service';
import { CorporateActionService } from '../../src/integrity/corporate-action.service';
import { LifecycleEngineService } from '../../src/integrity/lifecycle-engine.service';
import { ValidationEngineService } from '../../src/integrity/validation-engine.service';
import { LifecycleState, ValidityState } from '../../src/models/market-integrity.models';
import { NormalizerService } from '../../src/normalizer/normalizer.service';
import { ReprocessingService } from '../../src/reprocessing/reprocessing.service';

describe('Phase 2 integrity + normalization', () => {
  const validator = new ValidationEngineService();
  const lifecycle = new LifecycleEngineService();
  const corp = new CorporateActionService();
  const timeline = new CanonicalTimelineService();
  const normalizer = new NormalizerService(validator);
  const reprocessor = new ReprocessingService(normalizer);

  it('malformed historical replay throws', () => {
    expect(() => reprocessor.rebuildMarket({ bad: true }, 'v1')).toThrow();
  });

  it('corporate action adjustment correctness', () => {
    expect(corp.applyAdjustment(1000, 0.5)).toBe(500);
    expect(corp.buildChainIntegrity([0.5, 2, 1.1])).toBe(true);
  });

  it('lifecycle transition integrity', () => {
    expect(lifecycle.canTransition(LifecycleState.ACTIVE, LifecycleState.HALTED)).toBe(true);
    expect(lifecycle.canTransition(LifecycleState.DELISTED, LifecycleState.ACTIVE)).toBe(false);
  });

  it('gap reconstruction + timeline integrity', () => {
    const base = new Date('2026-01-01T00:00:00Z');
    const points = timeline.build('ins-1', [base, new Date(base.getTime() + 120000)], 60000);
    expect(points.map((x) => x.marker)).toEqual(['OBSERVED', 'MISSING', 'OBSERVED']);
  });

  it('stale provider flood + anomaly burst style flags', () => {
    const res = validator.validateSnapshot({ symbol: 'A', timestampUtc: new Date('2026-01-01T00:00:00Z'), providerTimestampUtc: new Date('2025-12-31T00:00:00Z'), bidPrice: 110, askPrice: 100, openPrice: -1 });
    expect(res.validityState).toBe(ValidityState.INVALID);
    expect(res.qualityFlags).toEqual(expect.arrayContaining(['stale_snapshot', 'impossible_spread', 'negative_prices']));
  });

  it('reprocessing determinism', () => {
    const payload = [{ tsetmcId: '1', symbol: 'A', timestampUtc: new Date('2026-01-01T00:00:00Z') }];
    const x = reprocessor.rebuildMarket(payload, 'v1');
    const y = reprocessor.rebuildMarket(payload, 'v1');
    expect(x).toEqual(y);
  });
});
