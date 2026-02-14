/**
 * Decision Entity
 * Represents a court decision in the database
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type CourtLevel = 'federal' | 'cantonal';
export type Language = 'de' | 'fr' | 'it' | 'en';
export type Chamber = 'I' | 'II' | 'III' | 'IV' | 'V';

@Entity('decisions')
@Index(['courtLevel', 'canton'])
@Index(['decisionDate'])
@Index(['legalAreas'])
export class Decision {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  decisionId!: string;

  @Column({
    type: 'varchar',
    length: 10,
  })
  courtLevel!: CourtLevel;

  @Column({ nullable: true, length: 2 })
  canton?: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  summary!: string;

  @Column({ type: 'date' })
  @Index()
  decisionDate!: Date;

  @Column({
    type: 'varchar',
    length: 2,
  })
  language!: Language;

  @Column({ type: 'simple-array' })
  legalAreas!: string[];

  @Column({ type: 'text', nullable: true })
  fullText?: string;

  @Column({ type: 'simple-array', nullable: true })
  relatedDecisions?: string[];

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, unknown>;

  // Federal-specific fields
  @Column({
    type: 'varchar',
    length: 5,
    nullable: true,
  })
  chamber?: Chamber;

  @Column({ nullable: true })
  bgeReference?: string;

  // Source tracking
  @Column()
  sourceUrl!: string;

  @Column({ type: 'datetime' })
  lastFetchedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Search metadata
  @Column({ type: 'float', nullable: true })
  searchScore?: number;

  @Column({ type: 'simple-json', nullable: true })
  searchMetadata?: {
    tfidfScore?: number;
    bm25Score?: number;
    recencyBoost?: number;
  };
}
