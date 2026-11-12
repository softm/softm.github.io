PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  consent_version TEXT,
  consent_at INTEGER,
  created_at INTEGER NOT NULL,
  disabled_at INTEGER
);
CREATE TABLE IF NOT EXISTS identities (
  subject_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK(provider IN ('google','kakao','naver')),
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_identities_user ON identities(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_identities_user_provider ON identities(user_id, provider);
CREATE TABLE IF NOT EXISTS web_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  authenticated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_web_sessions_exp ON web_sessions(expires_at);
CREATE TABLE IF NOT EXISTS oauth_attempts (
  state_hash TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  mode TEXT NOT NULL,
  link_uid TEXT,
  nonce TEXT NOT NULL,
  verifier TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS connect_intents (
  token_hash TEXT PRIMARY KEY,
  site TEXT NOT NULL,
  origin TEXT NOT NULL,
  challenge TEXT NOT NULL,
  request_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS auth_codes (
  code_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site TEXT NOT NULL,
  origin TEXT NOT NULL,
  challenge TEXT NOT NULL,
  request_id TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS app_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_app_sessions_exp ON app_sessions(expires_at);
CREATE TABLE IF NOT EXISTS items (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site TEXT NOT NULL,
  item_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(user_id, site, item_id)
);
CREATE INDEX IF NOT EXISTS ix_items_site ON items(user_id,site,updated_at);

-- Short-lived hashed rate buckets. Raw IP addresses are never stored.
CREATE TABLE IF NOT EXISTS request_buckets (
  bucket_hash TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_request_buckets_exp ON request_buckets(expires_at);

-- Gagyebu encrypted, versioned snapshots; no raw receipts or SMS text.
CREATE TABLE IF NOT EXISTS gagyebu_ledger_heads (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  revision TEXT NOT NULL,
  iv TEXT NOT NULL,
  chunk_count INTEGER NOT NULL CHECK(chunk_count BETWEEN 1 AND 40),
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS gagyebu_ledger_chunks (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  revision TEXT NOT NULL,
  part INTEGER NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY(user_id,revision,part)
);
CREATE INDEX IF NOT EXISTS idx_gagyebu_chunks_user ON gagyebu_ledger_chunks(user_id);
CREATE TABLE IF NOT EXISTS gagyebu_ledger_versions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  revision TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(user_id,revision)
);
CREATE INDEX IF NOT EXISTS idx_gagyebu_versions_old ON gagyebu_ledger_versions(created_at);

