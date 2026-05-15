import { describe, it, expect, vi } from 'vitest';
import { decodeTransferOpened, decodeTransferReleased, decodeTransferRefunded } from './decode.js';
import type { Log } from 'viem';

describe('decodeTransferOpened', () => {
  it('should decode valid TransferOpened log', () => {
    const mockLog: Log = {
      topics: [
        '0x1234567890123456789012345678901234567890123456789012345678901234', // eventSig
        '0x0000000000000000000000000000000000000000000000000000000000000001', // transferId
        '0x0000000000000000000000001234567890123456789012345678901234567890', // bank
        '0x000000000000000000000000bd1e2b220c41bcb724e61459ca401c552028106e', // beneficiary
      ],
      data: '0x' + '0'.repeat(64) + 'a'.repeat(64) + '0'.repeat(64),
      address: '0x08034625696dC863AD00c2920216055236763Cbb',
      blockNumber: 12345678n,
      transactionHash: '0xabcdef',
    } as unknown as Log;

    const result = decodeTransferOpened(mockLog);

    expect(result.transferId).toBe(mockLog.topics[1]);
    expect(result.bank).toBe('0x1234567890123456789012345678901234567890');
    expect(result.beneficiary).toBe('0xbd1e2b220c41bcb724e61459ca401c552028106e');
  });
});

describe('decodeTransferReleased', () => {
  it('should decode TransferReleased log', () => {
    const mockLog: Log = {
      topics: [
        '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd', // eventSig
        '0x0000000000000000000000000000000000000000000000000000000000000002', // transferId
        '0x000000000000000000000000abcdabcdabcdabcdabcdabcdabcdabcdabcdabcd', // to
      ],
      data: '0x',
      address: '0x08034625696dC863AD00c2920216055236763Cbb',
      blockNumber: 12345679n,
      transactionHash: '0x12345',
    } as unknown as Log;

    const result = decodeTransferReleased(mockLog);

    expect(result.transferId).toBe(mockLog.topics[1]);
    expect(result.to).toBe('0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd');
  });
});

describe('decodeTransferRefunded', () => {
  it('should decode TransferRefunded log', () => {
    const mockLog: Log = {
      topics: [
        '0x9876543210987654321098765432109876543210987654321098765432109876', // eventSig
        '0x0000000000000000000000000000000000000000000000000000000000000003', // transferId
      ],
      data: '0x',
      address: '0x08034625696dC863AD00c2920216055236763Cbb',
      blockNumber: 12345680n,
      transactionHash: '0x99999',
    } as unknown as Log;

    const result = decodeTransferRefunded(mockLog);

    expect(result.transferId).toBe(mockLog.topics[1]);
  });
});