# Base de datos Neon (PostgreSQL)

Cello usa **Neon** para metadata off-chain: instituciones/KYC e índice de transacciones (**sin montos en claro**).

## Variables

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Conexión **pooler** (`-pooler` en el host) — Next.js / API routes |
| `DATABASE_URL_UNPOOLED` | Conexión **directa** — `npm run db:push` |

Copiá desde el dashboard de Neon → Connection string.

## Setup

```bash
cd frontend
# Pegar URLs en .env.local (ver .env.example)
npm install
npm run db:push    # crea tablas institutions + indexed_transfers
npm run dev --webpack
```

Verificar:

```bash
curl http://localhost:3000/api/db/health
# { "ok": true, "provider": "neon" }
```

## Tablas

- **institutions** — wallet, nombre, iniciales, `kyc_status`
- **indexed_transfers** — `tx_hash`, from/to, tipo, referencia (único por hash)

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/db/health` | Ping DB |
| GET/POST | `/api/institutions` | Listar / upsert institución |
| GET/POST | `/api/transfers` | Historial / indexar tx post-ZK |

El front indexa automáticamente tras `register` y `privateTransfer`.

## Vercel

En **Settings → Environment Variables** agregar `DATABASE_URL` (pooled).  
Tras el primer deploy, correr `db:push` desde tu máquina contra la misma DB o usar Neon SQL editor con el SQL en `drizzle/`.

## Seguridad

- Rotá la contraseña si se expuso en chat o commits.
- No uses `NEXT_PUBLIC_` para credenciales de DB.
- No guardes montos descifrados en Postgres.
