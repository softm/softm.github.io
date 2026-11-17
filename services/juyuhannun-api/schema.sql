CREATE TABLE IF NOT EXISTS favorite_stations (
  user_id TEXT PRIMARY KEY,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  iv TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_favorite_stations_updated_at
  ON favorite_stations(updated_at);
