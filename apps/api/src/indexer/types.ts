export interface TransferEvent {
  transferId: `0x${string}`;
  bank: `0x${string}`;
  beneficiary: `0x${string}`;
  amount: bigint;
  commitment: `0x${string}`;
  expiry: number;
  blockNumber: number;
  txHash: `0x${string}`;
}

export interface TransferReleasedEvent {
  transferId: `0x${string}`;
  to: `0x${string}`;
  amount: bigint;
  blockNumber: number;
  txHash: `0x${string}`;
}

export interface TransferRefundedEvent {
  transferId: `0x${string}`;
  to: `0x${string}`;
  amount: bigint;
  blockNumber: number;
  txHash: `0x${string}`;
}