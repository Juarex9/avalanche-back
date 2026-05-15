# Plan de diseño — Backend (API + indexación)

Documento de diseño para el servicio que vive **en este repo** (`avalanche`), mientras el **front permanece en otro repo**. Objetivo: soportar el flujo **híbrido** (wallet → RPC; panel CNBV / reportes → API).

## 1. Objetivos y no-objetivos

### Objetivos (MVP hackathon)

- **Indexar** eventos del `InterbankVault` en Fuji (y luego C-Chain si aplica): `TransferOpened`, `TransferReleased`, `TransferRefunded`.
- Exponer **HTTP JSON** estable para que el front del regulador (o un panel interno) liste y filtre transferencias **sin** exponer la API key del proveedor RPC en el navegador.
- Mantener un **cursor de bloque** (último bloque procesado) para reanudar sin reprocesar mal.
- Opcional MVP: **lecturas enriquecidas** (`getTransfer` on-chain) para estado actual si hace falta reconciliar con el índice.

### No-objetivos (fase posterior)

- Firmar transacciones en nombre del usuario (eso sigue en wallet / relayer aparte).
- Custodiar claves privadas del banco o de CNBV en el servidor (solo **material de auditoría** que ya sea público en logs o que el banco envíe por canal aparte si el modelo lo define).
- Motor de descifrado CNBV completo en servidor sin threat model (si existe ciphertext sensible, documentar quién lo toca y dónde se guarda).

## 2. Contexto on-chain (fuente de verdad)

Contrato: `InterbankVault` (`src/InterbankVault.sol`).

| Evento | Uso en backend |
|--------|----------------|
| `TransferOpened(transferId, bank, beneficiary, amount, commitment, expiry)` | Insertar fila “abierta”; claves de índice por `bank`, `beneficiary`, rango de tiempo. |
| `TransferReleased(transferId, to, amount)` | Marcar liberada; validar consistencia con fila abierta. |
| `TransferRefunded(transferId, to, amount)` | Marcar reembolsada. |

**Nota de producto:** hoy el contrato **no** emite ciphertext CNBV en el evento (solo `commitment` on-chain). El backend puede: (a) servir lo on-chain tal cual para auditoría de **montos y partes**; (b) cuando exista ciphertext en logs o canal auxiliar, el diseño de ingestión se amplía (chunks, tabla `audit_payloads`). Complemento: [`docs/INDEXER.md`](INDEXER.md).

## 3. Arquitectura lógica

```
                    ┌─────────────────┐
  RPC Fuji (key)    │     Backend     │     HTTPS + auth
 ──────────────────►│  worker + API  │◄──────────────────  Front regulador
                    │  SQLite/Postgres│                      (otro repo)
                    └────────┬────────┘
                             │
                     ABI desde forge `out/`
```

- **Worker** (proceso batch o cron): `eth_getLogs` por rangos de bloques, decode topics/data, upsert DB.
- **API** (mismo proceso o separado): lecturas desde DB + opcionalmente `eth_call` puntual al vault.

## 4. Stack recomendado (elegir uno y congelar)

| Opción | Pros | Contras |
|--------|------|---------|
| **Node 20 + TypeScript + viem** | Mismo ecosistema que muchos fronts; `viem` decode logs excelente. | Runtime Node en deploy. |
| **Go + go-ethereum** | Binario único, muy estable para indexers. | Más tiempo si el equipo no domina Go. |

**Recomendación default:** **Node + TypeScript + viem + Fastify** (o Hono) — alinea con el front en JS y reduce fricción.

## 5. Estructura de carpetas (en este repo)

Propuesta sin mover el front:

```text
avalanche/
  src/                    # Solidity (Foundry) — sin cambiar
  apps/
    api/
      package.json
      tsconfig.json
      src/
        config.ts         # env: RPC_URL, VAULT_ADDRESS, CHAIN_ID, API_KEYS
        chain/
          client.ts       # viem publicClient
          vaultAbi.ts     # copiado o generado desde `out/`
        indexer/
          sync.ts         # bucle / job: fromBlock → toBlock
          decode.ts
        db/
          schema.sql | migrations
          repo.ts
        http/
          routes.ts
          auth.ts
      README.md
```

**ABI:** script `apps/api/scripts/copy-abi.mjs` que lea `../out/InterbankVault.sol/InterbankVault.json` y escriba `apps/api/src/abi/InterbankVault.ts` (o JSON importado). Documentar en README del API: ejecutar después de `forge build`.

## 6. Modelo de datos (MVP)

Tabla `transfers` (nombre ajustable):

| Columna | Tipo | Origen |
|---------|------|--------|
| `transfer_id` | `TEXT` PK | `bytes32` hex |
| `bank` | `TEXT` | evento |
| `beneficiary` | `TEXT` | evento |
| `amount_wei` | `TEXT` | uint256 como string |
| `commitment` | `TEXT` | bytes32 hex |
| `expiry` | `BIGINT` | timestamp unix |
| `depositor` | `TEXT` nullable | `eth_call getTransfer` si se necesita en UI (no está en evento Opened) |
| `state` | `TEXT` | derivado: `opened` / `released` / `refunded` |
| `opened_block` | `BIGINT` | log blockNumber |
| `opened_tx` | `TEXT` | tx hash |
| `updated_at` | timestamp | — |

Tabla `indexer_cursor`:

| Columna | Valor |
|---------|--------|
| `key` | `vault` |
| `last_block` | último bloque inclusive procesado |

**Consistencia:** si llega `Released` sin fila `Opened` (reorg raro), política: insert stub o log error + alerta; MVP puede **skip** reorgs profundos y documentar “Fuji demo”.

## 7. API HTTP (borrador de contrato)

Prefijo `/v1`. Formato JSON, errores `{ "error": { "code", "message" } }`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Liveness (y opcional check RPC). |
| `GET` | `/v1/transfers` | Query: `?bank=&beneficiary=&from=&to=&state=&limit=&cursor=` |
| `GET` | `/v1/transfers/:transferId` | Detalle + último estado. |
| `GET` | `/v1/stats/summary` | Opcional: conteos por estado para dashboard. |

**Auth (MVP):** header `Authorization: Bearer <API_KEY>` rotada en `.env` del servidor; solo el front del regulador (o túnel dev) recibe esa key vía **env de build**, no en repo público. Fase 2: JWT corto, mTLS, o IP allowlist detrás de VPN.

**CORS:** permitir origen del front de producción y `localhost` en dev.

## 8. Variables de entorno (backend)

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `RPC_URL` | sí | URL con **clave** (Alchemy/Infura/etc.); nunca en el browser. |
| `VAULT_ADDRESS` | sí | Mismo contrato desplegado. |
| `CHAIN_ID` | sí | `43113` Fuji. |
| `INDEXER_FROM_BLOCK` | sí | Bloque de deploy del vault (o 0 en primera corrida controlada). |
| `DATABASE_URL` | opcional | SQLite file `./data/indexer.db` por defecto. |
| `API_KEYS` | recomendada | Lista separada por comas o un solo `API_KEY`. |
| `PORT` | opcional | `8080`. |

El **front en otro repo** solo necesita `VITE_PUBLIC_API_URL` (o equivalente) apuntando a este servicio y **no** la `API_KEY` si el panel CNBV es server-rendered; si el panel es 100 % browser, la key **se filtra** — en ese caso MVP: **proxy** en el mismo dominio del front o **BFF** mínimo. Documentar esta decisión en el README del front.

## 9. Seguridad y operación

- Rate limit por IP en rutas públicas (si alguna ruta queda sin auth en demo).
- Logs sin datos clasificados innecesarios; `commitment` y addresses son públicos on-chain.
- Timeouts cortos al RPC; reintentos exponenciales.
- Imagen Docker opcional para deploy en hackathon (Railway, Fly, etc.).

## 10. Fases de implementación

1. **Fase A — Esqueleto:** proyecto `apps/api`, healthcheck, `viem` lee último bloque.
2. **Fase B — Indexer:** tabla + cursor; sync `TransferOpened`; backfill desde `INDEXER_FROM_BLOCK`.
3. **Fase C — API:** list + get con filtros y auth por API key.
4. **Fase D — Eventos finales:** ingest `Released` / `Refunded`; actualizar `state`.
5. **Fase E — Integración front:** documento `INTEGRATION.md` con URL, headers, ejemplo `curl`; contrato OpenAPI opcional.

## 11. Criterios de “listo para demo”

- Desde cero bloque hasta último: no duplicar `transfer_id` (PK).
- `GET /v1/transfers` devuelve las mismas filas que se ven en el explorador para las mismas txs de prueba.
- Panel o `curl` autenticado muestra al menos una transferencia de prueba end-to-end (open → release o refund).

## 12. Referencias en repo

- Contrato y eventos: `src/InterbankVault.sol`
- Flujo manual de logs: `docs/INDEXER.md`
- Deploy y env de contrato: `.env.example` (raíz Foundry)

---

**Próximo paso de ejecución:** crear `apps/api` con Fase A–B y un `README.md` que explique `pnpm install`, `forge build`, copia de ABI y `pnpm dev`.
