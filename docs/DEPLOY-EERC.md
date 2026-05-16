# Deploy EncryptedERC (eERC20) — guía para el equipo de contratos

> **Testnet únicamente:** desplegar el contrato a **Avalanche Fuji** (u otra testnet acordada). No usar Anvil/red local como destino del MVP para addresses que consuma el front.

> **Producto Veila (hackathon):** el frontend usa **EncryptedERC** vía `@avalabs/eerc-sdk`.  
> El contrato **InterbankVault** en este repo es legacy (escrow AVAX); no lo uses para Veila salvo demo paralela.

## Repositorio oficial

- Contratos: [ava-labs/EncryptedERC](https://github.com/ava-labs/EncryptedERC)
- SDK (ya integrado en el front): [ava-labs/eerc-sdk](https://github.com/ava-labs/eerc-sdk)
- Docs: [Ava Cloud — Encrypted ERC](https://docs.avacloud.io/encrypted-erc/welcome)

## Prerrequisitos

```bash
# Foundry (solo si también compilás InterbankVault en la raíz del monorepo)
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Código **eERC**: si ya tenés la carpeta **`EncryptedERC/`** en la raíz del monorepo, `cd EncryptedERC` y seguí su README (**npm / Hardhat**). Si no, cloná el repo aparte:

```bash
git clone https://github.com/ava-labs/EncryptedERC.git
cd EncryptedERC
```

Seguí el README de ese repo para instalar dependencias, compilar y deploy en **Avalanche Fuji** (C-Chain, `chainId` 43113).

## Pasos de deploy (checklist)

### 1. Preparar wallets

| Rol | Uso |
|-----|-----|
| **Deployer / Owner** | Deploy del contrato; puede llamar `setContractAuditorPublicKey` |
| **Auditor (CNBV)** | Wallet que firmará `auditorDecrypt` en la UI |
| **Institución A / B** | Registro y transferencias en Veila |

Fondeá con AVAX: [faucet Fuji](https://faucet.avax.network/).

### 2. Deploy del contrato

- Modo recomendado para hackathon: **standalone** eERC (nombre/símbolo propios)
- Anotar:
  - `CONTRACT_ADDRESS`
  - `DEPLOY_BLOCK`
  - `OWNER_ADDRESS`
  - `AUDITOR_ADDRESS`

### 3. Configurar auditor

Solo el **owner** puede ejecutar:

```text
setContractAuditorPublicKey(<auditorAddress>)
```

La clave pública del auditor debe alinearse con el protocolo eERC (ver docs del contrato / SDK).

**Verificación en UI:** en `/registro` → nota “clave auditor en contrato: configurada”.

### 4. Registro de instituciones

Cada wallet institucional debe llamar `register()` una vez (vía Veila `/registro` o script).

### 5. (Opcional) Mint privado

Si el contrato permite `privateMint` al owner, mintear saldo inicial a wallets demo para transferencias sin depósito previo.

## Entregable al frontend

Enviar al canal del equipo (Slack/issue) este bloque:

```env
# Pegar en Vercel / frontend/.env.local
NEXT_PUBLIC_EERC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_EERC_MODE=standalone
NEXT_PUBLIC_INDEXER_FROM_BLOCK=<deploy_block>
NEXT_PUBLIC_DEMO_BANKAOOL=0x...    # wallet A registrada
NEXT_PUBLIC_DEMO_FINNOVA=0x...     # wallet B registrada
```

## Verificación on-chain

```bash
# Ejemplo con cast (ajustar ABI y RPC)
export RPC=https://api.avax-test.network/ext/bc/C/rpc
export CONTRACT=0x...

cast call $CONTRACT "auditor()(address)" --rpc-url $RPC
cast call $CONTRACT "owner()(address)" --rpc-url $RPC
```

## Indexer (fase 2)

El front aún no lista historial on-chain completo. Para indexar:

1. `INDEXER_FROM_BLOCK` = bloque de deploy
2. Escuchar eventos del contrato EncryptedERC (ver ABI en repo Ava Labs)
3. Exponer API REST o pasar hashes al front para `decryptTransaction`

Stub legacy de vault: [INDEXER.md](./INDEXER.md) (solo InterbankVault).

## InterbankVault (legacy en este repo)

Si necesitás el vault AVAX + EIP-712:

```bash
cd avalanche-back
cp .env.example .env
forge build && forge test
# Ver README.md raíz de avalanche-back
```

Variables: `PRIVATE_KEY`, `FIN_NOVA_SAFE`, `CNBV_VIEW_PUB_KEY`, etc.

**No** mezclar dirección del vault con `NEXT_PUBLIC_EERC_CONTRACT_ADDRESS` del front.

## Troubleshooting

| Error | Solución |
|-------|----------|
| `areYouAuditor` false en UI | Auditor no configurado o wallet incorrecta |
| Destino no registrado | `register()` en wallet B |
| Owner no puede set auditor | Usar wallet deployer |
| OpenZeppelin vacío | `git submodule update --init --recursive` en avalanche-back |

## Referencias

- [Diseño: dos flujos (eERC + InterbankVault)](./design-dual-contract-flows.md)
- [Deploy checklist coordinado](../../docs/DEPLOY.md)
- [Guion demo](../../docs/DEMO.md)
