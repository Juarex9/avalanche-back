/**
 * /veila route group — eERC (EncryptedERC) flow.
 *
 * GET /veila/status returns the current flow configuration.
 * When disabled: returns 503 with { flow_type: 'eerc', enabled: false }.
 * When enabled:  returns 200 with full flow metadata.
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getDualFlowConfig } from '../dual-flow.js';
import { getEercClient } from '../../chain/eerc.js';
import { getVaultAddress } from '../../chain/vault.js';

export async function registerVeilaRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/veila/status',
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const config = getDualFlowConfig();

      if (!config.enabled) {
        return reply
          .code(503)
          .type('application/json')
          .send({ flow_type: 'eerc', enabled: false });
      }

      // Attempt to read SDK status — do not crash if RPC is down
      let sdkInitialized = false;
      try {
        getEercClient();
        sdkInitialized = true;
      } catch {
        sdkInitialized = false;
      }

      const contractAddress = config.eercAddress ?? getVaultAddress();

      return reply
        .code(200)
        .type('application/json')
        .send({
          flow_type: 'eerc',
          label: 'Transferencia privada Veila',
          enabled: true,
          contract_address: contractAddress,
          sdk_initialized: sdkInitialized,
        });
    },
  );
}