import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'daily_prices' })
@Index(['instrumentId', 'date'], { unique: true })
export class DailyPriceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'instrument_id', type: 'varchar', length: 128 })
  instrumentId!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'numeric', precision: 24, scale: 6, nullable: true })
  open?: string;

  @Column({ type: 'numeric', precision: 24, scale: 6, nullable: true })
  high?: string;

  @Column({ type: 'numeric', precision: 24, scale: 6, nullable: true })
  low?: string;

  @Column({ type: 'numeric', precision: 24, scale: 6, nullable: true })
  close?: string;

  @Column({ type: 'bigint', nullable: true })
  volume?: string;

  @Column({ type: 'numeric', precision: 30, scale: 2, nullable: true })
  value?: string;

  @Column({ type: 'integer', nullable: true })
  count?: number;

  @Column({ name: 'adjusted_close', type: 'numeric', precision: 24, scale: 6, nullable: true })
  adjustedClose?: string;

  @Column({ name: 'raw_payload', type: 'jsonb', nullable: true })
  rawPayload?: unknown;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
