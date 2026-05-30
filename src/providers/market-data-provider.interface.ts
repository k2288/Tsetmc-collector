export interface MarketDataProvider {
  readonly name: string;
  fetchMarketSnapshot(): Promise<unknown>;
}

export const MARKET_DATA_PROVIDERS = Symbol('MARKET_DATA_PROVIDERS');
