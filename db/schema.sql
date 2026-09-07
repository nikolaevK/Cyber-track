-- Spot (panel) state for Brand my garage. One row per panel that has ever been held or sold;
-- panels with no row are available. Keys are "<carId>:<spotId>", e.g. "gt3:mirrors".
--
-- Applied automatically on first use (CREATE IF NOT EXISTS) and by `npm run db:migrate`.
-- SQLite / Turso (libSQL). Timestamps are ISO 8601 UTC strings so they compare lexically.

CREATE TABLE IF NOT EXISTS spot_states (
  spot_id       TEXT PRIMARY KEY,
  status        TEXT NOT NULL DEFAULT 'available'
                CHECK (status IN ('available', 'pending', 'sold')),
  sponsor_name  TEXT,
  sponsor_url   TEXT,
  logo_data_url TEXT,
  contact_email TEXT,
  hold_id       TEXT UNIQUE,
  pending_until TEXT,
  paid_at       TEXT,
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Success page and webhook look rows up by hold, which the UNIQUE constraint already indexes.
CREATE INDEX IF NOT EXISTS spot_states_status_idx ON spot_states (status);
