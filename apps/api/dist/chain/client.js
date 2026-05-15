import { avalancheFuji } from 'viem/chains';
import { createPublicClient, http } from 'viem';
import { loadConfig } from '../config.js';
let _client = null;
export function getPublicClient() {
    if (_client)
        return _client;
    const config = loadConfig();
    _client = createPublicClient({
        chain: avalancheFuji,
        transport: http(config.rpcUrl),
    });
    return _client;
}
export function createPublicClientForChain(rpcUrl) {
    return createPublicClient({
        chain: avalancheFuji,
        transport: http(rpcUrl),
    });
}
//# sourceMappingURL=client.js.map