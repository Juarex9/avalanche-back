/**
 * eERC SDK client — lazy singleton wrapping @avalabs/eerc-sdk.
 *
 * Initialized with NEXT_PUBLIC_EERC_CONTRACT_ADDRESS and NEXT_PUBLIC_EERC_MODE.
 * Throws descriptive error if required env vars are missing.
 *
 * Usage: const client = getEercClient();
 */

import { EercSDK } from '@avalabs/eerc-sdk';

let _client: EercSDK | null = null;

export function getEercClient(): EercSDK {
  if (_client) return _client;

  const contractAddress = process.env.NEXT_PUBLIC_EERC_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error(
      'NEXT_PUBLIC_EERC_CONTRACT_ADDRESS environment variable is not set. ' +
        'Cannot initialize eERC SDK client.',
    );
  }

  const mode = (process.env.NEXT_PUBLIC_EERC_MODE ?? 'standalone') as 'standalone' | 'bridge';
  const rpcUrl =
    process.env.FUJI_RPC_URL ?? 'https://api.avax-test.network/ext/bc/C/rpc';

  _client = new EercSDK({
    contractAddress,
    mode,
    rpcUrl,
  });

  return _client;
}

/** Resets the cached client — useful for testing or hot-reload. */
export function resetEercClient(): void {
  _client = null;
}