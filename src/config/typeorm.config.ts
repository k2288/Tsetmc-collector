import { DataSourceOptions } from 'typeorm';
import { RawPayload } from '../market-data/entities/raw-payload.entity';
import { NormalizedSnapshot } from '../market-data/entities/normalized-snapshot.entity';

export const typeOrmConfigFactory = (): DataSourceOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'tsetmc',
  password: process.env.DB_PASSWORD || 'tsetmc',
  database: process.env.DB_NAME || 'tsetmc_collector',
  entities: [RawPayload, NormalizedSnapshot],
  synchronize: false,
  logging: false
});
