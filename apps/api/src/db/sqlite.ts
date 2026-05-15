/**
 * SQLite adapter using sql.js (WASM, no native compilation).
 * Exposes the same sync-looking API as better-sqlite3 for our repo layer.
 */
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';

let _db: SqlJsDatabase | null = null;
let _dbPath: string | null = null;

export type Database = SqlJsDatabase;

export async function openDatabase(path: string): Promise<SqlJsDatabase> {
  if (_db && _dbPath === path) return _db;

  const SQL = await initSqlJs();

  // Load existing file if it exists
  let data: Uint8Array | undefined;
  try {
    data = readFileSync(path);
  } catch {
    // File doesn't exist yet — start fresh
  }

  _db = data ? new SQL.Database(data) : new SQL.Database();
  _dbPath = path;
  return _db;
}

export function closeDatabase(db: SqlJsDatabase, path: string): void {
  // Persist to disk
  const dir = path.replace(/\/[^/]+$/, '');
  if (dir) mkdirSync(dir, { recursive: true });
  writeFileSync(path, db.export());
}

export function runQuery(db: SqlJsDatabase, sql: string, ...params: unknown[]): void {
  db.run(sql, params as unknown[]);
}

export function getOne<T>(db: SqlJsDatabase, sql: string, ...params: unknown[]): T | undefined {
  const stmt = db.prepare(sql);
  stmt.bind(params as unknown[]);
  if (stmt.step()) {
    const row = stmt.getAsObject() as T;
    stmt.free();
    return row;
  }
  stmt.free();
  return undefined;
}

export function getAll<T>(db: SqlJsDatabase, sql: string, ...params: unknown[]): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params as unknown[]);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}