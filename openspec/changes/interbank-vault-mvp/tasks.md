# Tasks: InterbankVault MVP

## Review workload forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 350–550 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR1 scaffold+vault core → PR2 tests+scripts → PR3 (opcional) stub indexador |
| Delivery strategy | ask-on-risk |

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium
```

### Suggested work units

| Unit | Goal | Likely PR |
|------|------|-----------|
| 1 | Foundry + `InterbankVault` open/release/refund + eventos | PR1 |
| 2 | Tests negativos/positivos + `script/Deploy.s.sol` Fuji | PR2 |
| 3 | Stub indexador o doc API (opcional demo) | PR3 |

## Phase 1: Foundation

- [x] 1.1 Inicializar Foundry (`foundry.toml`, `src/`, `test/`, `script/`, `lib/` OZ via `forge install`).
- [x] 1.2 Fijar Solidity pragma y formatter del repo; README mínimo de build/test.
- [x] 1.3 Constantes EIP-712 (`_DOMAIN_TYPEHASH`, `TRANSFER_TYPEHASH`) y helpers `_hashTypedDataV4`.

## Phase 2: Core contract

- [x] 2.1 `InterbankVault.sol`: immutables `finNovaSafe`, `cnbvViewPubKey`; estado por `transferId`; nonces por `bank`.
- [x] 2.2 `openTransfer(...) payable`: verificar firma EIP-712, `msg.value==amount`, `expiry`, emit `TransferOpened` (+ chunks ciphertext si aplica).
- [x] 2.3 `release(transferId,to)`: `onlyFinNovaSafe`, CEI, envío AVAX a `to` igual a `beneficiary` almacenado.
- [x] 2.4 `refund(transferId)`: solo `bank`, estado Opened, `block.timestamp > expiry`, devolver AVAX.

## Phase 3: Verification

- [x] 3.1 Tests: open válido, replay nonce falla, EOA `release` revierte, refund pre-expiry revierte, happy path open→release.
- [x] 3.2 Test fork Fuji opcional: deploy + Safe real o mock `finNovaSafe` address.
- [x] 3.3 `script/Deploy.s.sol`: constructor args desde env; verificación manual en explorer.

## Phase 4: Handoff demo

- [x] 4.1 Documentar addresses Fuji y flujo Safe (1 tx ejemplo) en comentarios o README corto.
- [x] 4.2 Checklist gas: tamaño calldata eventos; ajustar chunk si falla en Fuji.

## Next

`sdd-apply` por unidad; no mergear PR2 antes de verde PR1.
