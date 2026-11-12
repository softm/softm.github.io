-- gagyebu-db: independent ledger database; identity is owned by softm-hannun-account.
-- user_id is an opaque Cloudflare account UID, not a local user row.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS gagyebu_ledger_heads (
 user_id TEXT PRIMARY KEY,
 revision TEXT NOT NULL,
 iv TEXT NOT NULL,
 chunk_count INTEGER NOT NULL CHECK(chunk_count BETWEEN 1 AND 40),
 updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS gagyebu_ledger_chunks (
 user_id TEXT NOT NULL,
 revision TEXT NOT NULL,
 part INTEGER NOT NULL,
 data TEXT NOT NULL,
 PRIMARY KEY(user_id,revision,part)
);
CREATE INDEX IF NOT EXISTS idx_gagyebu_chunks_user ON gagyebu_ledger_chunks(user_id);
CREATE TABLE IF NOT EXISTS gagyebu_ledger_versions (
 user_id TEXT NOT NULL,
 revision TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 PRIMARY KEY(user_id,revision)
);
CREATE INDEX IF NOT EXISTS idx_gagyebu_versions_old ON gagyebu_ledger_versions(created_at);
