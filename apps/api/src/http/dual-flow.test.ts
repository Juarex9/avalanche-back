/**
 * Unit tests for dual-flow.ts — getDualFlowConfig()
 *
 * Test cases:
 * (a) flag off → enabled: false
 * (b) addresses equal → warning + enabled: false
 * (c) happy path → enabled: true with both addresses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDualFlowConfig } from './dual-flow.js';

describe('getDualFlowConfig()', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns enabled:false when NEXT_PUBLIC_DUAL_FLOW_ENABLED is not set', () => {
    delete process.env.NEXT_PUBLIC_DUAL_FLOW_ENABLED;
    const config = getDualFlowConfig();
    expect(config.enabled).toBe(false);
  });

  it('returns enabled:false when NEXT_PUBLIC_DUAL_FLOW_ENABLED=false', () => {
    process.env.NEXT_PUBLIC_DUAL_FLOW_ENABLED = 'false';
    process.env.NEXT_PUBLIC_EERC_CONTRACT_ADDRESS = '0x123';
    process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS = '0x456';
    const config = getDualFlowConfig();
    expect(config.enabled).toBe(false);
  });

  it('returns enabled:false when NEXT_PUBLIC_DUAL_FLOW_ENABLED=true but addresses are equal', () => {
    const sameAddress = '0x08034625696dC863AD00c2920216055236763Cbb';
    process.env.NEXT_PUBLIC_DUAL_FLOW_ENABLED = 'true';
    process.env.NEXT_PUBLIC_EERC_CONTRACT_ADDRESS = sameAddress;
    process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS = sameAddress;

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const config = getDualFlowConfig();

    expect(config.enabled).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls[0]![0]).toContain('identical');

    warnSpy.mockRestore();
  });

  it('returns enabled:true with both addresses when flag is true and addresses differ', () => {
    process.env.NEXT_PUBLIC_DUAL_FLOW_ENABLED = 'true';
    process.env.NEXT_PUBLIC_EERC_CONTRACT_ADDRESS = '0xEERC1234567890123456789012345678901234567';
    process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS = '0x08034625696dC863AD00c2920216055236763Cbb';

    const config = getDualFlowConfig();

    expect(config.enabled).toBe(true);
    expect(config.eercAddress).toBe('0xEERC1234567890123456789012345678901234567');
    expect(config.vaultAddress).toBe('0x08034625696dC863AD00c2920216055236763Cbb');
  });

  it('is case-insensitive when comparing addresses', () => {
    process.env.NEXT_PUBLIC_DUAL_FLOW_ENABLED = 'true';
    process.env.NEXT_PUBLIC_EERC_CONTRACT_ADDRESS = '0xABCD';
    process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS = '0xabcd';

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const config = getDualFlowConfig();

    expect(config.enabled).toBe(false);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('accepts "1" and "yes" as truthy values for the flag', () => {
    process.env.NEXT_PUBLIC_EERC_CONTRACT_ADDRESS = '0xEERC';
    process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS = '0xVAULT';

    process.env.NEXT_PUBLIC_DUAL_FLOW_ENABLED = '1';
    expect(getDualFlowConfig().enabled).toBe(true);

    process.env.NEXT_PUBLIC_DUAL_FLOW_ENABLED = 'yes';
    expect(getDualFlowConfig().enabled).toBe(true);
  });
});