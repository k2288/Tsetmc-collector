import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm';
import { NormalizedSnapshot } from './normalized-snapshot.entity';

@Entity({ name: 'raw_payloads' })
@Index(['provider', 'receivedAt'])
export class RawPayload {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  provider!: string;

  @Column({ type: 'timestamptz' })
  receivedAt!: Date;

  @Column({ type: 'text' })
  filesystemPath!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => NormalizedSnapshot, (snapshot) => snapshot.rawPayload)
  snapshots!: NormalizedSnapshot[];
}
