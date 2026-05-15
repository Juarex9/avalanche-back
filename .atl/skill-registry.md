# Skill registry (compact rules)

> Generado en `sdd-init`. Skills `sdd-*` omitidos (flujo SDD). Paths bajo `~/.cursor/skills/` salvo que se indique `skills-cursor`.

## work-unit-commits (`~/.cursor/skills/work-unit-commits/SKILL.md`)

- Commits por unidad de trabajo entregable, no por tipo de archivo.
- Tests con el código que verifican; docs con el cambio visible.
- Cada commit debe contar una historia revisable; preparar cadenas de PR si SDD >400 líneas.

## comment-writer (`~/.cursor/skills/comment-writer/SKILL.md`)

- Ir al punto accionable primero; calidez humana, corto.
- Explicar el porqué técnico al pedir cambios; evitar pile-ons.
- Español: Rioplatense/voseo si aplica; sin rayas largas (em dash).

## cognitive-doc-design (`~/.cursor/skills/cognitive-doc-design/SKILL.md`)

- Respuesta/decisión primero; detalle después (progressive disclosure).
- Secciones cortas, señalización clara; tablas/checklists antes que párrafos densos.

## chained-pr (`~/.cursor/skills/chained-pr/SKILL.md`)

- Partir PRs >400 líneas salvo excepción explícita; ~60 min de revisión por PR.
- Una unidad entregable por PR; diagrama de dependencias en cadenas; no mezclar estrategias de cadena.

## issue-creation (`~/.cursor/skills/issue-creation/SKILL.md`)

- Issues con plantilla; `status:needs-review` al crear; PR solo tras `status:approved`.
- Preguntas van a Discussions del upstream referenciado en la skill (ajustar si el repo difiere).

## branch-pr (`~/.cursor/skills/branch-pr/SKILL.md`)

- PR enlaza issue aprobado; exactamente un label `type:*`; checks verdes.
- Ramas `tipo/descripcion` según regex de la skill.

## skill-creator (`~/.cursor/skills/skill-creator/SKILL.md`)

- Skills como contratos LLM: frontmatter válido, cuerpo 180–450 tokens típico.
- Referencias locales; detalle largo en `references/` o `assets/`.

## go-testing (`~/.cursor/skills/go-testing/SKILL.md`)

- Tests table-driven; comportamiento no trivia de implementación.
- `t.TempDir()`; integración lenta bajo `testing.Short()`; goldens deterministas.

## judgment-day (`~/.cursor/skills/judgment-day/SKILL.md`)

- Solo bajo pedido explícito; dos jueces ciegos en paralelo; sintetizar tras ambos.
- Inyectar estándares del registry; re-juzgar tras fixes; estados terminales APPROVED/ESCALATED.

## babysit (`~/.cursor/skills-cursor/babysit/SKILL.md`)

- PR merge-ready: conflictos, comentarios (incl. Bugbot válido), CI en scope.
- No debilitar CI ni cambios fuera de alcance para “poner verde”.

## canvas (`~/.cursor/skills-cursor/canvas/SKILL.md`)

- Canvas `.canvas.tsx` para artefactos analíticos autónomos o datos MCP densos; no sustituir entregables pedidos en otra herramienta.
- Leer skill al crear/editar/debug canvas.

## update-cursor-settings (`~/.cursor/skills-cursor/update-cursor-settings/SKILL.md`)

- Leer `settings.json` actual; cambiar solo lo pedido; JSON válido.

## update-cli-config (`~/.cursor/skills-cursor/update-cli-config/SKILL.md`)

- `~/.cursor/cli-config.json`; overrides por `.cursor/cli.json` en proyecto; reinicio CLI.

## statusline (`~/.cursor/skills-cursor/statusline/SKILL.md`)

- `statusLine` en cli-config apuntando a comando; payload JSON por stdin según spec Cursor.

## split-to-prs (`~/.cursor/skills-cursor/split-to-prs/SKILL.md`)

- Plan aprobado antes de branch/commit/PR; snapshot recuperable; sin `git add .`; sin git destructivo sin OK.

## shell (`~/.cursor/skills-cursor/shell/SKILL.md`)

- Solo con invocación explícita `/shell`; ejecutar literal sin reescribir.

## migrate-to-skills (`~/.cursor/skills-cursor/migrate-to-skills/SKILL.md`)

- Migrar reglas/commands a skills copiando cuerpo verbatim; ignorar worktrees y skills-cursor interno.

## sdk (`~/.cursor/skills-cursor/sdk/SKILL.md`)

- `@cursor/sdk`: leer skill para patrones actuales; no validar elección del usuario con marketing.
- Documentación canónica en docs Cursor TypeScript SDK.

## create-subagent (`~/.cursor/skills-cursor/create-subagent/SKILL.md`)

- Subagents `.md` con frontmatter en `.cursor/agents/` (proyecto) o `~/.cursor/agents/` (usuario).

## create-skill (`~/.cursor/skills-cursor/create-skill/SKILL.md`)

- Requisitos: propósito, ubicación, triggers, formato; texto usuario verbatim si lo da.

## create-rule (`~/.cursor/skills-cursor/create-rule/SKILL.md`)

- Reglas en `.cursor/rules/`; clarificar alwaysApply vs globs antes de escribir.

## create-hook (`~/.cursor/skills-cursor/create-hook/SKILL.md`)

- `hooks.json` proyecto o usuario; elegir evento mínimo; fail open/closed explícito.
