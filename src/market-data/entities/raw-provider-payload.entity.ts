import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { MarketSnapshotEntity } from './market-snapshot.entity';

@Entity({ name: 'raw_provider_payloads' })
@Index(['providerName', 'capturedAt'])
@Index(['contentHash'])
export class RawProviderPayloadEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'provider_name', type: 'varchar', length: 64 })
  providerName!: string;

  @Column({ name: 'captured_at', type: 'timestamptz' })
  capturedAt!: Date;

  @Column({ name: 'archive_path', type: 'text' })
  archivePath!: string;

  @Column({ name: 'content_hash', type: 'varchar', length: 64 })
  contentHash!: string;

  @Column({ type: 'jsonb' })
  payload!: unknown;

  @Column({ name: 'response_metadata', type: 'jsonb', nullable: true })
  responseMetadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => MarketSnapshotEntity, (snapshot) => snapshot.rawPayload)
  snapshots!: MarketSnapshotEntity[];
}
