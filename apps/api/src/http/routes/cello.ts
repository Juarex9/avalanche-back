/**
 * /cello route group — eERC (EncryptedERC) flow.
 *
 * GET /cello/status returns the current flow configuration.
 * When disabled: returns 503 with { flow_type: 'eerc', enabled: false }.
 * When enabled:  returns 200 with full flow metadata.
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getDualFlowConfig } from '../dual-flow.js';
import { getEercClient } from '../../chain/eerc.js';
import { getVaultAddress } from '../../chain/vault.js';

export async function registerCelloRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/cello/status',
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const config = getDualFlowConfig();

      if (!config.enabled) {
        return reply
          .code(503)
          .type('application/json')
          .send({ flow_type: 'eerc', enabled: false });
      }

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
          label: 'Transferencia privada Cello',
          enabled: true,
          contract_address: contractAddress,
          sdk_initialized: sdkInitialized,
        });
    },
  );
}
