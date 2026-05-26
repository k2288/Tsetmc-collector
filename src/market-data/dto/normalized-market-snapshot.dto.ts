export class NormalizedMarketSnapshotDto {
  provider!: string;
  symbol!: string;
  lastPrice!: number;
  volume!: number;
  tradeCount!: number;
  snapshotTimeUtc!: string;
  deduplicationKey!: string;
}
