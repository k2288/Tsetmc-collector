export interface QualityAssessment {
  qualityScore: number;
  qualityFlags: string[];
}

export interface MarketSnapshot {
  tsetmcId: string;
  symbol: string;
  timestampUtc: Date;
  providerTimestampUtc?: Date;
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
  providerTimestampUtc?: Date;
  realBuyVolume?: bigint;
  realSellVolume?: bigint;
  legalBuyVolume?: bigint;
  legalSellVolume?: bigint;
  realBuyerCount?: number;
  realSellerCount?: number;
}

export interface NormalizedMarketSnapshot extends MarketSnapshot, QualityAssessment {
  providerVersion: string;
  normalizerVersion: string;
}

export interface NormalizedMoneyFlowSnapshot extends MoneyFlowSnapshot, QualityAssessment {
  providerVersion: string;
  normalizerVersion: string;
}
