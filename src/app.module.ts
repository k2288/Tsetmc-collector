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
    MetricsService
  ]
})
export class AppModule {}
