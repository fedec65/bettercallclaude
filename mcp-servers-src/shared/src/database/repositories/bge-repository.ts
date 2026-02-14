/**
 * BGE Decisions Repository
 * CRUD operations for Swiss Federal Supreme Court decisions
 */

import { DatabaseClient } from '../client';

export interface BGEDecision {
  id: string;
  citation: string;
  volume?: string;
  chamber?: string;
  page?: string;
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

export class BGERepository {
  constructor(private db: DatabaseClient) {}

  /**
   * Create a new BGE decision
   */
  async create(decision: BGEDecision): Promise<void> {
    const sql = `
      INSERT INTO bge_decisions (
        id, citation, volume, chamber, page, title, date, language,
        summary, legal_areas, full_text, full_text_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.query(sql, {
      values: [
        decision.id,
        decision.citation,
        decision.volume || null,
        decision.chamber || null,
        decision.page || null,
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
   * Find a decision by citation (e.g., "BGE 147 IV 73")
   */
  async findByCitation(citation: string): Promise<BGEDecision | null> {
    const result = await this.db.queryOne<BGEDecision>(
      `SELECT * FROM bge_decisions WHERE citation = ?`,
      { values: [citation] }
    );

    if (!result) return null;

    // Parse JSON fields
    return this.parseDecision(result);
  }

  /**
   * Find decisions by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<BGEDecision[]> {
    const sql = `
      SELECT * FROM bge_decisions
      WHERE date >= ? AND date <= ?
      ORDER BY date DESC
    `;

    const results = await this.db.query<BGEDecision>(sql, {
      values: [
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      ]
    });

    return results.map(r => this.parseDecision(r));
  }

  /**
   * Find decisions by chamber
   */
  async findByChamber(chamber: string): Promise<BGEDecision[]> {
    const sql = `
      SELECT * FROM bge_decisions
      WHERE chamber = ?
      ORDER BY date DESC
    `;

    const results = await this.db.query<BGEDecision>(sql, {
      values: [chamber]
    });

    return results.map(r => this.parseDecision(r));
  }

  /**
   * Find decisions by language
   */
  async findByLanguage(language: 'de' | 'fr' | 'it' | 'en'): Promise<BGEDecision[]> {
    const sql = `
      SELECT * FROM bge_decisions
      WHERE language = ?
      ORDER BY date DESC
    `;

    const results = await this.db.query<BGEDecision>(sql, {
      values: [language]
    });

    return results.map(r => this.parseDecision(r));
  }

  /**
   * Search decisions by text (title, summary, or full text)
   */
  async search(query: string): Promise<BGEDecision[]> {
    const sql = `
      SELECT * FROM bge_decisions
      WHERE title LIKE ? OR summary LIKE ? OR full_text LIKE ?
      ORDER BY date DESC
      LIMIT 50
    `;

    const searchPattern = `%${query}%`;
    const results = await this.db.query<BGEDecision>(sql, {
      values: [searchPattern, searchPattern, searchPattern]
    });

    return results.map(r => this.parseDecision(r));
  }

  /**
   * Update a decision
   */
  async update(id: string, updates: Partial<BGEDecision>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    // Build dynamic UPDATE query based on provided fields
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

    // Add updated_at timestamp
    fields.push("updated_at = datetime('now')");
    values.push(id);

    const sql = `UPDATE bge_decisions SET ${fields.join(', ')} WHERE id = ?`;
    await this.db.query(sql, { values });
  }

  /**
   * Delete a decision
   */
  async delete(id: string): Promise<void> {
    await this.db.query(
      `DELETE FROM bge_decisions WHERE id = ?`,
      { values: [id] }
    );
  }

  /**
   * Get all decisions (with optional limit)
   */
  async findAll(limit: number = 100): Promise<BGEDecision[]> {
    const sql = `
      SELECT * FROM bge_decisions
      ORDER BY date DESC
      LIMIT ?
    `;

    const results = await this.db.query<BGEDecision>(sql, {
      values: [limit]
    });

    return results.map(r => this.parseDecision(r));
  }

  /**
   * Count total decisions
   */
  async count(): Promise<number> {
    const result = await this.db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM bge_decisions`
    );
    return result?.count || 0;
  }

  /**
   * Parse decision from database (convert JSON strings to objects)
   * Note: legal_areas is stored as JSON string in SQLite, needs parsing
   */
  private parseDecision(row: BGEDecision): BGEDecision {
    return {
      ...row,
      legal_areas: typeof row.legal_areas === 'string'
        ? JSON.parse(row.legal_areas) as string[]
        : row.legal_areas,
    };
  }
}
