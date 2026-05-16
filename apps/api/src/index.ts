import Fastify from 'fastify';
import { openDatabase, closeDatabase } from './db/sqlite.js';
import { loadConfig } from './config.js';
import { getPublicClient } from './chain/client.js';
import { runSync } from './indexer/sync.js';
import { registerRoutes } from './http/routes.js';
import { getDualFlowConfig } from './http/dual-flow.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS transfers (
  transfer_id TEXT PRIMARY KEY,
  bank TEXT NOT NULL,
  beneficiary TEXT NOT NULL,
  amount_wei TEXT NOT NULL,
  commitment TEXT NOT NULL,
  expiry INTEGER NOT NULL,
  depositor TEXT,
  state TEXT NOT NULL DEFAULT 'opened',
  opened_block INTEGER NOT NULL,
  opened_tx TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS indexer_cursor (
  key TEXT PRIMARY KEY,
  last_block INTEGER NOT NULL
);
`;

async function main() {
  const config = loadConfig();

  // Boot-time dual-flow validation — warn only, do not crash
  const dualFlowConfig = getDualFlowConfig();
  if (dualFlowConfig.enabled && dualFlowConfig.eercAddress && dualFlowConfig.vaultAddress) {
    if (dualFlowConfig.eercAddress.toLowerCase() === dualFlowConfig.vaultAddress.toLowerCase()) {
      console.warn(
        '[boot] WARNING: Dual-flow contract addresses are identical. ' +
          'NEXT_PUBLIC_EERC_CONTRACT_ADDRESS == NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS. ' +
          'Disabling dual-flow feature. This is a copy-paste error.',
      );
    } else {
      console.log(`[boot] Dual-flow enabled — eERC: ${dualFlowConfig.eercAddress}, Vault: ${dualFlowConfig.vaultAddress}`);
    }
  } else if (!dualFlowConfig.enabled) {
    console.log('[boot] Dual-flow feature flag is off (NEXT_PUBLIC_DUAL_FLOW_ENABLED=false)');
  }

  const dbPath = config.databaseUrl;

  // Ensure data directory exists
  const { mkdirSync } = await import('fs');
  mkdirSync(dbPath.replace(/\/[^/]+$/, ''), { recursive: true });

  // Initialize SQLite (sql.js async)
  const db = await openDatabase(dbPath);

  // Create schema
  db.run(SCHEMA);

  // Create viem client
  const client = getPublicClient();

  // Run initial sync
  console.log('Running initial sync...');
  try {
    const lastBlock = await runSync(
      client,
      db,
      config.vaultAddress as `0x${string}`,
      config.fromBlock,
    );
    console.log(`Initial sync complete. Last block: ${lastBlock}`);
  } catch (err) {
    console.error('Initial sync failed:', err);
  }

  // Create Fastify server
  const app = Fastify({ logger: true });

  // Register routes
  await registerRoutes(app, db);

  // Start server
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Server listening on port ${config.port}`);
  } catch (err) {
    console.error('Server failed to start:', err);
    process.exit(1);
  }

  // Graceful shutdown — persist DB
  const shutdown = () => {
    closeDatabase(db, dbPath);
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});