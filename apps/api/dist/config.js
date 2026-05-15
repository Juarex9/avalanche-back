function requireEnv(key) {
    const val = process.env[key];
    if (!val)
        throw new Error(`Missing required env var: ${key}`);
    return val;
}
export const config = {
    vaultAddress: requireEnv('INDEXER_VAULT_ADDRESS'),
    port: parseInt(process.env.PORT ?? '8080', 10),
    chainId: parseInt(process.env.CHAIN_ID ?? '43113', 10),
    rpcUrl: process.env.FUJI_RPC_URL ?? 'https://api.avax-test.network/ext/bc/C/rpc',
    apiKeys: (process.env.API_KEYS ?? process.env.API_KEY ?? 'demo-api-key').split(',').map((s) => s.trim()),
    fromBlock: parseInt(process.env.INDEXER_FROM_BLOCK ?? '0', 10),
    databaseUrl: process.env.DATABASE_URL ?? './data/indexer.db',
};
export function loadConfig() {
    return config;
}
//# sourceMappingURL=config.js.map