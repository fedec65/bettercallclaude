/**
 * CacheEntry Entity
 * Represents cached API responses and search results
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('cache_entries')
@Index(['key'], { unique: true })
@Index(['expiresAt'])
export class CacheEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  key!: string;

  @Column({ type: 'text' })
  value!: string;

  @Column({ type: 'datetime' })
  @Index()
  expiresAt!: Date;

  @Column({ type: 'integer', default: 0 })
  hitCount!: number;

  @Column({ type: 'datetime', nullable: true })
  lastAccessedAt?: Date;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: {
    source?: string;
    type?: 'api_response' | 'search_result' | 'decision_data';
    size?: number;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Check if cache entry is expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Increment hit count and update last accessed time
   */
  recordHit(): void {
    this.hitCount++;
    this.lastAccessedAt = new Date();
  }
}
