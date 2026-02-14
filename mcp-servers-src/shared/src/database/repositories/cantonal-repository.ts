/**
 * Cantonal Decisions Repository
 * CRUD operations for cantonal court decisions from 26 Swiss cantons
 */

import { DatabaseClient } from '../client';

export interface CantonalDecision {
  id: string;
  canton: string; // 2-letter canton code (e.g., 'ZH', 'BE', 'GE')
  citation: string;
  court_name?: string;
  decision_number?: string;
  title?: string;
  date?: string;
  language: 'de' | 'fr' | 'it' | 'en';
  summary?: string;
  legal_areas?: string[]; // Stored as JSON in database
  full_text?: string;
  full_text_url?: string;
  created_at?: string;
  updated_at?: string;
}

export class CantonalRepository {
  constructor(private db: DatabaseClient) {}

  /**
   * Create a new cantonal decision
   */
  async create(decision: CantonalDecision): Promise<void> {
    // Validate canton code format (2 uppercase letters)
    if (!/^[A-Z]{2}$/.test(decision.canton)) {
      throw new Error(`Invalid canton code: ${decision.canton}. Must be 2 uppercase letters.`);
    }

    const sql = `
      INSERT INTO cantonal_decisions (
        id, canton, citation, court_name, decision_number, title, date, language,
        summary, legal_areas, full_text, full_text_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.query(sql, {
      values: [
        decision.id,
        decision.canton,
        decision.citation,
        decision.court_name || null,
        decision.decision_number || null,
        decision.title || null,
        decision.date || null,
        decision.language,
        decision.summary || null,
        decision.legal_areas ? JSON.stringify(decision.legal_areas) : null,
        decision.full_text || null,
        decision.full_text_url || null
      ]
    });
  }

  /**
   * Find a decision by citation
   */
  async findByCitation(citation: string): Promise<CantonalDecision | null> {
    const result = await this.db.queryOne<CantonalDecision>(
      `SELECT * FROM cantonal_decisions WHERE citation = ?`,
      { values: [citation] }
    );

    if (!result) return null;
    return this.parseDecision(result);
  }

  /**
   * Find decisions by canton
   */
  async findByCanton(canton: string): Promise<CantonalDecision[]> {
    const sql = `
      SELECT * FROM cantonal_decisions
      WHERE canton = ?
      ORDER BY date DESC
    `;

    const results = await this.db.query<CantonalDecision>(sql, {
      values: [canton]
    });

    return results.map(r => this.parseDecision(r));
  }

  /**
   * Find decisions by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<CantonalDecision[]> {
    const sql = `
      SELECT * FROM cantonal_decisions
      WHERE date >= ? AND date <= ?
      ORDER BY date DESC
    `;

    const results = await this.db.query<CantonalDecision>(sql, {
      values: [
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      ]
    });

    return results.map(r => this.parseDecision(r));
  }

  /**
   * Find decisions by language
   */
  async findByLanguage(language: 'de' | 'fr' | 'it' | 'en'): Promise<CantonalDecision[]> {
    const sql = `
      SELECT * FROM cantonal_decisions
      WHERE language = ?
      ORDER BY date DESC
    `;

    const results = await this.db.query<CantonalDecision>(sql, {
      values: [language]
    });

    return results.map(r => this.parseDecision(r));
  }

  /**
   * Search decisions by text
   */
  async search(query: string, canton?: string): Promise<CantonalDecision[]> {
    let sql = `
      SELECT * FROM cantonal_decisions
      WHERE (title LIKE ? OR summary LIKE ? OR full_text LIKE ?)
    `;

    const searchPattern = `%${query}%`;
    const values: unknown[] = [searchPattern, searchPattern, searchPattern];

    if (canton) {
      sql += ` AND canton = ?`;
      values.push(canton);
    }

    sql += ` ORDER BY date DESC LIMIT 50`;

    const results = await this.db.query<CantonalDecision>(sql, { values });
    return results.map(r => this.parseDecision(r));
  }

  /**
   * Update a decision
   */
  async update(id: string, updates: Partial<CantonalDecision>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.summary !== undefined) {
      fields.push('summary = ?');
      values.push(updates.summary);
    }
    if (updates.full_text !== undefined) {
      fields.push('full_text = ?');
      values.push(updates.full_text);
    }
    if (updates.legal_areas !== undefined) {
      fields.push('legal_areas = ?');
      values.push(JSON.stringify(updates.legal_areas));
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    const sql = `UPDATE cantonal_decisions SET ${fields.join(', ')} WHERE id = ?`;
    await this.db.query(sql, { values });
  }

  /**
   * Delete a decision
   */
  async delete(id: string): Promise<void> {
    await this.db.query(
      `DELETE FROM cantonal_decisions WHERE id = ?`,
      { values: [id] }
    );
  }

  /**
   * Get all decisions (with optional limit)
   */
  async findAll(limit: number = 100): Promise<CantonalDecision[]> {
    const sql = `
      SELECT * FROM cantonal_decisions
      ORDER BY date DESC
      LIMIT ?
    `;

    const results = await this.db.query<CantonalDecision>(sql, { values: [limit] });
    return results.map(r => this.parseDecision(r));
  }

  /**
   * Count decisions by canton
   */
  async countByCanton(canton: string): Promise<number> {
    const result = await this.db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM cantonal_decisions WHERE canton = ?`,
      { values: [canton] }
    );
    return result?.count || 0;
  }

  /**
   * Count total decisions
   */
  async count(): Promise<number> {
    const result = await this.db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM cantonal_decisions`
    );
    return result?.count || 0;
  }

  /**
   * Parse decision from database (convert JSON strings to objects)
   * Note: legal_areas is stored as JSON string in SQLite, needs parsing
   */
  private parseDecision(row: CantonalDecision): CantonalDecision {
    return {
      ...row,
      legal_areas: typeof row.legal_areas === 'string'
        ? JSON.parse(row.legal_areas) as string[]
        : row.legal_areas,
    };
  }
}
