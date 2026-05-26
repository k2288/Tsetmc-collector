import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { RawPayload } from './raw-payload.entity';

@Entity({ name: 'normalized_snapshots' })
@Index(['provider', 'snapshotTimeUtc'])
@Unique(['deduplicationKey'])
export class NormalizedSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  provider!: string;

  @Column({ type: 'varchar', length: 64 })
  symbol!: string;

  @Column({ type: 'numeric', precision: 18, scale: 4 })
  lastPrice!: string;

  @Column({ type: 'bigint' })
  volume!: string;

  @Column({ type: 'integer' })
  tradeCount!: number;

  @Column({ type: 'timestamptz' })
  snapshotTimeUtc!: Date;

  @Column({ type: 'varchar', length: 255 })
  deduplicationKey!: string;

  @ManyToOne(() => RawPayload, (raw) => raw.snapshots, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'raw_payload_id' })
  rawPayload!: RawPayload;
}
