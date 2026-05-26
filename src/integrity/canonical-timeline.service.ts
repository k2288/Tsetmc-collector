import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { CanonicalTimelinePoint } from '../models/market-integrity.models';
@Injectable()
export class CanonicalTimelineService {
  build(instrumentId: string, timestamps: Date[], intervalMs = 60_000): CanonicalTimelinePoint[] {
    if (timestamps.length === 0) return [];
    const sorted = [...timestamps].sort((a, b) => a.getTime() - b.getTime());
    const out: CanonicalTimelinePoint[] = [];
    for (let t = sorted[0].getTime(); t <= sorted[sorted.length - 1].getTime(); t += intervalMs) {
      const hasData = sorted.some((s) => s.getTime() === t);
      out.push({ instrumentId, intervalStartUtc: new Date(t), intervalEndUtc: new Date(t + intervalMs), hasData, marker: hasData ? 'OBSERVED' : 'MISSING', timelineHash: createHash('sha256').update(`${instrumentId}:${t}:${hasData}`).digest('hex') });
    }
    return out;
  }
}
