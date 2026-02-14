/**
 * Initial Database Schema Migration
 * Creates tables for decisions, citations, and cache entries
 */

import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create decisions table
    await queryRunner.createTable(
      new Table({
        name: 'decisions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'decisionId',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'courtLevel',
            type: 'enum',
            enum: ['federal', 'cantonal'],
            isNullable: false,
          },
          {
            name: 'canton',
            type: 'varchar',
            length: '2',
            isNullable: true,
          },
          {
            name: 'title',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'summary',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'decisionDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'language',
            type: 'enum',
            enum: ['de', 'fr', 'it', 'en'],
            isNullable: false,
          },
          {
            name: 'legalAreas',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'fullText',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'relatedDecisions',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'chamber',
            type: 'enum',
            enum: ['I', 'II', 'III', 'IV', 'V'],
            isNullable: true,
          },
          {
            name: 'bgeReference',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'sourceUrl',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'lastFetchedAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'searchScore',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'searchMetadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create indexes for decisions table
    await queryRunner.createIndex(
      'decisions',
      new TableIndex({
        name: 'IDX_decisions_decisionId',
        columnNames: ['decisionId'],
      })
    );

    await queryRunner.createIndex(
      'decisions',
      new TableIndex({
        name: 'IDX_decisions_courtLevel_canton',
        columnNames: ['courtLevel', 'canton'],
      })
    );

    await queryRunner.createIndex(
      'decisions',
      new TableIndex({
        name: 'IDX_decisions_decisionDate',
        columnNames: ['decisionDate'],
      })
    );

    // Create citations table
    await queryRunner.createTable(
      new Table({
        name: 'citations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'citingDecisionId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'citedDecisionId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'citationType',
            type: 'enum',
            enum: ['reference', 'precedent', 'overruled', 'distinguished', 'applied'],
            default: "'reference'",
            isNullable: false,
          },
          {
            name: 'context',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'pageNumber',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create indexes for citations table
    await queryRunner.createIndex(
      'citations',
      new TableIndex({
        name: 'IDX_citations_citingDecisionId',
        columnNames: ['citingDecisionId'],
      })
    );

    await queryRunner.createIndex(
      'citations',
      new TableIndex({
        name: 'IDX_citations_citedDecisionId',
        columnNames: ['citedDecisionId'],
      })
    );

    await queryRunner.createIndex(
      'citations',
      new TableIndex({
        name: 'IDX_citations_unique_pair',
        columnNames: ['citingDecisionId', 'citedDecisionId'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'citations',
      new TableIndex({
        name: 'IDX_citations_citationType',
        columnNames: ['citationType'],
      })
    );

    // Create foreign keys for citations table
    await queryRunner.createForeignKey(
      'citations',
      new TableForeignKey({
        columnNames: ['citingDecisionId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'decisions',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'citations',
      new TableForeignKey({
        columnNames: ['citedDecisionId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'decisions',
        onDelete: 'CASCADE',
      })
    );

    // Create cache_entries table
    await queryRunner.createTable(
      new Table({
        name: 'cache_entries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'key',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'value',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'hitCount',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'lastAccessedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create indexes for cache_entries table
    await queryRunner.createIndex(
      'cache_entries',
      new TableIndex({
        name: 'IDX_cache_entries_key',
        columnNames: ['key'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'cache_entries',
      new TableIndex({
        name: 'IDX_cache_entries_expiresAt',
        columnNames: ['expiresAt'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('cache_entries');
    await queryRunner.dropTable('citations');
    await queryRunner.dropTable('decisions');
  }
}
