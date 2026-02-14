-- Schema for Swiss Legal Database (SQLite)
-- Version: 1.0.0

-- Schema migrations tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    description TEXT,
    applied_at TEXT DEFAULT (datetime('now'))
);

-- BGE (Federal Supreme Court) Decisions
CREATE TABLE IF NOT EXISTS bge_decisions (
    id TEXT PRIMARY KEY,
    citation TEXT UNIQUE NOT NULL,
    volume TEXT,
    chamber TEXT,
    page TEXT,
    title TEXT,
    date TEXT,
    language TEXT CHECK(language IN ('de', 'fr', 'it', 'en')),
    summary TEXT,
    legal_areas TEXT, -- JSON array stored as TEXT
    full_text TEXT,
    full_text_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Index for common BGE queries
CREATE INDEX IF NOT EXISTS idx_bge_citation ON bge_decisions(citation);
CREATE INDEX IF NOT EXISTS idx_bge_date ON bge_decisions(date);
CREATE INDEX IF NOT EXISTS idx_bge_chamber ON bge_decisions(chamber);
CREATE INDEX IF NOT EXISTS idx_bge_language ON bge_decisions(language);

-- Cantonal Court Decisions
CREATE TABLE IF NOT EXISTS cantonal_decisions (
    id TEXT PRIMARY KEY,
    canton TEXT NOT NULL CHECK(length(canton) = 2),
    citation TEXT UNIQUE NOT NULL,
    court_name TEXT,
    decision_number TEXT,
    title TEXT,
    date TEXT,
    language TEXT CHECK(language IN ('de', 'fr', 'it', 'en')),
    summary TEXT,
    legal_areas TEXT, -- JSON array stored as TEXT
    full_text TEXT,
    full_text_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Index for common cantonal queries
CREATE INDEX IF NOT EXISTS idx_cantonal_citation ON cantonal_decisions(citation);
CREATE INDEX IF NOT EXISTS idx_cantonal_canton ON cantonal_decisions(canton);
CREATE INDEX IF NOT EXISTS idx_cantonal_date ON cantonal_decisions(date);
CREATE INDEX IF NOT EXISTS idx_cantonal_language ON cantonal_decisions(language);

-- API Cache for external service responses
CREATE TABLE IF NOT EXISTS api_cache (
    id TEXT PRIMARY KEY,
    cache_key TEXT UNIQUE NOT NULL,
    cache_type TEXT,
    data TEXT NOT NULL, -- JSON stored as TEXT
    expires_at TEXT NOT NULL,
    hit_count INTEGER DEFAULT 0,
    last_accessed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Index for cache lookups
CREATE INDEX IF NOT EXISTS idx_cache_key ON api_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_type ON api_cache(cache_type);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON api_cache(expires_at);

-- Search Query Logging for analytics
CREATE TABLE IF NOT EXISTS search_queries (
    id TEXT PRIMARY KEY,
    query_text TEXT NOT NULL,
    query_type TEXT,
    filters TEXT, -- JSON stored as TEXT
    result_count INTEGER,
    execution_time_ms INTEGER,
    user_id TEXT,
    timestamp TEXT DEFAULT (datetime('now'))
);

-- Index for search analytics
CREATE INDEX IF NOT EXISTS idx_search_timestamp ON search_queries(timestamp);
CREATE INDEX IF NOT EXISTS idx_search_type ON search_queries(query_type);

-- Insert initial migration record
INSERT OR IGNORE INTO schema_migrations (version, description)
VALUES ('1.0.0', 'Initial schema with BGE decisions, cantonal decisions, cache, and search queries');
