<div align="center">

# Cello — Frontend

Next.js 16 · eERC20 · Avalanche Fuji

</div>

App institucional para pagos privados con **@avalabs/eerc-sdk**. Circuitos ZK en el cliente, historial en **Neon** (sin montos en claro).

## Arranque

```bash
cp .env.example .env.local
npm install
npm run circuits:fetch
npm run dev --webpack
```

| Ruta | Descripción |
|------|-------------|
| `/` | Landing |
| `/registro` | Onboarding + `register()` |
| `/transferencias` | `privateTransfer` + historial |
| `/recibir` | Dirección para cobros |
| `/auditoria` | `auditorDecrypt()` |

## API

| Endpoint | Uso |
|----------|-----|
| `GET /api/health` | Deploy: circuitos, contrato, DB |
| `GET /api/db/health` | Neon conectada |
| `GET/POST /api/transfers` | Índice de transacciones |
| `POST /api/institutions` | Metadata institucional |

## Scripts

```bash
npm run dev --webpack
npm run build
npm run lint
npm run circuits:fetch
npm run db:push          # requiere DATABASE_URL
```

## Docs

- [docs/ENV.md](./docs/ENV.md) — variables
- [docs/DEPLOY.md](./docs/DEPLOY.md) — Vercel
- [docs/DATABASE.md](./docs/DATABASE.md) — Neon
- [../docs/DEMO.md](../docs/DEMO.md) — guion para jueces

Deploy en Vercel con **Root Directory:** `frontend`.
