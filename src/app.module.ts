import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import appConfig from './config/app.config';
import { PrismaService } from './db/prisma.service';
import { PinoLoggerService } from './logging/logger.service';
import { TseClientProvider } from './providers/tse-client.provider';
import { CollectorService } from './collector/collector.service';
import { StorageService } from './storage/storage.service';
import { NormalizerService } from './normalizer/normalizer.service';
import { DeduplicationService } from './deduplication/deduplication.service';
import { MetricsService } from './metrics/metrics.service';
import { HealthController } from './health/health.controller';
import { ValidationEngineService } from './integrity/validation-engine.service';
import { CorporateActionService } from './integrity/corporate-action.service';
import { LifecycleEngineService } from './integrity/lifecycle-engine.service';
import { CanonicalTimelineService } from './integrity/canonical-timeline.service';
import { ReprocessingService } from './reprocessing/reprocessing.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }), ScheduleModule.forRoot()],
  controllers: [HealthController],
  providers: [
    PrismaService,
    PinoLoggerService,
    TseClientProvider,
    CollectorService,
    StorageService,
    NormalizerService,
    DeduplicationService,
    MetricsService,
    ValidationEngineService,
    CorporateActionService,
    LifecycleEngineService,
    CanonicalTimelineService,
    ReprocessingService
  ]
})
export class AppModule {}
