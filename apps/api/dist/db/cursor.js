export function getCursor(db, key) {
    const stmt = db.prepare('SELECT last_block FROM indexer_cursor WHERE key = ?');
    stmt.bind([key]);
    if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row.last_block;
    }
    stmt.free();
    return 0;
}
export function setCursor(db, key, block) {
    db.run('INSERT OR REPLACE INTO indexer_cursor (key, last_block) VALUES (?, ?)', [key, block]);
}
//# sourceMappingURL=cursor.js.map