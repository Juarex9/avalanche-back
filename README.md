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

**InterbankVault** — AVAX escrow contract. Banks open transfers by sending AVAX with EIP-712 authorization. FinNova's Gnosis Safe releases funds to beneficiaries. Banks can refund after expiry.

### Key features

- EIP-712 typed data signatures for bank authorization
- Per-bank nonces to prevent replay attacks
- Immutable `finNovaSafe` — only this address can call `release`
- Expiry-based refund mechanism for unused transfers

## Branch strategy

- `pr/scaffold-vault-core` — Phase 1+2 (scaffold + vault core)
- `pr/tests-deploy` — Phase 3 (tests + deploy script)
- `pr/indexer-stub` — Phase 4 (indexer stub + docs) [optional]