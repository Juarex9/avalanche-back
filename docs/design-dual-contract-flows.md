# Diseño — Dos flujos on-chain (eERC + InterbankVault)

**Decisión:** la app consume **dos contratos** en **dos flujos separados** (misma red, misma wallet puede operar en ambos). No se fusionan en un solo contrato; la **orquestación** vive en front (y opcionalmente backend).

**Quién se beneficia:** equipo producto + front + backend; reduce ambigüedad sobre qué dirección y qué SDK usar en cada pantalla.

### Política de despliegue (MVP)

- **Solo testnet** (p. ej. **Avalanche Fuji**, C-Chain `43113`): todas las direcciones que consumen front, API e indexador deben ser de **contratos desplegados en testnet**.
- **Nada en red local** como destino oficial: no Anvil / Hardhat node / cadena local para el entrega demo — compilación y tests pueden correr en máquina, pero **las addresses de producción del MVP son testnet únicamente**.

---

## Monorepo: carpeta `EncryptedERC/`

En este workspace el clone suele vivir en **raíz del repo**, junto a Foundry:

| Ruta | Rol |
|------|-----|
| [`../EncryptedERC/`](../EncryptedERC/) | Contratos eERC (Hardhat), Circom, `scripts/deploy-standalone.ts`, tests — **fuente para build y deploy** del flujo A. |
| [`../src/InterbankVault.sol`](../src/InterbankVault.sol) | Contrato vault (Foundry) — **fuente** del flujo B. |

**Importante:** son **dos toolchains** distintos (npm/Hardhat vs `forge` en la raíz). El plan dual **no** mezcla compilación: deploy eERC desde `EncryptedERC/`; deploy vault desde `script/Deploy.s.sol` en la raíz. El front solo necesita **direcciones** on-chain resultantes + SDK eERC + ABI vault.

---

## Quick path

1. **Desplegar / fijar** en **testnet (Fuji)** dos direcciones: contrato **standalone** desde [`EncryptedERC/`](../EncryptedERC/) e `InterbankVault` con Foundry. Guías: [`DEPLOY-EERC.md`](./DEPLOY-EERC.md) y README raíz (Fuji). *(La carpeta `EncryptedERC/` es código en disco; la red destino sigue siendo testnet, no anvil.)*
2. **Variables de entorno duplicadas por dominio:** prefijos claros (`NEXT_PUBLIC_EERC_*` vs `NEXT_PUBLIC_VAULT_*` o equivalente server-side) — **nunca** reutilizar la misma key para ambas.
3. **Router o módulos:** Flujo A (Veila / eERC SDK) y Flujo B (vault / viem o wagmi directo al ABI del vault).
4. **Verificar:** una tx de registro o transfer eERC; otra de `openTransfer` / lectura de eventos vault según demo.

---

## Alcance y límites

| En alcance | Fuera de alcance (MVP dual) |
|------------|------------------------------|
| Dos clientes contractuales en la misma app | Un solo “supercontrato” que encapsule ambos |
| UX que explique qué flujo es cuál | Liquidez automática entre eERC y AVAX del vault |
| Env, ABIs y rutas separadas | Unificar indexador en DB sin diseño explícito (ver fases) |
| Contratos desplegados **solo en testnet** (Fuji) | Red local (Anvil, etc.) como red “oficial” del MVP |
| Panel CNBV / auditor: reglas de qué datos se muestran por flujo | Motor completo de descifrado en servidor sin threat model |

---

## Flujo A — EncryptedERC (eERC20 / Veila)

| Aspecto | Detalle |
|---------|---------|
| **Rol de producto** | Transferencias con privacidad de balances; **auditor** on-chain según protocolo eERC. |
| **Cliente** | `@avalabs/eerc-sdk` + dirección del contrato desplegado (build/deploy desde carpeta local [`EncryptedERC/`](../EncryptedERC/) o clone aparte del [repo oficial](https://github.com/ava-labs/EncryptedERC)). |
| **Config típica** | `NEXT_PUBLIC_EERC_CONTRACT_ADDRESS`, `NEXT_PUBLIC_EERC_MODE=standalone`, bloque de deploy para indexación futura. |
| **Operaciones** | `register`, transferencias privadas, mint/burn según política del contrato; `setContractAuditorPublicKey` (owner). |
| **Backend en este monorepo** | Hoy **no** indexa eERC; ver [fase B](#fases-de-implementación-sugeridas). |

---

## Flujo B — InterbankVault (AVAX + EIP-712 + Safe)

| Aspecto | Detalle |
|---------|---------|
| **Rol de producto** | Escrow de **AVAX nativo**; apertura con firma banco; **solo** `finNovaSafe` puede `release`; `refund` al depositor tras expiración. |
| **Cliente** | `viem` / wagmi con ABI del vault (`apps/api/src/chain/vault.abi.ts` o artefacto Foundry `out/`). |
| **Config típica** | `INDEXER_VAULT_ADDRESS` / `VAULT_ADDRESS` (API); front: misma dirección bajo prefijo vault. |
| **Eventos** | `TransferOpened`, `TransferReleased`, `TransferRefunded` — indexados por `apps/api` (ver [`backend-design.md`](./backend-design.md), [`INDEXER.md`](./INDEXER.md)). |
| **Montos** | Visibles on-chain en eventos (a diferencia del modelo de saldo cifrado eERC). |

---

## Arquitectura lógica (una app, dos fuentes)

```
                    ┌─────────────────────────────────────┐
                    │           Aplicación (front)         │
                    │  ┌──────────────┐ ┌──────────────┐  │
                    │  │ Flujo A eERC │ │ Flujo B Vault│  │
                    │  │ eerc-sdk     │ │ viem + ABI   │  │
                    │  └──────┬───────┘ └──────┬───────┘  │
                    └─────────┼───────────────┼──────────┘
                              │               │
                              ▼               ▼
                     EncryptedERC      InterbankVault
                     (C-Chain)          (C-Chain)

 Opcional:          ┌─────────────────────────────────────┐
 panel / informes  │  apps/api (indexador vault hoy)      │
 ─────────────────►│  SQLite + GET /v1/transfers          │
                    └─────────────────────────────────────┘
```

- **Wallet y RPC:** pueden ser los mismos para ambos flujos (`CHAIN_ID`, `RPC_URL`).
- **Claves y roles:** distintos — owner/auditor eERC vs banco/firmante EIP-712 vs operador del Safe en vault.

---

## Modelo de datos y auditoría (producto)

Objetivo de negocio: **empresas eligen qué auditar** ante CNBV.

| Capa | Qué registrar |
|------|----------------|
| **eERC** | Eventos y hashes que el SDK/contrato expongan; políticas de quién puede pedir vistas de auditor (`auditorDecrypt` en UI, etc.). |
| **Vault** | Filas indexadas por `transfer_id`, `bank`, `beneficiary`, `amount_wei`, `commitment`, estado — ya alineado con el indexador actual. |
| **Producto** | Matriz “tipo de flujo × rol (CNBV / banco / empresa)” × “dato visible / solo commitment / descifrado bajo solicitud”. Documentar en UX copy, no solo en código. |

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Usuario confunde AVAX con “token Veila” | Nombres de pantalla, iconos y textos fijos (“Liquidación AVAX” vs “Saldo cifrado eERC”). |
| Misma env mal copiada | Validación al boot: checksum de dos direcciones distintas; assert `vault != eerc`. |
| Doble mantenimiento de ABI | Vault: una fuente de verdad (`forge build` → copia ABI); eERC: tipos desde SDK / artifact EncryptedERC. |
| Seguridad API | API key solo server-to-server; flujo eERC sigue principalmente en wallet + RPC público limitado. |

---

## Fases de implementación sugeridas

### Fase 1 — Front dual (mínimo viable)

- [ ] Rutas o secciones: `/veila` (o nombre acordado) y `/liquidacion-avax` (ejemplo).
- [ ] Env con prefijos no ambiguos; documentar en `.env.example` del front.
- [ ] Sin obligar backend: lecturas on-chain del vault desde el front si hace falta demo puntual.
- [ ] Contrato eERC desplegado desde `EncryptedERC/` (ej. `npx hardhat run scripts/deploy-standalone.ts --network …` según su README); anotar address y bloque para el front.

### Fase 2 — Backend alineado al producto

- [ ] API existente sigue sirviendo **solo vault** (sin romper `VAULT_ADDRESS`).
- [ ] Si el panel CNBV necesita eERC: diseñar endpoints o jobs separados (`/v1/eerc/...` o microservicio) + ABI/eventos EncryptedERC — **no** mezclar tablas con PK `transfer_id` del vault sin prefijo `flow_type`.

### Fase 3 — Informes y políticas

- [ ] Exportes / filtros “por flujo”; logs de acceso si hay datos sensibles en servidor.
- [ ] Runbook deploy: [`DEPLOY-EERC.md`](./DEPLOY-EERC.md) + README vault en misma checklist de release.

---

## Checklist de revisión (PR / demo)

- [ ] Todas las direcciones on-chain son de **testnet** (p. ej. Fuji), no Anvil/local.
- [ ] Las dos direcciones on-chain están documentadas y son distintas.
- [ ] El flujo eERC no importa ABI del vault salvo pantalla cruzada explícita.
- [ ] El flujo vault no usa `NEXT_PUBLIC_EERC_CONTRACT_ADDRESS`.
- [ ] Demo grabada o guion: dos historias de usuario, una por flujo.

---

## Referencias en repo

| Documento | Uso |
|-----------|-----|
| [`../EncryptedERC/README.md`](../EncryptedERC/README.md) | Build, tests y scripts de deploy eERC (Hardhat) |
| [`DEPLOY-EERC.md`](./DEPLOY-EERC.md) | Deploy y env EncryptedERC (checklist equipo) |
| [`backend-design.md`](./backend-design.md) | API + indexador vault |
| [`INDEXER.md`](./INDEXER.md) | CNBV / `cast logs` vault |
| [`../README.md`](../README.md) | Contratos Foundry + deploy Fuji vault |

---

## Próximo paso

Implementar **Fase 1** en el repo del front: rutas, env y smoke test en Fuji. Si el indexador debe ver eERC, abrir issue o sub-tarea con eventos concretos del contrato desplegado (bloque desde deploy).
