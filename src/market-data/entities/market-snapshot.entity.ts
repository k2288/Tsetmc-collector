import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { RawProviderPayloadEntity } from './raw-provider-payload.entity';

@Entity({ name: 'market_snapshots' })
@Index(['providerName', 'sourceTimestamp'])
@Index(['symbol', 'sourceTimestamp'])
@Index(['dedupeKey'], { unique: true })
export class MarketSnapshotEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'provider_name', type: 'varchar', length: 64 })
  providerName!: string;

  @Column({ type: 'varchar', length: 64 })
  symbol!: string;

  @Column({
    name: 'instrument_id',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  instrumentId?: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  isin?: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  name?: string;

  @Column({
    name: 'last_price',
    type: 'numeric',
    precision: 24,
    scale: 6,
    nullable: true,
  })
  lastPrice?: string;

  @Column({
    name: 'closing_price',
    type: 'numeric',
    precision: 24,
    scale: 6,
    nullable: true,
  })
  closingPrice?: string;

  @Column({
    name: 'opening_price',
    type: 'numeric',
    precision: 24,
    scale: 6,
    nullable: true,
  })
  openingPrice?: string;

  @Column({
    name: 'high_price',
    type: 'numeric',
    precision: 24,
    scale: 6,
    nullable: true,
  })
  highPrice?: string;

  @Column({
    name: 'low_price',
    type: 'numeric',
    precision: 24,
    scale: 6,
    nullable: true,
  })
  lowPrice?: string;

  @Column({ name: 'trade_volume', type: 'bigint', nullable: true })
  tradeVolume?: string;

  @Column({
    name: 'trade_value',
    type: 'numeric',
    precision: 30,
    scale: 2,
    nullable: true,
  })
  tradeValue?: string;

  @Column({ name: 'trade_count', type: 'integer', nullable: true })
  tradeCount?: number;

  @Column({ name: 'source_timestamp', type: 'timestamptz' })
  sourceTimestamp!: Date;

  @Column({ name: 'captured_at', type: 'timestamptz' })
  capturedAt!: Date;

  @Column({ name: 'trading_date', type: 'date', nullable: true })
  tradingDate?: string;

  @Column({ name: 'dedupe_key', type: 'varchar', length: 256 })
  dedupeKey!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'raw_payload', type: 'jsonb', nullable: true })
  rawPayloadData?: unknown;

  @ManyToOne(
    () => RawProviderPayloadEntity,
    (rawPayload) => rawPayload.snapshots,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'raw_payload_id' })
  rawPayload?: RawProviderPayloadEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
