# Proposal: InterbankVault MVP (C-Chain)

## Summary

Implementar un **vault mínimo en Solidity** sobre **Avalanche C-Chain** que custodie **AVAX nativo** entre apertura (banco) y liberación (FinNova vía **Safe**), con **registro verificable** (EIP-712 + `commitment`) y **material de auditoría** para CNBV (cifrado hacia clave pública de vista, emitido en **eventos**). Gas patrocinado por **relayer / 4337** fuera del núcleo del vault.

## Spec source of truth

`openspec/specs/hackathon-avalanche/spec.md`

## Rollback / de-risk

- Desplegar primero en **Fuji**; congelar direcciones `finNovaSafe` y `cnbvViewPubKey` tras smoke tests.
- Si Safe no está listo para demo: usar Safe de prueba con owners de equipo; **no** degradar a EOA release en main pitch (cambiaría el mensaje de seguridad).

## Out of scope (this change)

- Teleporter / segunda L1 (solo mención arquitectónica).
- ZK para ocultar montos on-chain.
