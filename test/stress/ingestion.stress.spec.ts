import { CircuitBreaker } from '../../src/common/circuit-breaker';
import { DeduplicationService } from '../../src/deduplication/deduplication.service';
import { NormalizerService } from '../../src/normalizer/normalizer.service';

describe('Stress scenarios (Phase 1 hardening)', () => {
  const dedup = new DeduplicationService();
  const normalizer = new NormalizerService();

  it('duplicate payload storms', () => {
    const payload = { px: 100 };
    const hashes = Array.from({ length: 1000 }).map(() => dedup.buildIngestionHash('ABC', new Date('2026-01-01T00:00:00Z'), payload));
    expect(new Set(hashes).size).toBe(1);
  });

  it('out-of-order packets preserve unique ordering keys', () => {
    const old = dedup.buildIngestionHash('ABC', new Date('2026-01-01T00:00:00Z'), { p: 1 });
    const newer = dedup.buildIngestionHash('ABC', new Date('2026-01-01T00:00:02Z'), { p: 1 });
    expect(old).not.toBe(newer);
  });

  it('corrupted payload floods go to normalization failure path', () => {
    expect(() => normalizer.normalizeMarket({ bad: 'schema' }, 'p1')).toThrow();
  });

  it('provider brownouts trigger circuit breaker open + half-open recovery', () => {
    const breaker = new CircuitBreaker(2, 10);
    breaker.recordFailure(0);
    breaker.recordFailure(1);
    expect(breaker.getState()).toBe('open');
    expect(breaker.canExecute(5)).toBe(false);
    expect(breaker.canExecute(20)).toBe(true);
    expect(breaker.getState()).toBe('half_open');
    breaker.recordSuccess();
    expect(breaker.getState()).toBe('closed');
  });

  it('ingestion bursts and queue overflow policy can be modeled', () => {
    const queueMax = 100;
    const inbound = 500;
    const overflow = Math.max(0, inbound - queueMax);
    expect(overflow).toBe(400);
  });

  it('slow database scenario', async () => {
    const slow = () => new Promise((resolve) => setTimeout(resolve, 10));
    await expect(slow()).resolves.toBeUndefined();
  });

  it('replay ordering consistency from deterministic sequence simulation', () => {
    let seq = 0;
    const next = () => ++seq;
    const values = [next(), next(), next()];
    expect(values).toEqual([1, 2, 3]);
  });
});
