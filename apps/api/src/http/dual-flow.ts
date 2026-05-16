/**
 * Dual Flow Configuration — reads feature flag and per-flow contract addresses.
 *
 * Feature flag: NEXT_PUBLIC_DUAL_FLOW_ENABLED (boolean)
 * eERC flow: NEXT_PUBLIC_EERC_CONTRACT_ADDRESS, NEXT_PUBLIC_EERC_MODE
 * Vault flow: NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS
 *
 * When flag is off, returns { enabled: false } immediately.
 * Asserts vault address != eerc address; warns and disables flow if they match.
 */

export interface DualFlowConfig {
  enabled: boolean;
  eercAddress?: string;
  vaultAddress?: string;
}

function isTruthy(value: string | undefined): boolean {
  return value === 'true' || value === '1' || value === 'yes';
}

export function getDualFlowConfig(): DualFlowConfig {
  const flag = process.env.NEXT_PUBLIC_DUAL_FLOW_ENABLED;
  if (!isTruthy(flag)) {
    return { enabled: false };
  }

  const eercAddress = process.env.NEXT_PUBLIC_EERC_CONTRACT_ADDRESS;
  const vaultAddress = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS;

  if (eercAddress && vaultAddress && eercAddress.toLowerCase() === vaultAddress.toLowerCase()) {
    console.warn(
      '[dual-flow] WARNING: NEXT_PUBLIC_EERC_CONTRACT_ADDRESS and NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS are identical. ' +
        'Disabling dual-flow to prevent misrouting. Set different addresses to enable both flows.',
    );
    return { enabled: false };
  }

  return {
    enabled: true,
    eercAddress,
    vaultAddress,
  };
}

/**
 * Middleware-style guard: returns early with 503 if dual-flow is disabled.
 * Does NOT crash the server — warns only.
 */
export type DualFlowType = 'cello' | 'liquidacion-avax';

export function dualFlowGuard(flow: DualFlowType) {
  const config = getDualFlowConfig();
  if (!config.enabled) {
    return {
      enabled: false,
      flowType: flow === 'cello' ? 'eerc' : 'vault',
    };
  }
  return { enabled: true };
}