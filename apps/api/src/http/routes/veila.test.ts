/**
 * Integration tests for /veila/status route.
 *
 * Test cases:
 * - flag off → 503 with { flow_type: 'eerc', enabled: false }
 * - flag on  → 200 with correct shape (flow_type, label, enabled, contract_address, sdk_initialized)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { registerVeilaRoutes } from './veila.js';

// Mock the eerc module so we don't hit the real SDK import in vitest
vi.mock('../../chain/eerc.js', () => ({
  getEercClient: vi.fn(() => ({})),
  resetEercClient: vi.fn(),
}));

describe('GET /veila/status', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  async function createApp(): Promise<FastifyInstance> {
    const app = Fastify();
    await registerVeilaRoutes(app);
    await app.ready();
    return app;
  }

  it('returns 503 when dual-flow flag is off', async () => {
    delete process.env.NEXT_PUBLIC_DUAL_FLOW_ENABLED;
    const app = await createApp();

    const res = await app.inject({ method: 'GET', url: '/veila/status' });

    expect(res.statusCode).toBe(503);
    const body = JSON.parse(res.body);
    expect(body.flow_type).toBe('eerc');
    expect(body.enabled).toBe(false);

    await app.close();
  });

  it('returns 200 with correct shape when flag is on', async () => {
    process.env.NEXT_PUBLIC_DUAL_FLOW_ENABLED = 'true';
    process.env.NEXT_PUBLIC_EERC_CONTRACT_ADDRESS = '0xEERC1234567890123456789012345678901234567';
    process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS = '0x08034625696dC863AD00c2920216055236763Cbb';

    const app = await createApp();

    const res = await app.inject({ method: 'GET', url: '/veila/status' });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.flow_type).toBe('eerc');
    expect(body.label).toBe('Transferencia privada Veila');
    expect(body.enabled).toBe(true);
    expect(body.contract_address).toBe('0xEERC1234567890123456789012345678901234567');
    expect(body.sdk_initialized).toBe(true);
    expect(res.headers['content-type']).toBe('application/json; charset=utf-8');

    await app.close();
  });

  it('returns correct content-type header', async () => {
    process.env.NEXT_PUBLIC_DUAL_FLOW_ENABLED = 'true';
    process.env.NEXT_PUBLIC_EERC_CONTRACT_ADDRESS = '0xEERC';
    process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS = '0xVAULT';

    const app = await createApp();
    const res = await app.inject({ method: 'GET', url: '/veila/status' });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);

    await app.close();
  });
});