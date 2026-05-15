CREATE TABLE IF NOT EXISTS transfers (
  transfer_id TEXT PRIMARY KEY,
  bank TEXT NOT NULL,
  beneficiary TEXT NOT NULL,
  amount_wei TEXT NOT NULL,
  commitment TEXT NOT NULL,
  expiry INTEGER NOT NULL,
  depositor TEXT,
  state TEXT NOT NULL DEFAULT 'opened',
  opened_block INTEGER NOT NULL,
  opened_tx TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS indexer_cursor (
  key TEXT PRIMARY KEY,
  last_block INTEGER NOT NULL
);