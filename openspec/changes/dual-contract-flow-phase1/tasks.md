# Tasks: dual-contract-flow-phase1

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~200–280 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending (not needed) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Infrastructure / Config

- [x] 1.1 Create `apps/api/src/http/dual-flow.ts` with `getDualFlowConfig()` that reads `NEXT_PUBLIC_DUAL_FLOW_ENABLED`, `NEXT_PUBLIC_EERC_CONTRACT_ADDRESS`, and `NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS`; returns `enabled: false` when flag is off; asserts addresses are not equal, warns and disables flow if they match
- [x] 1.2 Update `apps/api/.env.example` — add `NEXT_PUBLIC_EERC_CONTRACT_ADDRESS`, `NEXT_PUBLIC_EERC_MODE`, `NEXT_PUBLIC_DUAL_FLOW_ENABLED` with comment "eERC flow only"; add `NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS` with comment "Vault flow only"
- [x] 1.3 Add boot-time validation in `apps/api/src/index.ts` that calls `getDualFlowConfig()` on startup and prints console warning if addresses are equal; do NOT crash server — warn only

## Phase 2: Contract Wrappers

- [x] 2.1 Create `apps/api/src/chain/eerc.ts` — lazy singleton `getEercClient()` wrapping `@avalabs/eerc-sdk`, initialized with `NEXT_PUBLIC_EERC_CONTRACT_ADDRESS` and `NEXT_PUBLIC_EERC_MODE`; throws descriptive error if env missing
- [x] 2.2 Create `apps/api/src/chain/vault.ts` — lazy singleton `getVaultClient()` wrapping viem PublicClient for vault, initialized with `NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS`; uses existing `INTERBANK_VAULT_ABI` from `vault.abi.ts`
- [x] 2.3 Verify `vault.abi.ts` exports `INTERBANK_VAULT_ABI` — confirmed; no creation needed; confirm TransferOpened, TransferReleased, TransferRefunded events are present

## Phase 3: Route Groups

- [x] 3.1 Create `apps/api/src/http/routes/veila.ts` — Fastify route group with `GET /veila/status` returning `{ flow_type: 'eerc', label: 'Transferencia privada Veila', enabled: true, contract_address: <address>, sdk_initialized: true }`; response when disabled: `{ flow_type: 'eerc', enabled: false }`
- [x] 3.2 Create `apps/api/src/http/routes/liquidacion-avax.ts` — Fastify route group with `GET /liquidacion-avax/status` returning `{ flow_type: 'vault', label: 'Liquidación AVAX', enabled: true, contract_address: <address>, client_initialized: true }`; response when disabled: `{ flow_type: 'vault', enabled: false }`
- [x] 3.3 Update `apps/api/src/http/routes.ts` — add `registerRoutes()` calls for both new route files after existing route registrations; do NOT apply `authMiddleware` to dual-flow routes (open for demo purposes)
- [x] 3.4 Ensure each route returns proper JSON with correct `content-type: application/json` header via Fastify's `reply.type('application/json')`

## Phase 4: Testing

- [x] 4.1 Write unit test `apps/api/src/http/dual-flow.test.ts` — mock `process.env`, test: (a) flag off → `enabled: false`, (b) addresses equal → warning + `enabled: false`, (c) happy path → `enabled: true` with both addresses
- [x] 4.2 Write integration test `apps/api/src/http/routes/veila.test.ts` — Fastify server with mocked env, `GET /veila/status` → assert 200 and correct shape; with flag off → assert 503
- [x] 4.3 Write integration test `apps/api/src/http/routes/liquidacion-avax.test.ts` — same pattern for `/liquidacion-avax/status`
- [x] 4.4 Run `npx biome lint` on all new and modified files — fix any errors before commit

## Implementation Order

1. Phase 1 (dual-flow.ts + .env.example) — foundation, no deps
2. Phase 2 (eerc.ts + vault.ts wrappers) — depends on Phase 1 env vars
3. Phase 3 (route groups + routes.ts wiring) — depends on Phase 2 wrappers
4. Phase 4 (tests + lint) — runs last, verifies everything