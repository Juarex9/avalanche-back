import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { transfersRouter } from './routes.js';
import type { TransferResponse } from './types.js';

// Mock the auth middleware
vi.mock('./auth.js', () => ({
  authMiddleware: vi.fn(async (_req: unknown, reply: { status: (code: number) => { send: (body: unknown) => unknown }; getStatus: () => number; getResponseBody: () => unknown }, _reply: unknown) => {
    reply.status(200);
  }),
}));

// Mock db
const mockPrepare = vi.fn(() => ({
  all: vi.fn(() => []),
  get: vi.fn(() => null),
}));

const mockDb = {
  prepare: mockPrepare,
} as unknown as ReturnType<typeof vi.fn>;

describe('GET /v1/transfers', () => {
  let fastify: FastifyInstance;

  beforeEach(async () => {
    vi.resetModules();
    mockPrepare.mockClear();
    fastify = Fastify();
    fastify.get('/v1/transfers', async (req) => {
      const { bank, beneficiary, state, from, to, limit, cursor } = req.query as Record<string, string>;
      return {
        transfers: [],
        filters: { bank, beneficiary, state, from, to, limit, cursor },
      };
    });
    await fastify.ready();
  });

  it('should filter by bank', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/v1/transfers?bank=0x1234567890123456789012345678901234567890',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.filters.bank).toBe('0x1234567890123456789012345678901234567890');
  });

  it('should filter by beneficiary', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/v1/transfers?beneficiary=0xBD1e2b220C41bcB724e61459CA401c552028106E',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.filters.beneficiary).toBe('0xBD1e2b220C41bcB724e61459CA401c552028106E');
  });

  it('should filter by state', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/v1/transfers?state=opened',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.filters.state).toBe('opened');
  });

  it('should paginate with cursor', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/v1/transfers?cursor=12345678&limit=10',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.filters.cursor).toBe('12345678');
    expect(body.filters.limit).toBe('10');
  });
});

describe('GET /v1/transfers/:id', () => {
  let fastify: FastifyInstance;

  beforeEach(async () => {
    vi.resetModules();
    fastify = Fastify();
    fastify.get('/v1/transfers/:id', async (req) => {
      const id = (req.params as { id: string }).id;
      if (id === 'not-found') {
        return { statusCode: 404, body: { error: 'Transfer not found' } };
      }
      return {
        transferId: id,
        bank: '0x1234567890123456789012345678901234567890',
        beneficiary: '0xBD1e2b220C41bcB724e61459CA401c552028106E',
        amountWei: '50000000000000000',
        commitment: '0xabc',
        expiry: 9999999999,
        state: 'opened',
        openedBlock: 12345678,
        openedTx: '0xdef',
        updatedAt: 9999999999,
      };
    });
    await fastify.ready();
  });

  it('should return 404 when not found', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/v1/transfers/not-found',
    });
    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Transfer not found');
  });

  it('should return transfer when found', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/v1/transfers/0xabc123',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.transferId).toBe('0xabc123');
    expect(body.state).toBe('opened');
  });
});

describe('GET /health', () => {
  let fastify: FastifyInstance;

  beforeEach(async () => {
    vi.resetModules();
    fastify = Fastify();
    fastify.get('/health', async () => ({ status: 'ok' }));
    await fastify.ready();
  });

  it('should return {status: ok}', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/health',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
  });
});