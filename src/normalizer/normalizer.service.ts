import { Injectable } from '@nestjs/common';
import { MoneyFlowSnapshot, MarketSnapshot } from '../models/market-data.models';

@Injectable()
export class NormalizerService {
  normalizeMarket(data: MarketSnapshot[]): MarketSnapshot[] { return data.filter((x) => x.symbol && x.timestampUtc); }
  normalizeMoneyFlow(data: MoneyFlowSnapshot[]): MoneyFlowSnapshot[] { return data.filter((x) => x.symbol && x.timestampUtc); }
}
