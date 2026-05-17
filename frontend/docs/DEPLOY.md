# Deploy del frontend Cello

## Requisitos

- Node.js **20+**
- Cuenta [Vercel](https://vercel.com) (o cualquier host que soporte Next.js 16 + webpack)

## Setup local

```bash
cd frontend
cp .env.example .env.local
npm install
npm run circuits:fetch    # si public/circuits/ está vacío
npm run dev --webpack
```

Build de producción:

```bash
npm run build    # usa next build --webpack (ver package.json)
npm run start
```

## Deploy en Vercel

1. **Import** del repo; **Root Directory** = `frontend`
2. **Framework Preset** = Next.js
3. **Build Command** (default o explícito):

   ```bash
   npm run build
   ```

   Los circuitos ZK deben existir en `public/circuits/`. Opciones:

   - **Recomendado (hackathon):** commitear `public/circuits/` en Git → build más rápido
   - **Alternativa:** Build Command = `npm run circuits:fetch && npm run build`

4. **Install Command:** `npm install`
5. Pegar variables de [ENV.md](./ENV.md) en *Settings → Environment Variables*
6. Deploy → abrir `https://<tu-app>/api/health`

## Health check

```bash
curl https://<tu-app>/api/health
```

Respuesta esperada:

```json
{
  "ok": true,
  "chain": "avalanche-fuji",
  "chainId": 43113,
  "contract": "0x...",
  "eercEnvConfigured": true,
  "circuits": true,
  "timestamp": "..."
}
```

## Scripts npm

| Script | Descripción |
|--------|-------------|
| `npm run dev --webpack` | Desarrollo (webpack requerido por eerc-sdk) |
| `npm run build` | Producción |
| `npm run start` | Servir build |
| `npm run lint` | ESLint |
| `npm run circuits:fetch` | Descarga WASM/ZKEY a `public/circuits/` |

## Configuración Next.js

- `next.config.ts`: `transpilePackages: @avalabs/eerc-sdk`, webpack + polyfills (`crypto-browserify`)
- El build **debe** usar webpack (`--webpack`), no solo Turbopack, por WASM/ZK

## Checklist post-deploy

- [ ] `/` landing carga
- [ ] `/api/health` → `circuits: true`
- [ ] Barra de estado: contrato + Fuji en verde
- [ ] Registro completa con tx en Snowtrace
- [ ] Transferencia entre dos wallets registradas
- [ ] Auditoría con wallet auditor

## CI

GitHub Actions en `.github/workflows/ci.yml` valida build + lint en cada push/PR.
