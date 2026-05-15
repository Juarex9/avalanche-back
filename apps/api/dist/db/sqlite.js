/**
 * SQLite adapter using sql.js (WASM, no native compilation).
 * Exposes the same sync-looking API as better-sqlite3 for our repo layer.
 */
import initSqlJs from 'sql.js';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
let _db = null;
let _dbPath = null;
export async function openDatabase(path) {
    if (_db && _dbPath === path)
        return _db;
    const SQL = await initSqlJs();
    // Load existing file if it exists
    let data;
    try {
        data = readFileSync(path);
    }
    catch {
        // File doesn't exist yet — start fresh
    }
    _db = data ? new SQL.Database(data) : new SQL.Database();
    _dbPath = path;
    return _db;
}
export function closeDatabase(db, path) {
    // Persist to disk
    const dir = path.replace(/\/[^/]+$/, '');
    if (dir)
        mkdirSync(dir, { recursive: true });
    writeFileSync(path, db.export());
}
export function runQuery(db, sql, ...params) {
    db.run(sql, params);
}
export function getOne(db, sql, ...params) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
    }
    stmt.free();
    return undefined;
}
export function getAll(db, sql, ...params) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}
//# sourceMappingURL=sqlite.js.map