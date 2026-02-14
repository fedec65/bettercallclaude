/**
 * Citation Entity
 * Represents citations between court decisions
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Decision } from './Decision';

export type CitationType = 'reference' | 'precedent' | 'overruled' | 'distinguished' | 'applied';

@Entity('citations')
@Index(['citingDecisionId', 'citedDecisionId'], { unique: true })
@Index(['citationType'])
export class Citation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  citingDecisionId!: string;

  @Column('uuid')
  @Index()
  citedDecisionId!: string;

  @ManyToOne(() => Decision, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'citingDecisionId' })
  citingDecision!: Decision;

  @ManyToOne(() => Decision, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'citedDecisionId' })
  citedDecision!: Decision;

  @Column({
    type: 'enum',
    enum: ['reference', 'precedent', 'overruled', 'distinguished', 'applied'],
    default: 'reference',
  })
  citationType!: CitationType;

  @Column({ type: 'text', nullable: true })
  context?: string;

  @Column({ type: 'integer', nullable: true })
  pageNumber?: number;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;
}
