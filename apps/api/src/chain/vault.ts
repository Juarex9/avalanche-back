/**
 * Vault client — lazy singleton using viem PublicClient for the InterbankVault contract.
 *
 * Mirrors the pattern from apps/api/src/chain/client.ts but is scoped to the vault contract
 * and uses NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS instead of INDEXER_VAULT_ADDRESS.
 *
 * Usage: const client = getVaultClient();
 */

import { avalancheFuji } from 'viem/chains';
import { createPublicClient, http, PublicClient } from 'viem';
import { INTERBANK_VAULT_ABI } from './vault.abi.js';

let _client: PublicClient | null = null;

export function getVaultClient(): PublicClient {
  if (_client) return _client;

  const contractAddress = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error(
      'NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS environment variable is not set. ' +
        'Cannot initialize vault PublicClient.',
    );
  }

  const rpcUrl =
    process.env.FUJI_RPC_URL ?? 'https://api.avax-test.network/ext/bc/C/rpc';

  _client = createPublicClient({
    chain: avalancheFuji,
    transport: http(rpcUrl),
  });

  return _client;
}

/** Contract address resolver — reads env at call time (lazy). */
export function getVaultAddress(): string {
  const addr = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS;
  if (!addr) {
    throw new Error('NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS is not set');
  }
  return addr;
}

/** Resets the cached client — useful for testing or hot-reload. */
export function resetVaultClient(): void {
  _client = null;
}