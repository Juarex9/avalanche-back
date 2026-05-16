# Delta for dual-flow-env-config

## ADDED Requirements

### Requirement: Boot-time address distinctness assertion

The app MUST assert `NEXT_PUBLIC_EERC_CONTRACT_ADDRESS != NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS` at boot. If both addresses are set and equal, the app MUST print a console warning: "WARNING: EERC and Vault addresses are identical — flows are not independent" and SHOULD disable the conflicting flow via `NEXT_PUBLIC_DUAL_FLOW_ENABLED=false`.

### Requirement: Documented env prefix sets

`.env.example` MUST document two distinct prefix groups:
- `NEXT_PUBLIC_EERC_*` vars with comment "eERC flow only"
- `NEXT_PUBLIC_VAULT_*` vars with comment "Vault flow only"

### Requirement: Independent env loading

Each flow's env vars MUST be loadable independently. Enabling one flow MUST NOT require the other flow's vars to be set.

#### Scenario: Env validation catches duplicate address

- GIVEN both EERC and VAULT env vars are set to the same address
- WHEN the app boots or validation runs
- THEN a console warning is printed: "WARNING: EERC and Vault addresses are identical — flows are not independent"
- AND the conflicting flow SHOULD be disabled via feature flag