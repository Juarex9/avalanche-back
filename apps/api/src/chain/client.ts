import { avalancheFuji } from 'viem/chains';
import { createPublicClient, http, PublicClient } from 'viem';
import { loadConfig } from '../config.js';

let _client: PublicClient | null = null;

export function getPublicClient(): PublicClient {
  if (_client) return _client;

  const config = loadConfig();
  _client = createPublicClient({
    chain: avalancheFuji,
    transport: http(config.rpcUrl),
  });

  return _client;
}

export function createPublicClientForChain(rpcUrl: string): PublicClient {
  return createPublicClient({
    chain: avalancheFuji,
    transport: http(rpcUrl),
  });
}