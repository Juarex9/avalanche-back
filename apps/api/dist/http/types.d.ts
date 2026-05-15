export interface TransferResponse {
    transferId: string;
    bank: string;
    beneficiary: string;
    amountWei: string;
    commitment: string;
    expiry: number;
    state: 'opened' | 'released' | 'refunded';
    openedBlock: number;
    openedTx: string;
    updatedAt: number;
}
//# sourceMappingURL=types.d.ts.map