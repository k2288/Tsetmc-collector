export interface MarketSnapshot {
  tsetmcId: string;
  symbol: string;
  timestampUtc: Date;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  closePrice?: number;
  lastPrice?: number;
  volume?: bigint;
  valueTraded?: number;
  tradeCount?: number;
  bidPrice?: number;
  askPrice?: number;
  bidVolume?: bigint;
  askVolume?: bigint;
}

export interface MoneyFlowSnapshot {
  tsetmcId: string;
  symbol: string;
  timestampUtc: Date;
  realBuyVolume?: bigint;
  realSellVolume?: bigint;
  legalBuyVolume?: bigint;
  legalSellVolume?: bigint;
  realBuyerCount?: number;
  realSellerCount?: number;
}
