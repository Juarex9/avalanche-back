# Indexer Stub — CNBV Event Collection

This document explains how CNBV collects and processes `TransferOpened` events from the InterbankVault on Fuji.

## Flow Overview

```
Bank → openTransfer() → TransferOpened event emitted
                              ↓
                    [Indexer collects events]
                              ↓
                    CNBV receives event data
                              ↓
                    CNBV decrypts ciphertext
                              ↓
                    CNBV verifies commitment
                              ↓
                    FinNova Safe releases funds
```

## Event Collection

The indexer reads `TransferOpened(bytes32 indexed transferId, address indexed bank, address indexed beneficiary, uint256 amount, bytes32 commitment, uint256 expiry)` events from the vault.

### Using cast (manual query)

```bash
# Query all TransferOpened events since block 0
cast logs --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
  --from-block 0 \
  --to-block latest \
  --address <VAULT_ADDRESS> \
  "TransferOpened(bytes32,address,address,uint256,bytes32,uint256)"

# Query with block range
cast logs --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
  --from-block 12345678 \
  --to-block 12345700 \
  --address <VAULT_ADDRESS> \
  "TransferOpened(bytes32,address,address,uint256,bytes32,uint256)"
```

### Using the Foundry script

```bash
# Set required env vars
export INDEXER_VAULT_ADDRESS=<your vault address>
export INDEXER_FROM_BLOCK=0

# Run the indexer stub script
forge script script/IndexerStub.s.sol \
  --rpc-url $FUJI_RPC_URL \
   -vv
```

The script will print the `cast logs` command you can use for manual event inspection.

## Event Fields

| Field | Type | Description |
|-------|------|-------------|
| `transferId` | bytes32 | Unique transfer ID (indexed) |
| `bank` | address | Bank that opened the transfer (indexed) |
| `beneficiary` | address | Final recipient on release (indexed) |
| `amount` | uint256 | AVAX amount escrowed |
| `commitment` | bytes32 | CNBV audit commitment hash |
| `expiry` | uint256 | Timestamp after which refund is allowed |

## JSON Output Format

Each event parsed has this structure:

```json
{
  "transferId": "0x...",
  "bank": "0x...",
  "beneficiary": "0x...",
  "amount": 1000000000000000000,
  "commitment": "0x...",
  "expiry": 1718000000,
  "blockNumber": 12345678,
  "blockHash": "0x...",
  "txHash": "0x..."
}
```

## Commitment Verification

CNBV decrypts the ciphertext and must verify the decrypted payload matches the on-chain `commitment` hash.

### Verify with cast

```bash
# Compute keccak256 of your decrypted payload
cast keccak <your payload hex>

# Compare with the on-chain commitment
cast call <VAULT_ADDRESS> "transfers(bytes32)(...)" <TRANSFER_ID> --rpc-url $FUJI_RPC_URL
```

### Using the script helper

```solidity
// In script/IndexerStub.s.sol
bool valid = IndexerStubScript.verifyCommitment(decryptedPayload, onChainCommitment);
```

### Commitment payload example

The commitment is computed as:

```
keccak256(abi.encode(
    bank,
    beneficiary,
    amount,
    keccak256(cnbvCiphertext),
    bankNonce,
    expiry
))
```

CNBV should use their own payload structure — the above is an example format.

## Reading Transfer State

```bash
# Get transfer state (0=None, 1=Opened, 2=Released, 3=Refunded)
cast call <VAULT_ADDRESS> "getTransferState(bytes32)(uint8)" <TRANSFER_ID> --rpc-url $FUJI_RPC_URL

# Get full transfer struct (returns: transferId, bank, beneficiary, depositor, amount, commitment, bankNonce, expiry, state)
cast call <VAULT_ADDRESS> "getTransfer(bytes32)(bytes32,address,address,address,uint256,bytes32,uint256,uint256,uint8)" <TRANSFER_ID> --rpc-url $FUJI_RPC_URL
```

## Full CNBV Workflow

1. **Collect**: Query `TransferOpened` events since last processed block
2. **Parse**: Extract fields from each event (transferId, bank, beneficiary, amount, commitment, expiry)
3. **Decrypt**: Use CNBV's private key to decrypt the ciphertext attached to the transfer
4. **Verify**: Reconstruct the commitment from decrypted payload → compare with on-chain `commitment`
5. **Audit**: Log the verified transfer for regulatory records
6. **Monitor**: Track `TransferReleased` and `TransferRefunded` events for release/refund completions

## Useful cast Commands

```bash
# Get current block number
cast block-number --rpc-url $FUJI_RPC_URL

# Get vault deploy block (first block with events)
cast logs --rpc-url $FUJI_RPC_URL \
  --from-block 0 \
  --to-block latest \
  --address <VAULT_ADDRESS> \
  "TransferOpened(bytes32,address,address,uint256,bytes32,uint256)" | head -20

# Watch for new events (poll every 10s)
watch -n10 'cast logs --rpc-url $FUJI_RPC_URL --from-block <LATEST_BLOCK> --to-block latest --address <VAULT_ADDRESS> "TransferOpened(bytes32,address,address,uint256,bytes32,uint256)"'

# Get FinNova Safe address (immutable)
cast call <VAULT_ADDRESS> "finNovaSafe()(address)" --rpc-url $FUJI_RPC_URL

# Get CNBV view pub key (immutable)
cast call <VAULT_ADDRESS> "cnbvViewPubKey()(bytes32)" --rpc-url $FUJI_RPC_URL
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `INDEXER_VAULT_ADDRESS` | Deployed InterbankVault contract address |
| `INDEXER_FROM_BLOCK` | Starting block number for event queries |
| `FUJI_RPC_URL` | Fuji RPC endpoint (default: `https://api.avax-test.network/ext/bc/C/rpc`) |