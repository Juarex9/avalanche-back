export function upsertTransfer(db, event) {
    db.run(`
    INSERT INTO transfers (transfer_id, bank, beneficiary, amount_wei, commitment, expiry, state, opened_block, opened_tx, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'opened', ?, ?, ?)
    ON CONFLICT(transfer_id) DO UPDATE SET
      state = excluded.state,
      updated_at = excluded.updated_at
  `, [
        event.transferId,
        event.bank,
        event.beneficiary,
        event.amount.toString(),
        event.commitment,
        event.expiry,
        event.openedBlock,
        event.openedTx,
        Math.floor(Date.now() / 1000),
    ]);
}
export function updateTransferState(db, transferId, state) {
    db.run(`
    UPDATE transfers SET state = ?, updated_at = ? WHERE transfer_id = ?
  `, [state, Math.floor(Date.now() / 1000), transferId]);
}
export function getTransfers(db, filters = {}) {
    const conditions = [];
    const params = [];
    if (filters.bank) {
        conditions.push('bank = ?');
        params.push(filters.bank);
    }
    if (filters.beneficiary) {
        conditions.push('beneficiary = ?');
        params.push(filters.beneficiary);
    }
    if (filters.state) {
        conditions.push('state = ?');
        params.push(filters.state);
    }
    if (filters.from) {
        conditions.push('opened_block >= ?');
        params.push(filters.from);
    }
    if (filters.to) {
        conditions.push('opened_block <= ?');
        params.push(filters.to);
    }
    if (filters.cursor) {
        conditions.push('opened_block > ?');
        params.push(filters.cursor);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit ?? 50;
    const sql = `SELECT * FROM transfers ${where} ORDER BY opened_block LIMIT ?`;
    const allParams = [...params, limit];
    const stmt = db.prepare(sql);
    stmt.bind(allParams);
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}
export function getTransferById(db, id) {
    const stmt = db.prepare('SELECT * FROM transfers WHERE transfer_id = ?');
    stmt.bind([id]);
    if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
    }
    stmt.free();
    return null;
}
//# sourceMappingURL=repo.js.map