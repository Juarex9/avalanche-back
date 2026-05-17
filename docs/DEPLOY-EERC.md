# Deploy EncryptedERC (eERC20) — guía del equipo

> **Testnet únicamente:** desplegar el contrato a **Avalanche Fuji** (C-Chain, `chainId` 43113).

## Deploy actual (Converter Mode)

Último deploy realizado el 17/05/2026:

| Contrato | Address |
|----------|---------|
| **EncryptedERC (converter)** | `0x1941D0E27642B4F20F5fC5a0D31096EB4a729926` |
| **ERC20 subyacente** | `0x49949573b20E6bb9Cc1d1d8a5D48d036c17EA86B` |
| **Registrar** | `0x3ca3F3AB065094f7E1E35A9Ba5C87CD15D5A22A4` |
| **Owner / Deployer** | `0x79d23BB592FD230e441874d0e889C58f8FD92E07` |

## Repositorio oficial

- Contratos: [ava-labs/EncryptedERC](https://github.com/ava-labs/EncryptedERC)
- SDK (ya integrado en el front): [ava-labs/eerc-sdk](https://github.com/ava-labs/eerc-sdk)
- Docs: [Ava Cloud — Encrypted ERC](https://docs.avacloud.io/encrypted-erc/welcome)

## Prerrequisitos

```bash
cd EncryptedERC
npm install
```

## Deploy (si necesitás re-deploy)

### Standalone (owner mintea saldo)
```bash
cd EncryptedERC
npx hardhat run scripts/deploy-standalone.ts --network avalancheFuji
```

### Converter (depositar ERC20 → eERC)
```bash
cd EncryptedERC
npx hardhat run scripts/deploy-converter.ts --network avalancheFuji
```

Anotar las addresses del output.

## Configuración del frontend

En `frontend/.env.local`:

```env
# Modo converter
NEXT_PUBLIC_EERC_CONTRACT_ADDRESS=0x1941D0E27642B4F20F5fC5a0D31096EB4a729926
NEXT_PUBLIC_EERC_MODE=converter
NEXT_PUBLIC_CONVERTER_ERC20_ADDRESS=0x49949573b20E6bb9Cc1d1d8a5D48d036c17EA86B
NEXT_PUBLIC_AVALANCHE_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc
NEXT_PUBLIC_INDEXER_FROM_BLOCK=38293000
```

## Configurar auditor (owner)

El owner debe:
1. Conectar su wallet en `/registro`
2. Registrarse (si no lo hizo)
3. Ir a `/auditoria` → botón "Configurar auditor"
4. Designar la wallet del regulador

## Flujo de uso (Converter)

1. **Registro**: Cada institución se registra en `/registro` (genera clave ZK)
2. **Depósito**: En `/deposito`, convertí ERC20 → eERC
3. **Transferencias**: En `/transferencias`, enviá eERC privado a otra institución registrada
4. **Retiro**: En `/retiro`, convertí eERC → ERC20
5. **Auditoría**: El regulador designado puede descifrar montos en `/auditoria`

## Verificación on-chain

```bash
export RPC=https://api.avax-test.network/ext/bc/C/rpc
export CONTRACT=0x1941D0E27642B4F20F5fC5a0D31096EB4a729926

cast call $CONTRACT "owner()(address)" --rpc-url $RPC
cast call $CONTRACT "auditor()(address)" --rpc-url $RPC
```

## Troubleshooting

| Error | Solución |
|-------|----------|
| `areYouAuditor` false | Auditor no configurado — el owner debe ejecutar paso 4 arriba |
| Saldo eERC 0 | Depositá ERC20 en `/deposito` (modo converter) |
| Destino no registrado | La contraparte debe completar `/registro` primero |
| `Invalid amount` | Saldo insuficiente o formato incorrecto (usá punto, no coma) |
