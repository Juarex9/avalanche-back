/**
 * /liquidacion-avax route group — Vault (InterbankVault) flow.
 *
 * GET /liquidacion-avax/status returns the current flow configuration.
 * When disabled: returns 503 with { flow_type: 'vault', enabled: false }.
 * When enabled:  returns 200 with full flow metadata.
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getDualFlowConfig } from '../dual-flow.js';
import { getVaultClient } from '../../chain/vault.js';

export async function registerLiquidacionAvaxRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get(
    '/liquidacion-avax/status',
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const config = getDualFlowConfig();

      if (!config.enabled) {
        return reply
          .code(503)
          .type('application/json')
          .send({ flow_type: 'vault', enabled: false });
      }

      // Verify client is initializable — do not crash if RPC is down
      let clientInitialized = false;
      try {
        getVaultClient();
        clientInitialized = true;
      } catch {
        clientInitialized = false;
      }

      return reply
        .code(200)
        .type('application/json')
        .send({
          flow_type: 'vault',
          label: 'Liquidación AVAX',
          enabled: true,
          contract_address: config.vaultAddress,
          client_initialized: clientInitialized,
        });
    },
  );
}