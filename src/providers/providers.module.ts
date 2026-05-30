import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { BrsApiProvider } from './brsapi/brsapi.provider';
import {
  MARKET_DATA_PROVIDERS,
  MarketDataProvider,
} from './market-data-provider.interface';
import { TsetmcProvider } from './tsetmc/tsetmc.provider';

@Module({
  providers: [
    TsetmcProvider,
    BrsApiProvider,
    {
      provide: MARKET_DATA_PROVIDERS,
      inject: [ConfigService, TsetmcProvider, BrsApiProvider],
      useFactory: (
        configService: ConfigService,
        tsetmcProvider: TsetmcProvider,
        brsApiProvider: BrsApiProvider,
      ): MarketDataProvider[] => {
        const providers: MarketDataProvider[] = [];
        if (configService.get<boolean>('providers.tsetmc.enabled')) {
          providers.push(tsetmcProvider);
        }
        if (configService.get<boolean>('providers.brsapi.enabled')) {
          providers.push(brsApiProvider);
        }
        return providers;
      },
    },
  ],
  exports: [MARKET_DATA_PROVIDERS, TsetmcProvider, BrsApiProvider],
})
export class ProvidersModule {}
