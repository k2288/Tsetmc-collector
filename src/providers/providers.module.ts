import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { BrsApiProvider } from './brsapi/brsapi.provider';
import {
  MARKET_DATA_PROVIDERS,
  MarketDataProvider,
} from './market-data-provider.interface';
import { TsetmcHistoricalProvider } from './tsetmc/tsetmc-historical.provider';
import { TsetmcInstrumentProvider } from './tsetmc/tsetmc-instrument.provider';
import { TsetmcMarketProvider } from './tsetmc/tsetmc-market.provider';
import { TsetmcRealLegalProvider } from './tsetmc/tsetmc-real-legal.provider';
import { TsetmcRealtimeProvider } from './tsetmc/tsetmc-realtime.provider';

@Module({
  providers: [
    TsetmcMarketProvider,
    TsetmcRealtimeProvider,
    TsetmcInstrumentProvider,
    TsetmcRealLegalProvider,
    TsetmcHistoricalProvider,
    BrsApiProvider,
    {
      provide: MARKET_DATA_PROVIDERS,
      inject: [ConfigService, TsetmcMarketProvider, BrsApiProvider],
      useFactory: (
        configService: ConfigService,
        tsetmcProvider: TsetmcMarketProvider,
        brsApiProvider: BrsApiProvider,
      ): MarketDataProvider[] => {
        const providers: MarketDataProvider[] = [];
        if (configService.get<boolean>('providers.tsetmc.enabled')) {
          providers.push(tsetmcProvider);
        }
        if (configService.get<boolean>('providers.brsapi.enabled')) {
          providers.push(brsApiProvider as unknown as MarketDataProvider);
        }
        return providers;
      },
    },
  ],
  exports: [
    MARKET_DATA_PROVIDERS,
    TsetmcMarketProvider,
    TsetmcRealtimeProvider,
    TsetmcInstrumentProvider,
    TsetmcRealLegalProvider,
    TsetmcHistoricalProvider,
    BrsApiProvider,
  ],
})
export class ProvidersModule {}
