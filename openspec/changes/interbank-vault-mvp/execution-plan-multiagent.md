# Plan multi-agente: ejecución `interbank-vault-mvp` (solo orquestación)

**Estado**: diseño de coordinación. **No** lanzar subagentes ni implementar hasta orden explícita del usuario.

## Objetivo de la corrida

Materializar `tasks.md` + `design.md` en código Foundry desplegable en Fuji, con PRs apilables a `main` y verificación CI local (`forge test`).

## Roles de agente (sugeridos)

| ID | Rol | Responsabilidad | Entradas | Salidas |
|----|-----|-------------------|----------|---------|
| **A** | Scaffold | Repo Foundry, OZ, layout, README build | `design.md` §File changes | PR1 base: `foundry.toml`, `src/`, `lib/` |
| **B** | Contracts | `InterbankVault.sol`, EIP-712, eventos, invariantes | `design.md` interfaces + `tasks` 2.x | Contrato compilando; sin tests aún OK |
| **C** | QA on-chain | `InterbankVault.t.sol`, fuzz mínimo si aplica | ABI + reglas diseño §Testing | PR2 o commits sobre rama de PR1 |
| **D** | DevOps / deploy | `script/Deploy.s.sol`, env vars, notas Fuji | Addresses Safe mock/real | Misma PR2 o rama hija |
| **E** | Integración (opcional) | Stub indexador o script `cast logs` + doc | Event signatures | PR3 independiente si no toca `src/` |

**Nota**: A y B pueden ser **un solo agente** si el diff se mantiene <400 líneas; separar reduce conflictos en `InterbankVault.sol`.

## Grafo de ejecución (orden)

```text
A (scaffold) ──► B (vault core) ──┬──► C (tests)
                                  └──► D (deploy script)   en paralelo tras B
E (indexador) ───────────────────► después de B (solo lectura de ABI/eventos)
```

- **Serial obligatorio**: `A → B` (el contrato necesita toolchain).
- **Paralelo permitido**: `C` y `D` tras `B`, si **no** editan el mismo archivo simultáneamente; si ambos tocan solo `test/` vs `script/`, OK. Si C debe ajustar contrato, **secuencial C después de B** y D después de C o en PR separado.
- **Merge a main**: PR1 (A+B) merge primero; PR2 (C+D) rebased sobre `main`; PR3 opcional al final.

## Prompt mínimo por agente (plantilla para cuando ejecutes)

1. **A**: “Implementá solo Phase 1 de `openspec/changes/interbank-vault-mvp/tasks.md`; no toques lógica de negocio.”
2. **B**: “Implementá Phase 2 leyendo `design.md`; `finNovaSafe` immutable; sin indexador.”
3. **C**: “Phase 3: cubrí escenarios §Testing strategy del design; usá mocks para Safe si hace falta.”
4. **D**: “Phase 3.3 + 4.1: script deploy Fuji, variables `.env.example` sin secretos.”
5. **E** (opcional): “Lee eventos `TransferOpened`; serví JSON estático o README de `cast`.”

## Reglas anti-fricción

- Un agente **no** reformatea archivos fuera de su carpeta asignada (`A` no reescribe `InterbankVault` salvo imports).
- Antes de paralelizar: `git pull --rebase` sobre la rama que ya mergeó PR1.
- Cualquier cambio al struct EIP-712: **B avisa** en handoff (un bullet en PR description) para que C actualice fixtures.

## Criterios de “done” de la corrida completa

- `forge build` y `forge test` verdes.
- Deploy Fuji documentado con una tx `openTransfer` y una `release` vía Safe (o dirección mock equivalente).
- `state.yaml` actualizado a `phase: apply` o `verify` según convención interna tras merges.

## Riesgos multi-agente

| Riesgo | Mitigación |
|--------|------------|
| Doble edición `InterbankVault.sol` | B termina antes; C solo toca `test/` hasta bugfix |
| Deriva vs `design.md` | Checklist PR: enlace a `design.md` sección |
| >400 líneas | Partir PR1/PR2 según `tasks.md` forecast |

## Qué hace falta decidir antes del “go”

- Estrategia de cadena: confirmar **stacked-to-main** (ya asumido en `tasks.md`) o preferir feature-branch-chain.
- Si PR3 indexador se omite en hackathon, marcar E como **cancelado** y no bloquear merge PR2.
