import { getPublicClient } from '../chain/client.js';
import { getTransfers, getTransferById } from '../db/repo.js';
import { authMiddleware } from './auth.js';
export async function registerRoutes(app, db) {
    // GET /health
    app.get('/health', async (request, reply) => {
        try {
            const client = getPublicClient();
            const block = await client.getBlockNumber();
            return { status: 'ok', lastBlock: Number(block) };
        }
        catch {
            return reply.code(503).send({ status: 'error', lastBlock: null });
        }
    });
    // GET /v1/transfers
    app.get('/v1/transfers', { preHandler: authMiddleware }, async (request, reply) => {
        const { bank, beneficiary, state, from, to, limit, cursor } = request.query;
        const filters = {
            bank: bank,
            beneficiary: beneficiary,
            state: state,
            from: from ? parseInt(from, 10) : undefined,
            to: to ? parseInt(to, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            cursor: cursor ? parseInt(cursor, 10) : undefined,
        };
        const result = getTransfers(db, filters);
        return result;
    });
    // GET /v1/transfers/:id
    app.get('/v1/transfers/:id', { preHandler: authMiddleware }, async (request, reply) => {
        const { id } = request.params;
        const transfer = getTransferById(db, id);
        if (!transfer) {
            return reply.code(404).send({ error: 'Transfer not found' });
        }
        return transfer;
    });
}
//# sourceMappingURL=routes.js.map