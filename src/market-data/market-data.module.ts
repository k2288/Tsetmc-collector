import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RetryService } from '../common/retry.service';
import { ProvidersModule } from '../providers/providers.module';
import { StorageModule } from '../storage/storage.module';
import { DailyPriceEntity } from './entities/daily-price.entity';
import { MarketSnapshotEntity } from './entities/market-snapshot.entity';
import { RawProviderPayloadEntity } from './entities/raw-provider-payload.entity';
import { RealLegalSnapshotEntity } from './entities/real-legal-snapshot.entity';
import { SymbolEntity } from './entities/symbol.entity';
import { MarketController } from './market.controller';
import { MarketDataNormalizer } from './normalizers/market-data-normalizer';
import { MarketDataCollectionService } from './services/market-data-collection.service';
import { MarketDataSchedulerService } from './services/market-data-scheduler.service';
import { ProviderHealthService } from './services/provider-health.service';
import { RawPayloadArchiveService } from './services/raw-payload-archive.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RawProviderPayloadEntity,
      MarketSnapshotEntity,
      SymbolEntity,
      RealLegalSnapshotEntity,
      DailyPriceEntity,
    ]),
    ProvidersModule,
    StorageModule,
  ],
  controllers: [MarketController],
  providers: [
    RetryService,
    MarketDataNormalizer,
    MarketDataCollectionService,
    MarketDataSchedulerService,
    ProviderHealthService,
    RawPayloadArchiveService,
  ],
  exports: [MarketDataCollectionService, ProviderHealthService],
})
export class MarketDataModule {}
