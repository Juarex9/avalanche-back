# InterbankVault MVP

Smart contract escrow for interbank AVAX transfers with EIP-712 authorization and Gnosis Safe custody.

## Stack

- [Foundry](https://getfoundry.sh/) — Solidity development framework
- Solidity `^0.8.28`
- OpenZeppelin Contracts v5

## Setup

```bash
# Install dependencies (already done: OZ in lib/)
forge install

# Build contracts
forge build

# Run tests
forge test

# Format code
forge fmt
```

## Contract Overview

**InterbankVault** — AVAX escrow contract. Un banco autoriza con **EIP-712**; quien envía el AVAX en `openTransfer` es el **`depositor`** (banco o relayer). Tras expiración, **solo el `depositor`** puede `refund`. El **Safe** de FinNova ejecuta `release` y el destino **debe** ser el `beneficiary` firmado.

### Key features

- **OpenZeppelin ECDSA** (`tryRecover`) on EIP-712 digests: rechaza firmas **maleables (high-s)** y `v` inválidos
- **Custom errors** en todos los reverts (menos bytecode que strings largos)
- EIP-712 typed data signatures for bank authorization
- Per-bank nonces to prevent replay attacks
- **`depositor`** recorded per transfer — refunds return to whoever funded the escrow (fixes relayer vs bank accounting)
- Immutable `finNovaSafe` — only this address can call `release`; `release` enforces `to == beneficiary`
- Expiry-based refund for unused transfers

## Branch strategy

- `pr/scaffold-vault-core` — Phase 1+2 (scaffold + vault core)
- `pr/tests-deploy` — Phase 3 (tests + deploy script)
- `pr/indexer-stub` — Phase 5 (indexer stub + docs) ✅

## Indexer stub (Phase 5)

CNBV uses `script/IndexerStub.s.sol` and `docs/INDEXER.md` to:
- Query `TransferOpened` events via `cast logs`
- Parse event data for decryption
- Verify commitments against on-chain hashes

See [docs/INDEXER.md](docs/INDEXER.md) for full workflow.

## Fuji deployment

```bash
# 1. Copy and fill in environment variables
cp .env.example .env

# 2. Deploy to Fuji
forge script script/Deploy.s.sol \
  --rpc-url $FUJI_RPC_URL \
  --broadcast \
  -vv
```

The deploy script reads:
- `PRIVATE_KEY` — deployer key with AVAX on Fuji
- `FIN_NOVA_SAFE` — FinNova Gnosis Safe address (authorized to call `release`)
- `CNBV_VIEW_PUB_KEY` — CNBV view public key (bytes32)

### Typical Safe release flow (manual)

1. Bank calls `openTransfer` on-chain with signed payload and AVAX
2. FinNova Safe operator reviews the transfer via the CNBV view key
3. FinNova executes `release(transferId, beneficiary)` from the Safe multisig
4. Beneficiary receives AVAX directly

### Gas notes

- `TransferOpened` event: ~4 fields + indexed transferId + 2 addresses
- `TransferReleased` event: ~3 fields
- `TransferRefunded` event: ~3 fields
- No chunking needed at MVP scale; monitor calldata if >200 transfers/day