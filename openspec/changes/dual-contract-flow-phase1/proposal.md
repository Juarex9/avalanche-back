# Proposal: dual-contract-flow-phase1

## Intent

Implement Phase 1 of the dual-contract front-end architecture defined in `docs/design-dual-contract-flows.md`. The goal is to expose two distinct on-chain flows (eERC via `@avalabs/eerc-sdk` and InterbankVault via viem/wagmi) as separate routes in the front app, with unambiguous environment variable prefixes and a smoke-test checklist validated on Fuji testnet.

## Scope

### In Scope
- Two route groups: `/veila` (eERC flow) and `/liquidacion-avax` (vault flow)
- Environment variables with clear non-ambiguous prefixes: `NEXT_PUBLIC_EERC_*` vs `NEXT_PUBLIC_VAULT_*`
- `.env.example` documents both prefixes separately with validation notes
- No forced backend: on-chain reads from vault in front if demo needs it
- eERC contract deployed from `EncryptedERC/` — address and block recorded for front
- Smoke test checklist: two user stories, one per flow

### Out of Scope (MVP)
- Unified indexador en DB
- Liquidez automática entre eERC y AVAX del vault
- Backend indexer for eERC events
- Anvil/Hardhat local chain as official target — Fuji only

## Capabilities

### New Capabilities
- `dual-flow-front-routes`: Front app exposes two distinct route groups (`/veila` and `/liquidacion-avax`) with independent contract SDK/ABI wiring
- `dual-flow-env-config`: Environment config with unambiguous per-flow prefixes (`EERC_*` vs `VAULT_*`), validated at boot with assertion that vault address ≠ eerc address

## Approach

TypeScript/Next.js front (existing `apps/web` or `apps/api` static pages). Two route groups, each with its own contract client:
- **Flow A (eERC)**: `@avalabs/eerc-sdk` initialized with `NEXT_PUBLIC_EERC_CONTRACT_ADDRESS`, `NEXT_PUBLIC_EERC_MODE=standalone`
- **Flow B (Vault)**: viem/wagmi with vault ABI initialized with `NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS`

Env vars separated with validation assert `vault != eerc` at boot. If validation fails, warn and disable failing route behind `NEXT_PUBLIC_DUAL_FLOW_ENABLED=false`. Route compilation checks confirm each client initializes independently — no cross-import of eerc ABI in vault flow and vice versa.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/web/` or `apps/api/` | New | Two route groups: `/veila/*` and `/liquidacion-avax/*` |
| `apps/web/.env.example` | Modified | Document both env prefix sets, add validation note |
| `apps/web/src/chain/` | New | Vault ABI artifact (`vault.abi.ts`) sourced from `forge build` output |
| `EncryptedERC/` | Reference | eERC contract source; deploy script produces address + block |
| `foundry.toml` | Reference | `CHAIN_ID=43113` confirms Fuji target |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Env var copy-paste causes same address for both flows | Medium | Boot-time assertion prints warning and disables route if addresses match |
| eERC SDK not aligned with deployed contract version | Medium | Record address + block from deploy; front pins to that block for event filtering |
| Cross-import of ABI between flows | Low | Static analysis check: vault flow must not import eerc ABI, eERC flow must not import vault ABI |
| Route crashes on bad env | Low | Feature flag `NEXT_PUBLIC_DUAL_FLOW_ENABLED=false` hides failing route |

## Rollback Plan

If env config causes boot failure: revert env vars to empty and disable the failing route via `NEXT_PUBLIC_DUAL_FLOW_ENABLED=false`. If routes crash: hide the route behind the feature flag. If the vault ABI is wrong: re-export from `forge build` output and replace artifact.

## Dependencies

- `EncryptedERC/` contracts must be deployed to Fuji — address and deployment block known
- `InterbankVault` must be deployed to Fuji — address known
- `foundry.toml` shows `CHAIN_ID=43113` (Fuji)
- `@avalabs/eerc-sdk` installed in front app

## Success Criteria

- [ ] `/veila` route compiles and renders with eERC SDK initialized using `NEXT_PUBLIC_EERC_*` vars
- [ ] `/liquidacion-avax` route compiles and renders with vault viem client initialized using `NEXT_PUBLIC_VAULT_*` vars
- [ ] `.env.example` documents both prefixes separately with non-ambiguous naming
- [ ] Env validation prints warning if `vault address == eerc address` and disables the conflicting route
- [ ] Smoke test: eERC register tx confirmed on Fuji; vault `TransferOpened` event indexed from Fuji
- [ ] No import of eerc ABI in vault flow and vice versa (static check passes)