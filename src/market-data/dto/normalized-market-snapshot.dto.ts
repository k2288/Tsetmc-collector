export class NormalizedMarketSnapshotDto {
  providerName!: string;
  symbol!: string;
  instrumentId?: string;
  isin?: string;
  name?: string;
  lastPrice?: number;
  closingPrice?: number;
  openingPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  tradeVolume?: number;
  tradeValue?: number;
  tradeCount?: number;
  sourceTimestamp!: Date;
  capturedAt!: Date;
  tradingDate?: string;
  dedupeKey!: string;
  metadata?: Record<string, unknown>;
}
