import type { Database } from './sqlite.js';

export function getCursor(db: Database, key: string): number {
  const stmt = db.prepare('SELECT last_block FROM indexer_cursor WHERE key = ?');
  stmt.bind([key] as any[]);
  if (stmt.step()) {
    const row = stmt.getAsObject() as { last_block: number };
    stmt.free();
    return row.last_block;
  }
  stmt.free();
  return 0;
}

export function setCursor(db: Database, key: string, block: number): void {
  db.run('INSERT OR REPLACE INTO indexer_cursor (key, last_block) VALUES (?, ?)', [key, block]);
}