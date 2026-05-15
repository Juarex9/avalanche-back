import { describe, it, expect, vi } from 'vitest';

// Mock better-sqlite3 before importing modules that use it
vi.mock('better-sqlite3', () => ({
  default: vi.fn(() => ({
    prepare: vi.fn(() => ({
      all: vi.fn(() => []),
      get: vi.fn(() => null),
      run: vi.fn(),
    })),
  })),
}));

import type Database from 'better-sqlite3';
import { upsertTransfer, getTransferById, getTransfers } from './repo.js';

describe('upsertTransfer', () => {
  it('should insert transfer', () => {
    const mockRun = vi.fn();
    const mockPrepare = vi.fn(() => ({
      run: mockRun,
    }));

    const mockDb = {
      prepare: mockPrepare,
    } as unknown as Database.Database;

    upsertTransfer(mockDb, {
      transferId: '0xabc123',
      bank: '0x1234567890123456789012345678901234567890',
      beneficiary: '0xBD1e2b220C41bcB724e61459CA401c552028106E',
      amount: 50000000000000000n,
      commitment: '0xdef456',
      expiry: 9999999999,
      openedBlock: 12345678,
      openedTx: '0xtxhash',
    });

    expect(mockPrepare).toHaveBeenCalled();
    expect(mockRun).toHaveBeenCalledWith(
      '0xabc123',
      '0x1234567890123456789012345678901234567890',
      '0xBD1e2b220C41bcB724e61459CA401c552028106E',
      '50000000000000000',
      '0xdef456',
      9999999999,
      12345678,
      '0xtxhash',
      expect.any(Number)
    );
  });
});

describe('getTransfers', () => {
  it('should filter by bank', () => {
    const mockAll = vi.fn(() => [
      {
        transfer_id: '0xabc123',
        bank: '0x1234567890123456789012345678901234567890',
        beneficiary: '0xBD1e2b220C41bcB724e61459CA401c552028106E',
        amount_wei: '50000000000000000',
        commitment: '0xdef456',
        expiry: 9999999999,
        state: 'opened',
        opened_block: 12345678,
        opened_tx: '0xtxhash',
        updated_at: 9999999999,
      },
    ]);

    const mockPrepare = vi.fn(() => ({
      all: mockAll,
    }));

    const mockDb = {
      prepare: mockPrepare,
    } as unknown as Database.Database;

    const result = getTransfers(mockDb, {
      bank: '0x1234567890123456789012345678901234567890',
    });

    expect(mockAll).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].bank).toBe('0x1234567890123456789012345678901234567890');
  });

  it('should return empty array when no results', () => {
    const mockAll = vi.fn(() => []);
    const mockPrepare = vi.fn(() => ({ all: mockAll }));
    const mockDb = { prepare: mockPrepare } as unknown as Database.Database;

    const result = getTransfers(mockDb, {});
    expect(result).toHaveLength(0);
  });
});

describe('getTransferById', () => {
  it('should return null when not found', () => {
    const mockGet = vi.fn(() => null);
    const mockPrepare = vi.fn(() => ({ get: mockGet }));
    const mockDb = { prepare: mockPrepare } as unknown as Database.Database;

    const result = getTransferById(mockDb, 'not-found');
    expect(result).toBeNull();
  });

  it('should return transfer when found', () => {
    const transfer = {
      transfer_id: '0xabc123',
      bank: '0x1234567890123456789012345678901234567890',
      beneficiary: '0xBD1e2b220C41bcB724e61459CA401c552028106E',
      amount_wei: '50000000000000000',
      commitment: '0xdef456',
      expiry: 9999999999,
      state: 'opened',
      opened_block: 12345678,
      opened_tx: '0xtxhash',
      updated_at: 9999999999,
    };

    const mockGet = vi.fn(() => transfer);
    const mockPrepare = vi.fn(() => ({ get: mockGet }));
    const mockDb = { prepare: mockPrepare } as unknown as Database.Database;

    const result = getTransferById(mockDb, '0xabc123');
    expect(result).toEqual(transfer);
  });
});