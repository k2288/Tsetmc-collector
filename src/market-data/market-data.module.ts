import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RetryService } from '../common/retry.service';
import { ProvidersModule } from '../providers/providers.module';
import { StorageModule } from '../storage/storage.module';
import { MarketSnapshotEntity } from './entities/market-snapshot.entity';
import { RawProviderPayloadEntity } from './entities/raw-provider-payload.entity';
import { MarketDataNormalizer } from './normalizers/market-data-normalizer';
import { MarketDataCollectionService } from './services/market-data-collection.service';
import { MarketDataSchedulerService } from './services/market-data-scheduler.service';
import { ProviderHealthService } from './services/provider-health.service';
import { RawPayloadArchiveService } from './services/raw-payload-archive.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RawProviderPayloadEntity, MarketSnapshotEntity]),
    ProvidersModule,
    StorageModule,
  ],
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
