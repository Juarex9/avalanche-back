# Cello — Privacidad financiera con auditoría regulatoria

> Demo de transferencias privadas entre instituciones usando **EncryptedERC (eERC20)** en Avalanche Fuji.  
> El regulador (CNBV) posee una llave maestra para descifrar montos bajo solicitud legal.

## Qué demuestra

| Pantalla | Qué hace |
|----------|----------|
| `/registro` | Institución se registra on-chain con prueba ZK |
| `/transferencias` | Transferencia privada — monto cifrado, invisible para terceros |
| `/auditoria` | **Solo la wallet auditor designada** puede ver montos en claro |
| `/recibir` | Dirección pública para cobros sin revelar saldo |

## Stack

- **Frontend**: Next.js 16 + `@avalabs/eerc-sdk` + wagmi/viem
- **Contratos**: EncryptedERC (Hardhat, submodule `EncryptedERC/`)
- **Red**: Avalanche Fuji (testnet)
- **ZK**: Circom + snarkJS (proofs generados en el browser)

## Estructura

```
EncryptedERC/          # Contratos eERC20 (submodule Ava Labs)
frontend/              # App Next.js (registro, transferencias, auditoría)
docs/
  DEPLOY-EERC.md      # Guía de deploy en Fuji
  DEMO.md             # Guion para demo / jurados
```

## Deploy rápido (Fuji)

Ver [`docs/DEPLOY-EERC.md`](docs/DEPLOY-EERC.md) para checklist completo.

## Demo

Flujo sugerido para jurados:

1. **Registro**: Wallet institucional A se registra en `/registro` (genera clave ZK on-chain)
2. **Transferencia privada**: En `/transferencias`, A envía tokens a B — el monto es cifrado
3. **Auditoría**: En `/auditoria`, la wallet del regulador (CNBV) descifra todos los montos

## Referencias

- [EncryptedERC — repo oficial](https://github.com/ava-labs/EncryptedERC)
- [eerc-sdk — repo oficial](https://github.com/ava-labs/eerc-sdk)
- [Docs Ava Cloud](https://docs.avacloud.io/encrypted-erc/welcome)
