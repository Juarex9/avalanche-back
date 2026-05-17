# Deploy EncryptedERC (eERC20) — guía para el equipo

> **Testnet únicamente:** desplegar el contrato a **Avalanche Fuji** (C-Chain, `chainId` 43113).

## Repositorio oficial

- Contratos: [ava-labs/EncryptedERC](https://github.com/ava-labs/EncryptedERC)
- SDK (ya integrado en el front): [ava-labs/eerc-sdk](https://github.com/ava-labs/eerc-sdk)
- Docs: [Ava Cloud — Encrypted ERC](https://docs.avacloud.io/encrypted-erc/welcome)

## Prerrequisitos

El código **eERC** está en la carpeta **`EncryptedERC/`** (submodule en la raíz del repo):

```bash
cd EncryptedERC
npm install
```

Seguí el README de ese repo para compilar contratos y circuitos.

## Pasos de deploy (checklist)

### 1. Preparar wallets

| Rol | Uso |
|-----|-----|
| **Deployer / Owner** | Deploy del contrato; puede llamar `setContractAuditorPublicKey` |
| **Auditor (CNBV)** | Wallet que firmará `auditorDecrypt` en la UI |
| **Institución A / B** | Registro y transferencias en Cello |

Fondeá con AVAX: [faucet Fuji](https://faucet.avax.network/).

### 2. Deploy del contrato

```bash
cd EncryptedERC
npx hardhat run scripts/deploy-standalone.ts --network fuji
```

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

**Verificación en UI:** en `/registro` → nota "clave auditor en contrato: configurada".

### 4. Registro de instituciones

Cada wallet institucional debe llamar `register()` una vez (vía Cello `/registro` o script).

### 5. (Opcional) Mint privado

Si el contrato permite `privateMint` al owner, mintear saldo inicial a wallets demo para transferencias sin depósito previo.

## Entregable al frontend

Enviar al canal del equipo este bloque:

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
export RPC=https://api.avax-test.network/ext/bc/C/rpc
export CONTRACT=0x...

cast call $CONTRACT "auditor()(address)" --rpc-url $RPC
cast call $CONTRACT "owner()(address)" --rpc-url $RPC
```

## Troubleshooting

| Error | Solución |
|-------|----------|
| `areYouAuditor` false en UI | Auditor no configurado o wallet incorrecta |
| Destino no registrado | `register()` en wallet B |
| Owner no puede set auditor | Usar wallet deployer |

## Referencias

- [Guion demo](../../docs/DEMO.md)
