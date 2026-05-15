import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dotenv from 'dotenv';

// Mock dotenv before importing config
vi.mock('dotenv', () => ({ load: vi.fn() }));

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
    vi.mocked(dotenv.load).mockReturnValue(undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should throw if INDEXER_VAULT_ADDRESS is missing', () => {
    delete process.env['INDEXER_VAULT_ADDRESS'];
    expect(() => {
      vi.isolateModules(() => {
        import('./config.js');
      });
    }).toThrow('Missing required env var: INDEXER_VAULT_ADDRESS');
  });

  it('should load with all required vars set', () => {
    process.env['INDEXER_VAULT_ADDRESS'] = '0x1234567890123456789012345678901234567890';
    vi.isolateModules(() => {
      const { config } = await import('./config.js');
      expect(config.vaultAddress).toBe('0x1234567890123456789012345678901234567890');
    });
  });

  it('should have correct defaults for PORT', () => {
    process.env['INDEXER_VAULT_ADDRESS'] = '0x1234567890123456789012345678901234567890';
    vi.isolateModules(() => {
      const { config } = await import('./config.js');
      expect(config.port).toBe(8080);
    });
  });

  it('should have correct defaults for CHAIN_ID', () => {
    process.env['INDEXER_VAULT_ADDRESS'] = '0x1234567890123456789012345678901234567890';
    vi.isolateModules(() => {
      const { config } = await import('./config.js');
      expect(config.chainId).toBe(43113);
    });
  });
});