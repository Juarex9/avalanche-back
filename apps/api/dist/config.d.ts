export declare const config: {
    readonly vaultAddress: string;
    readonly port: number;
    readonly chainId: number;
    readonly rpcUrl: string;
    readonly apiKeys: string[];
    readonly fromBlock: number;
    readonly databaseUrl: string;
};
export type Config = typeof config;
export declare function loadConfig(): Config;
//# sourceMappingURL=config.d.ts.map