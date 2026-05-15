/**
 * SQLite adapter using sql.js (WASM, no native compilation).
 * Exposes the same sync-looking API as better-sqlite3 for our repo layer.
 */
import { Database as SqlJsDatabase } from 'sql.js';
export type Database = SqlJsDatabase;
export declare function openDatabase(path: string): Promise<SqlJsDatabase>;
export declare function closeDatabase(db: SqlJsDatabase, path: string): void;
export declare function runQuery(db: SqlJsDatabase, sql: string, ...params: unknown[]): void;
export declare function getOne<T>(db: SqlJsDatabase, sql: string, ...params: unknown[]): T | undefined;
export declare function getAll<T>(db: SqlJsDatabase, sql: string, ...params: unknown[]): T[];
//# sourceMappingURL=sqlite.d.ts.map