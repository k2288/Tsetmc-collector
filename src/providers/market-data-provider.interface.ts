export interface MarketSnapshotRow {
  instrumentId: string;
  symbol?: string;
  name?: string;
  lastPrice?: number;
  adjustedClose?: number;
  openPrice?: number;
  volume?: number;
  value?: number;
  tradeCount?: number;
  minPrice?: number;
  maxPrice?: number;
  yesterdayPrice?: number;
}

export interface OrderBookLevel {
  level: number;
  bidCount?: number;
  bidVolume?: number;
  bidPrice?: number;
  askPrice?: number;
  askVolume?: number;
  askCount?: number;
}

export interface RealLegalSummary {
  realBuyCount?: number;
  legalBuyCount?: number;
  realSellCount?: number;
  legalSellCount?: number;
  realBuyVolume?: number;
  legalBuyVolume?: number;
  realSellVolume?: number;
  legalSellVolume?: number;
  realBuyValue?: number;
  legalBuyValue?: number;
  realSellValue?: number;
  legalSellValue?: number;
}

export interface RealtimeInstrumentData {
  instrumentId: string;
  state?: string;
  lastPrice?: number;
  adjustedClose?: number;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  volume?: number;
  value?: number;
  tradeCount?: number;
  orderBook: OrderBookLevel[];
  realLegalSummary?: RealLegalSummary;
}

export interface InstrumentMetadata {
  instrumentId: string;
  symbol?: string;
  sector?: string;
  isin?: string;
  eps?: number;
  baseVolume?: number;
  totalShares?: number;
}

export interface RealLegalActivity extends RealLegalSummary {
  instrumentId: string;
}

export interface DailyPrice {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  value?: number;
  count?: number;
  adjustedClose?: number;
}

export interface MarketDataProvider {
  readonly name: string;
  fetchMarketSnapshot(): Promise<MarketSnapshotRow[]>;
}

export const MARKET_DATA_PROVIDERS = Symbol('MARKET_DATA_PROVIDERS');
