# Delta for dual-flow-front-routes

## ADDED Requirements

### Requirement: /veila route uses eERC SDK exclusively

Route `/veila` MUST initialize and use the `@avalabs/eerc-sdk` client with `NEXT_PUBLIC_EERC_CONTRACT_ADDRESS`. The route MUST NOT import, reference, or otherwise couple to any vault ABI, viem vault client, or `NEXT_PUBLIC_VAULT_*` variables.

### Requirement: /liquidacion-avax route uses viem/wagmi vault client exclusively

Route `/liquidacion-avax` MUST initialize a viem/wagmi client using the vault ABI and `NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS`. The route MUST NOT import, reference, or otherwise couple to `@avalabs/eerc-sdk`, eerc ABI, or `NEXT_PUBLIC_EERC_*` variables.

### Requirement: Independent compilation and loading

Both routes MUST compile and render independently when `NEXT_PUBLIC_DUAL_FLOW_ENABLED=true`. Disabling one flow MUST NOT prevent the other from compiling.

### Requirement: UI clearly labels flow identity

Each route MUST render a visible label identifying which flow is active:
- `/veila`: "Transferencia privada Veila"
- `/liquidacion-avax`: "Liquidación AVAX"

#### Scenario: eERC route loads with valid config

- GIVEN dual-flow feature flag is enabled and eerc address is set
- WHEN user navigates to /veila
- THEN page renders with eERC SDK initialized and displays "Transferencia privada Veila"

#### Scenario: Vault route loads with valid config

- GIVEN dual-flow feature flag is enabled and vault address is set
- WHEN user navigates to /liquidacion-avax
- THEN page renders with viem client and displays "Liquidación AVAX"

#### Scenario: eERC route hidden when disabled

- GIVEN NEXT_PUBLIC_DUAL_FLOW_ENABLED=false OR eerc address is not set
- WHEN user navigates to /veila
- THEN page shows "Flow no disponible" or redirects to /

#### Scenario: Vault route hidden when disabled

- GIVEN NEXT_PUBLIC_DUAL_FLOW_ENABLED=false OR vault address is not set
- WHEN user navigates to /liquidacion-avax
- THEN page shows "Flow no disponible" or redirects to /