# Variables de entorno — frontend

Copiá `frontend/.env.example` → **`frontend/.env.local`** (local) o configurá en Vercel.

Todas las variables son `NEXT_PUBLIC_*` (expuestas al navegador). **No** pongas claves privadas ni seeds aquí.

## Tabla completa

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `NEXT_PUBLIC_AVALANCHE_FUJI_RPC` | No | RPC público Avalanche | Endpoint C-Chain Fuji. Usar RPC privado en demo en vivo si hay rate limit. |
| `NEXT_PUBLIC_EERC_CONTRACT_ADDRESS` | No* | Contrato demo Fuji del SDK | Dirección **EncryptedERC** deployado por el equipo. |
| `NEXT_PUBLIC_EERC_MODE` | No | `standalone` | `standalone` o `converter`. |
| `NEXT_PUBLIC_CONVERTER_ERC20_ADDRESS` | Si converter | Demo ERC20 Fuji | Token ERC20 subyacente en modo converter. |
| `NEXT_PUBLIC_INDEXER_FROM_BLOCK` | No | `0` | Bloque inicial para indexer futuro. |
| `NEXT_PUBLIC_DEMO_BANKAOOL` | No | — | `0x` wallet demo contraparte (autocomplete en transferencias). |
| `NEXT_PUBLIC_DEMO_FINNOVA` | No | — | Idem FinNova. |
| `NEXT_PUBLIC_DEMO_RUTALOG` | No | — | Idem RutaLog. |
| `NEXT_PUBLIC_AUDITOR_PREVIEW_SECRET` | No | — | Contraseña UI para `/auditoria` en demos públicas. **No usar en prod.** |

\*Sin `NEXT_PUBLIC_EERC_CONTRACT_ADDRESS` la app usa contratos de referencia en Fuji documentados en `src/lib/eerc-config.ts`.

## Contratos demo (sin env)

| Modo | Dirección |
|------|-----------|
| Standalone | `0x5E9c6F952fB9615583182e70eDDC4e6E4E0aC0e0` |
| Converter | `0x372dAB27c8d223Af11C858ea00037Dc03053B22E` |

## Plantilla post-deploy (rellenar con el back)

```env
NEXT_PUBLIC_AVALANCHE_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc
NEXT_PUBLIC_EERC_CONTRACT_ADDRESS=0x________________________
NEXT_PUBLIC_EERC_MODE=standalone
NEXT_PUBLIC_INDEXER_FROM_BLOCK=
NEXT_PUBLIC_DEMO_BANKAOOL=0x________________________
NEXT_PUBLIC_DEMO_FINNOVA=0x________________________
NEXT_PUBLIC_DEMO_RUTALOG=0x________________________
```

## Qué envía el equipo de contratos

Ver [docs/DEPLOY.md](../../docs/DEPLOY.md) — handoff front ↔ back.

## Seguridad

- La **clave de descifrado** del usuario se guarda en `sessionStorage` (navegador), no en env.
- La **clave auditor** vive en el contrato; solo la wallet auditor ejecuta `auditorDecrypt`.
- `NEXT_PUBLIC_AUDITOR_PREVIEW_SECRET` solo oculta la UI en demos; no reemplaza auth real del auditor.
