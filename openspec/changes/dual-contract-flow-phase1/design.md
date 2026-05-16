# Design: dual-contract-flow-phase1

## Technical Approach

Phase 1 exposes two distinct on-chain flows as separate Fastify route groups in `apps/api`, each with independent contract client initialization. Since no `apps/web` exists in this monorepo, the "front" is the Fastify API itself exposing `/veila/*` (eERC flow) and `/liquidacion-avax/*` (Vault flow) route groups. Feature flag `NEXT_PUBLIC_DUAL_FLOW_ENABLED` gates both flows at boot. Env validation asserts `vault address != eerc address` to catch copy-paste errors.

## Architecture Decisions

### Decision: Monorepo app target

**Choice**: `apps/api` (Fastify) as the dual-flow host
**Alternatives considered**: Creating a new `apps/web` Next.js app from scratch
**Rationale**: `apps/api` already has viem, vault ABI, and config patterns. Adding eERC routes here avoids creating a parallel app. The "front" in this context means API route handlers, not a browser UI.

### Decision: SDK initialization pattern

**Choice**: Lazy singleton per flow — `getEercClient()` / `getVaultClient()` with module-level `_client` cache, initialized on first call
**Alternatives considered**: Singleton at module load (boot-time crash risk); new instance per request (no state, inefficient)
**Rationale**: Matches existing `getPublicClient()` pattern in `apps/api/src/chain/client.ts`. Lazy init avoids boot failure if RPC is down. Cache prevents reconnecting on every request.

### Decision: Feature flag strategy

**Choice**: Runtime check — `NEXT_PUBLIC_DUAL_FLOW_ENABLED` read at request time, not build time
**Alternatives considered**: Build-time env (only works if `apps/api` does SSG, which it doesn't — it's a server binary)
**Rationale**: Fastify reloads env on restart. Runtime check means toggling the flag takes effect on next deploy restart without a rebuild. No significant perf cost for a single boolean read.

### Decision: Env validation timing

**Choice**: Lazy validation — check on first route hit, not at module load
**Alternatives considered**: Validate in `src/config.ts` at boot (would crash server on bad env)
**Rationale**: The proposal says "warn and disable failing route" not "crash server." Lazy validation allows the server to start even with bad env, and the feature flag + route guard handles the failure gracefully.

## Data Flow

```
/veila/* route handler
    └─> getEercClient() ──> @avalabs/eerc-sdk ──> EncryptedERC (Fuji)

/liquidacion-avax/* route handler
    └─> getVaultClient() ──> viem PublicClient ──> InterbankVault (Fuji)
         (existing apps/api/src/chain/client.ts)

Dual-flow validation (dual-flow.ts)
    └─> asserts eercAddress !== vaultAddress
         warns + disables flow if equal
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/chain/eerc.ts` | Create | eERC SDK wrapper — lazy singleton `getEercClient()` |
| `apps/api/src/chain/vault.ts` | Create | viem client wrapper for vault — lazy singleton `getVaultClient()` (mirrors `client.ts` pattern) |
| `apps/api/src/http/dual-flow.ts` | Create | Feature flag read + env validation utility |
| `apps/api/src/http/routes/veila.ts` | Create | `/veila/*` route handlers — eERC flow |
| `apps/api/src/http/routes/liquidacion-avax.ts` | Create | `/liquidacion-avax/*` route handlers — vault flow |
| `apps/api/src/http/routes.ts` | Modify | Register both route groups; apply `dualFlowGuard` |
| `apps/api/.env.example` | Modify | Add `NEXT_PUBLIC_EERC_*` and `NEXT_PUBLIC_VAULT_*` prefixes; add `NEXT_PUBLIC_DUAL_FLOW_ENABLED` |
| `apps/api/package.json` | Modify | Add `@avalabs/eerc-sdk` dependency |

## Interfaces / Contracts

### dual-flow.ts

```typescript
// apps/api/src/http/dual-flow.ts
export interface DualFlowConfig {
  eercAddress: string;
  vaultAddress: string;
  enabled: boolean;
}

// Reads NEXT_PUBLIC_DUAL_FLOW_ENABLED and per-flow addresses
// Returns null for disabled flows
// Throws if addresses are equal (assertion failure)
export function getDualFlowConfig(): DualFlowConfig;

// Middleware-style guard: returns early 503 if flow disabled
export function dualFlowGuard(flow: 'veila' | 'liquidacion-avax'): HookHandler
```

### eerc.ts

```typescript
// apps/api/src/chain/eerc.ts
import { EercSDK } from '@avalabs/eerc-sdk';

let _client: EercSDK | null = null;

export function getEercClient(): EercSDK {
  if (_client) return _client;
  const address = process.env.NEXT_PUBLIC_EERC_CONTRACT_ADDRESS;
  if (!address) throw new Error('NEXT_PUBLIC_EERC_CONTRACT_ADDRESS not set');
  _client = new EercSDK({
    contractAddress: address,
    mode: process.env.NEXT_PUBLIC_EERC_MODE ?? 'standalone',
    rpcUrl: process.env.FUJI_RPC_URL ?? 'https://api.avax-test.network/ext/bc/C/rpc',
  });
  return _client;
}
```

### vault.ts

```typescript
// apps/api/src/chain/vault.ts
// Mirrors getPublicClient() pattern but scoped to vault contract
import { avalancheFuji } from 'viem/chains';
import { createPublicClient, http, PublicClient } from 'viem';
import { INTERBANK_VAULT_ABI } from './vault.abi.js';

let _client: PublicClient | null = null;

export function getVaultClient(): PublicClient {
  if (_client) return _client;
  const address = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS;
  if (!address) throw new Error('NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS not set');
  _client = createPublicClient({
    chain: avalancheFuji,
    transport: http(process.env.FUJI_RPC_URL),
  });
  return _client;
}

export const VAULT_CONTRACT = {
  address: () => process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS!,
  abi: INTERBANK_VAULT_ABI,
} as const;
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `getDualFlowConfig()` — equal addresses, disabled flow, happy path | `vitest` — already in project |
| Unit | `getEercClient()` / `getVaultClient()` — lazy init, missing env | vitest with env mock |
| Integration | Route handler registers without crash when `DUAL_FLOW_ENABLED=false` | Fastify init test |
| E2E | `GET /veila/health` and `GET /liquidacion-avax/health` with real Fuji addresses | Manual smoke test (requires deployed contracts) |

## Migration / Rollout

No migration required. Phase 1 is net-new routes behind a feature flag. When `NEXT_PUBLIC_DUAL_FLOW_ENABLED=false` (or unset), all dual-flow routes return `503` with a JSON body indicating the flow is disabled.

## Open Questions

- [ ] `@avalabs/eerc-sdk` — confirm the SDK's TypeScript types and constructor signature match the `getEercClient()` wrapper above. Need to verify against actual package exports.
- [ ] Should `/veila` and `/liquidacion-avax` expose a `/health` endpoint for smoke testing, or just document `GET /health` on each flow's base route?
- [ ] The existing `apps/api/src/http/routes.ts` uses auth middleware (`authMiddleware`). Should dual-flow routes also require API key auth, or should they be open for demo purposes?