import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfigFactory } from './config/typeorm.config';
import { RawPayload } from './market-data/entities/raw-payload.entity';
import { NormalizedSnapshot } from './market-data/entities/normalized-snapshot.entity';
import { MarketDataCollectorService } from './market-data/services/market-data-collector.service';
import { ArchiveService } from './storage/archive.service';
import { HealthService } from './market-data/services/health.service';
import { RetryService } from './common/retry.service';
import { TsetmcProvider } from './providers/tsetmc/tsetmc.provider';
import { BrsApiProvider } from './providers/brsapi/brsapi.provider';
import { SnapshotNormalizer } from './market-data/normalizers/snapshot.normalizer';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({ useFactory: typeOrmConfigFactory }),
    TypeOrmModule.forFeature([RawPayload, NormalizedSnapshot])
  ],
  providers: [
    MarketDataCollectorService,
    ArchiveService,
    HealthService,
    RetryService,
    SnapshotNormalizer,
    TsetmcProvider,
    BrsApiProvider
  ]
})
export class AppModule {}
