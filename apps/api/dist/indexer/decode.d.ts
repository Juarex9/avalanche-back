import type { Log } from 'viem';
export type { TransferEvent, TransferReleasedEvent, TransferRefundedEvent } from './types.js';
export declare function isTransferOpenedEvent(log: Log): boolean;
export declare function isTransferReleasedEvent(log: Log): boolean;
export declare function isTransferRefundedEvent(log: Log): boolean;
export interface TransferOpenedDecoded {
    transferId: `0x${string}`;
    bank: `0x${string}`;
    beneficiary: `0x${string}`;
    amount: bigint;
    commitment: `0x${string}`;
    expiry: number;
    blockNumber: number;
    txHash: `0x${string}`;
}
export interface TransferReleasedDecoded {
    transferId: `0x${string}`;
    to: `0x${string}`;
    amount: bigint;
    blockNumber: number;
    txHash: `0x${string}`;
}
export interface TransferRefundedDecoded {
    transferId: `0x${string}`;
    to: `0x${string}`;
    amount: bigint;
    blockNumber: number;
    txHash: `0x${string}`;
}
export declare function decodeTransferOpened(log: Log): TransferOpenedDecoded;
export declare function decodeTransferReleased(log: Log): TransferReleasedDecoded;
export declare function decodeTransferRefunded(log: Log): TransferRefundedDecoded;
//# sourceMappingURL=decode.d.ts.map