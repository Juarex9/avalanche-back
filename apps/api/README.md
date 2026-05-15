# Avalanche API

InterbankVault MVP — Backend API + Indexer.

## Stack

- **Node.js 20** + **TypeScript**
- **Fastify** HTTP server
- **viem** for Ethereum interaction
- **better-sqlite3** for SQLite DB

## Setup

```bash
cd apps/api
npm install
cp .env.example .env
# Edit .env with VAULT_ADDRESS and API_KEYS
npm run dev
```

## Env Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VAULT_ADDRESS` | Yes | — | InterbankVault contract address |
| `RPC_URL` | No | Fuji RPC | Avalanche RPC URL |
| `CHAIN_ID` | No | 43113 | Chain ID (Fuji testnet) |
| `DATABASE_URL` | No | `./data/indexer.db` | SQLite DB path |
| `API_KEYS` | Yes | — | Comma-separated API keys |
| `PORT` | No | 8080 | HTTP server port |

## Scripts

```bash
npm run dev   # Run with tsx watch
npm run build # Compile TypeScript
npm start     # Run production
npm test      # Run vitest tests
```

## API Endpoints

### `GET /health`

Health check. Returns RPC connectivity status.

```json
{ "status": "ok", "lastBlock": 12345678 }
```

### `GET /v1/transfers`

List transfers. **Auth required** (`Authorization: Bearer <key>`).

Query params:
- `bank` — filter by bank address
- `beneficiary` — filter by beneficiary address
- `state` — `opened`, `released`, or `refunded`
- `from` — minimum opening block
- `to` — maximum opening block
- `limit` — max results (default 50, max 100)
- `cursor` — pagination cursor (block number)

```json
{
  "data": [
    {
      "transferId": "0x...",
      "bank": "0x...",
      "beneficiary": "0x...",
      "amountWei": "1000000",
      "commitment": "0x...",
      "expiry": 1735689600,
      "state": "opened",
      "openedBlock": 12345678,
      "openedTx": "0x...",
      "updatedAt": 1735689600
    }
  ],
  "nextCursor": "12345678"
}
```

### `GET /v1/transfers/:id`

Get single transfer by ID. **Auth required**.

```json
{
  "transferId": "0x...",
  "bank": "0x...",
  "beneficiary": "0x...",
  "amountWei": "1000000",
  "commitment": "0x...",
  "expiry": 1735689600,
  "state": "opened",
  "openedBlock": 12345678,
  "openedTx": "0x...",
  "updatedAt": 1735689600
}
```

Returns `404` if not found.

## Architecture

```
src/
├── index.ts          # Bootstrap: DB init, sync, Fastify start
├── config.ts        # Env loading + Config interface
├── chain/
│   ├── client.ts    # viem PublicClient
│   └── vault.abi.ts # InterbankVault ABI
├── indexer/
│   ├── sync.ts      # Event sync loop (batched eth_getLogs)
│   ├── decode.ts    # Event topic decoding
│   └── types.ts     # TransferEvent types
├── db/
│   ├── schema.sql   # SQLite schema
│   ├── repo.ts      # Transfer CRUD
│   └── cursor.ts   # Block cursor read/write
└── http/
    ├── routes.ts    # GET /health, /v1/transfers, /v1/transfers/:id
    └── auth.ts      # Bearer API key middleware
```