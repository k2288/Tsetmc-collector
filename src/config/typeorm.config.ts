import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { MarketSnapshotEntity } from '../market-data/entities/market-snapshot.entity';
import { RawProviderPayloadEntity } from '../market-data/entities/raw-provider-payload.entity';

export const createTypeOrmOptions = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('database.host'),
  port: configService.get<number>('database.port'),
  username: configService.get<string>('database.username'),
  password: configService.get<string>('database.password'),
  database: configService.get<string>('database.database'),
  entities: [RawProviderPayloadEntity, MarketSnapshotEntity],
  synchronize: configService.get<boolean>('database.synchronize'),
  logging: configService.get<boolean>('database.logging'),
  migrations: ['dist/migrations/*.js'],
});
