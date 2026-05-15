import { describe, it, expect, vi } from 'vitest';

// Mock better-sqlite3
vi.mock('better-sqlite3', () => ({
  default: vi.fn(() => ({
    prepare: vi.fn(() => ({
      get: vi.fn(() => ({ last_block: 12345678 })),
      run: vi.fn(),
    })),
  })),
}));

import type Database from 'better-sqlite3';
import { getCursor, setCursor } from './cursor.js';

describe('cursor', () => {
  it('should get cursor returning last block', () => {
    const mockGet = vi.fn(() => ({ last_block: 12345678 }));
    const mockPrepare = vi.fn(() => ({ get: mockGet }));
    const mockDb = { prepare: mockPrepare } as unknown as Database.Database;

    const result = getCursor(mockDb, 'vault_indexer');

    expect(result).toBe(12345678);
    expect(mockPrepare).toHaveBeenCalledWith('SELECT last_block FROM indexer_cursor WHERE key = ?');
  });

  it('should return 0 if no cursor exists', () => {
    const mockGet = vi.fn(() => undefined);
    const mockPrepare = vi.fn(() => ({ get: mockGet }));
    const mockDb = { prepare: mockPrepare } as unknown as Database.Database;

    const result = getCursor(mockDb, 'vault_indexer');

    expect(result).toBe(0);
  });

  it('should set cursor updating block number', () => {
    const mockRun = vi.fn();
    const mockPrepare = vi.fn(() => ({ run: mockRun }));
    const mockDb = { prepare: mockPrepare } as unknown as Database.Database;

    setCursor(mockDb, 'vault_indexer', 99999999);

    expect(mockPrepare).toHaveBeenCalledWith('INSERT OR REPLACE INTO indexer_cursor (key, last_block) VALUES (?, ?)');
    expect(mockRun).toHaveBeenCalledWith('vault_indexer', 99999999);
  });
});