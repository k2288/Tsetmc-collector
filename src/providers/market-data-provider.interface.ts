import { MarketSnapshot, MoneyFlowSnapshot } from '../models/market-data.models';

export interface MarketDataProvider {
  readonly providerName: string;
  fetchMarketWatch(): Promise<MarketSnapshot[]>;
  fetchClientTypes(): Promise<MoneyFlowSnapshot[]>;
}
