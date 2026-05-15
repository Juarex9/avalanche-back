import { loadConfig } from '../config.js';
export async function authMiddleware(request, reply) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        reply.code(401).send({ error: 'Missing or invalid Authorization header' });
        return;
    }
    const token = authHeader.slice(7).trim();
    const config = loadConfig();
    if (!config.apiKeys.includes(token)) {
        reply.code(401).send({ error: 'Invalid API key' });
        return;
    }
}
//# sourceMappingURL=auth.js.map