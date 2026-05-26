import { Injectable } from '@nestjs/common';
import { NormalizedMarketSnapshotDto } from '../dto/normalized-market-snapshot.dto';

@Injectable()
export class SnapshotNormalizer {
  normalize(provider: string, payload: Record<string, unknown>): NormalizedMarketSnapshotDto {
    const snapshotTimeUtc = new Date().toISOString();

    return {
      provider,
      symbol: 'TEPIX',
      lastPrice: 0,
      volume: 0,
      tradeCount: 0,
      snapshotTimeUtc,
      deduplicationKey: `${provider}:TEPIX:${snapshotTimeUtc}:${JSON.stringify(payload).length}`
    };
  }
}
