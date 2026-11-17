-- calc-db: encrypted, user-scoped calculation history snapshots.
-- Identity is owned by softm-hannun-account; user_id is an opaque account UID.
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS calc_history (
  user_id TEXT PRIMARY KEY,
  revision INTEGER NOT NULL CHECK(revision >= 1),
  iv TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_calc_history_updated_at
  ON calc_history(updated_at);
