export interface MarketQueueLevel {
  level: number;
  bidCount: number | null;
  bidVolume: number | null;
  bidPrice: number | null;
  askPrice: number | null;
  askVolume: number | null;
  askCount: number | null;
}

export interface NormalizedMarketInstrument {
  symbol: string;
  instrumentId: string | null;
  isin: string | null;
  name: string | null;
  lastPrice: number;
  closingPrice: number | null;
  volume: number;
  tradeCount: number;
  tradeValue: number | null;
  tradeTime: string | null;
  queue: MarketQueueLevel[];
  raw: Record<string, unknown>;
}

export interface ProviderEndpointDescription {
  url: string;
  purpose: string;
  responseStructure: string;
}

export interface MarketSnapshotResponse {
  provider: string;
  fetchedAt: string;
  endpoint: string;
  endpoints: ProviderEndpointDescription[];
  responseStructure: string;
  symbols: NormalizedMarketInstrument[];
  raw: unknown;
}

export interface MarketDataProvider {
  readonly providerName: string;
  fetchMarketSnapshot(): Promise<MarketSnapshotResponse>;
}
