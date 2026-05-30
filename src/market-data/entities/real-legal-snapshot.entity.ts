import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'real_legal_snapshots' })
@Index(['instrumentId', 'capturedAt'])
export class RealLegalSnapshotEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'instrument_id', type: 'varchar', length: 128 })
  instrumentId!: string;

  @Column({ name: 'real_buy_count', type: 'integer', nullable: true })
  realBuyCount?: number;

  @Column({ name: 'legal_buy_count', type: 'integer', nullable: true })
  legalBuyCount?: number;

  @Column({ name: 'real_sell_count', type: 'integer', nullable: true })
  realSellCount?: number;

  @Column({ name: 'legal_sell_count', type: 'integer', nullable: true })
  legalSellCount?: number;

  @Column({ name: 'real_buy_volume', type: 'bigint', nullable: true })
  realBuyVolume?: string;

  @Column({ name: 'legal_buy_volume', type: 'bigint', nullable: true })
  legalBuyVolume?: string;

  @Column({ name: 'real_sell_volume', type: 'bigint', nullable: true })
  realSellVolume?: string;

  @Column({ name: 'legal_sell_volume', type: 'bigint', nullable: true })
  legalSellVolume?: string;

  @Column({ name: 'raw_payload', type: 'jsonb', nullable: true })
  rawPayload?: unknown;

  @Column({ name: 'captured_at', type: 'timestamptz' })
  capturedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
