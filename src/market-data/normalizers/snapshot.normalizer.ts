import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { MarketSnapshotResponse, NormalizedMarketInstrument } from '../../providers/market-data-provider.interface';
import { NormalizedMarketSnapshotDto } from '../dto/normalized-market-snapshot.dto';

@Injectable()
export class SnapshotNormalizer {
  normalize(provider: string, payload: Record<string, unknown>): NormalizedMarketSnapshotDto {
    const marketPayload = payload as unknown as MarketSnapshotResponse;
    const firstSymbol = Array.isArray(marketPayload.symbols) ? marketPayload.symbols[0] : undefined;

    if (!firstSymbol) {
      throw new Error(`Provider ${provider} returned no symbols to normalize`);
    }

    return this.normalizeInstrument(provider, firstSymbol, marketPayload.fetchedAt || new Date().toISOString());
  }

  normalizeInstrument(provider: string, instrument: NormalizedMarketInstrument, snapshotTimeUtc: string): NormalizedMarketSnapshotDto {
    const hash = createHash('sha1')
      .update(`${provider}:${instrument.instrumentId || instrument.symbol}:${snapshotTimeUtc}:${instrument.lastPrice}:${instrument.volume}:${instrument.tradeCount}`)
      .digest('hex');

    return {
      provider,
      symbol: instrument.symbol,
      lastPrice: instrument.lastPrice,
      volume: instrument.volume,
      tradeCount: instrument.tradeCount,
      snapshotTimeUtc,
      deduplicationKey: `${provider}:${hash}`
    };
  }
}
