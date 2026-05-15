import type { Database } from './sqlite.js';
export interface TransferRow {
    transfer_id: string;
    bank: string;
    beneficiary: string;
    amount_wei: string;
    commitment: string;
    expiry: number;
    depositor: string | null;
    state: string;
    opened_block: number;
    opened_tx: string;
    updated_at: number;
}
interface TransferEvent {
    transferId: string;
    bank: string;
    beneficiary: string;
    amount: bigint;
    commitment: string;
    expiry: number;
    openedBlock: number;
    openedTx: string;
}
export declare function upsertTransfer(db: Database, event: TransferEvent): void;
export declare function updateTransferState(db: Database, transferId: string, state: string): void;
interface TransferFilters {
    bank?: string;
    beneficiary?: string;
    state?: string;
    from?: number;
    to?: number;
    limit?: number;
    cursor?: number;
}
export declare function getTransfers(db: Database, filters?: TransferFilters): TransferRow[];
export declare function getTransferById(db: Database, id: string): TransferRow | null;
export {};
//# sourceMappingURL=repo.d.ts.map