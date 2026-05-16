import Fastify, { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import type { Database } from '../db/sqlite.js';
import { getPublicClient } from '../chain/client.js';
import { getTransfers, getTransferById, type TransferRow } from '../db/repo.js';
import { authMiddleware } from './auth.js';
import { registerCelloRoutes } from './routes/cello.js';
import { registerLiquidacionAvaxRoutes } from './routes/liquidacion-avax.js';

interface TransferQuery {
  bank?: string;
  beneficiary?: string;
  state?: 'opened' | 'released' | 'refunded';
  from?: string;
  to?: string;
  limit?: string;
  cursor?: string;
}

interface TransferParams {
  id: string;
}

export async function registerRoutes(
  app: FastifyInstance,
  db: Database,
): Promise<void> {
  // GET /health
  app.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const client = getPublicClient();
      const block = await client.getBlockNumber();
      return { status: 'ok', lastBlock: Number(block) };
    } catch {
      return reply.code(503).send({ status: 'error', lastBlock: null });
    }
  });

  // GET /v1/transfers
  app.get<{ Querystring: TransferQuery }>(
    '/v1/transfers',
    { preHandler: authMiddleware },
    async (request: FastifyRequest<{ Querystring: TransferQuery }>, reply: FastifyReply) => {
      const { bank, beneficiary, state, from, to, limit, cursor } = request.query;

      const filters = {
        bank: bank as string | undefined,
        beneficiary: beneficiary as string | undefined,
        state: state as 'opened' | 'released' | 'refunded' | undefined,
        from: from ? parseInt(from, 10) : undefined,
        to: to ? parseInt(to, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        cursor: cursor ? parseInt(cursor, 10) : undefined,
      };

      const result = getTransfers(db, filters);
      return result;
    },
  );

  // GET /v1/transfers/:id
  app.get<{ Params: TransferParams }>(
    '/v1/transfers/:id',
    { preHandler: authMiddleware },
    async (request: FastifyRequest<{ Params: TransferParams }>, reply: FastifyReply) => {
      const { id } = request.params;
      const transfer = getTransferById(db, id);

      if (!transfer) {
        return reply.code(404).send({ error: 'Transfer not found' });
      }

      return transfer;
    },
  );

  // ─── Dual-flow routes (open — no authMiddleware, for demo purposes) ─────────
  await registerCelloRoutes(app);
  await registerLiquidacionAvaxRoutes(app);
}