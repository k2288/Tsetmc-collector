export interface MarketDataProvider {
  readonly providerName: string;
  fetchMarketSnapshot(): Promise<Record<string, unknown>>;
}
