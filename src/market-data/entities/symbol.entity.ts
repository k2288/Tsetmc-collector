import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'symbols' })
@Index(['instrumentId'], { unique: true })
@Index(['symbol'])
export class SymbolEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'instrument_id', type: 'varchar', length: 128 })
  instrumentId!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  symbol?: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  sector?: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  isin?: string;

  @Column({ type: 'numeric', precision: 24, scale: 6, nullable: true })
  eps?: string;

  @Column({ name: 'base_volume', type: 'bigint', nullable: true })
  baseVolume?: string;

  @Column({ name: 'total_shares', type: 'bigint', nullable: true })
  totalShares?: string;

  @Column({ name: 'raw_payload', type: 'jsonb', nullable: true })
  rawPayload?: unknown;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
