# Skill registry (compact rules)

> Generado en `sdd-init`. Skills `sdd-*` omitidos (flujo SDD). Paths bajo `~/.config/opencode/skills/` salvo que se indique.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| implementation, commit splitting, chained PRs | work-unit-commits | ~/.config/opencode/skills/work-unit-commits/SKILL.md |
| PR feedback, issue replies, reviews, Slack | comment-writer | ~/.config/opencode/skills/comment-writer/SKILL.md |
| writing guides, READMEs, RFCs, onboarding, architecture | cognitive-doc-design | ~/.config/opencode/skills/cognitive-doc-design/SKILL.md |
| PRs over 400 lines, stacked PRs, review slices | chained-pr | ~/.config/opencode/skills/chained-pr/SKILL.md |
| GitHub issues, bug reports, feature requests | issue-creation | ~/.config/opencode/skills/issue-creation/SKILL.md |
| creating, opening, or preparing PRs | branch-pr | ~/.config/opencode/skills/branch-pr/SKILL.md |
| new skills, agent instructions, documenting AI patterns | skill-creator | ~/.config/opencode/skills/skill-creator/SKILL.md |
| Go tests, go test coverage, Bubbletea teatest, golden files | go-testing | ~/.config/opencode/skills/go-testing/SKILL.md |
| judgment day, dual review, adversarial review, juzgar | judgment-day | ~/.config/opencode/skills/judgment-day/SKILL.md |

## SDD Workflow Skills

| Trigger | Skill | Path |
|---------|-------|------|
| sdd init, iniciar sdd, openspec init | sdd-init | ~/.config/opencode/skills/sdd-init/SKILL.md |
| sdd onboard, walk through SDD workflow | sdd-onboard | ~/.config/opencode/skills/sdd-onboard/SKILL.md |
| sdd explore, requirement clarification | sdd-explore | ~/.config/opencode/skills/sdd-explore/SKILL.md |
| sdd propose, change proposal | sdd-propose | ~/.config/opencode/skills/sdd-propose/SKILL.md |
| sdd spec, delta specs | sdd-spec | ~/.config/opencode/skills/sdd-spec/SKILL.md |
| sdd design, technical design | sdd-design | ~/.config/opencode/skills/sdd-design/SKILL.md |
| sdd tasks, task planning | sdd-tasks | ~/.config/opencode/skills/sdd-tasks/SKILL.md |
| sdd apply, implementation | sdd-apply | ~/.config/opencode/skills/sdd-apply/SKILL.md |
| sdd verify, verification phase | sdd-verify | ~/.config/opencode/skills/sdd-verify/SKILL.md |
| sdd archive, archive change | sdd-archive | ~/.config/opencode/skills/sdd-archive/SKILL.md |
| update skills, skill registry, actualizar skills | skill-registry | ~/.config/opencode/skills/skill-registry/SKILL.md |

## Compact Rules

### work-unit-commits
- Commits por unidad de trabajo entregable, no por tipo de archivo.
- Tests con el codigo que verifican; docs con el cambio visible.
- Cada commit debe contar una historia revisable; preparar cadenas de PR si SDD >400 lineas.

### comment-writer
- Ir al punto accionable primero; calidez humana, corto.
- Explicar el porque tecnico al pedir cambios; evitar pile-ons.
- Espanol: Rioplatense/voseo si aplica; sin rayas largas (em dash).

### cognitive-doc-design
- Respuesta/decision primero; detalle despues (progressive disclosure).
- Secciones cortas, senalizacion clara; tablas/checklists antes que parrafos densos.

### chained-pr
- Partir PRs >400 lineas salvo excepcion explicita; ~60 min de revision por PR.
- Una unidad entregable por PR; diagrama de dependencias en cadenas; no mezclar estrategias de cadena.

### issue-creation
- Issues con plantilla; `status:needs-review` al crear; PR solo tras `status:approved`.
- Preguntas van a Discussions del upstream referenciado en la skill (ajustar si el repo difiere).

### branch-pr
- PR enlaza issue aprobado; exactamente un label `type:*`; checks verdes.
- Ramas `tipo/descripcion` segun regex de la skill.

### skill-creator
- Skills como contratos LLM: frontmatter valido, cuerpo 180-450 tokens tipico.
- Referencias locales; detalle largo en `references/` o `assets/`.

### go-testing
- Tests table-driven; comportamiento no trivia de implementacion.
- `t.TempDir()`; integracion lenta bajo `testing.Short()`; goldens deterministas.

### judgment-day
- Solo bajo pedido explicito; dos jueces ciegos en paralelo; sintetizar tras ambos.
- Inyectar estandares del registry; re-juzgar tras fixes; estados terminales APPROVED/ESCALATED.

### sdd-init
- Detect stack, conventions, testing tools, persistence mode.
- Engram mode: no openspec/ created; save to Engram only.
- Build `.atl/skill-registry.md` always; also save skill-registry to Engram.
- Strict TDD from marker/config, detected runner fallback, or no-runner fallback (false).

### sdd-onboard
- Walk user through full SDD cycle on real codebase.
- Narrate each phase; keep short; ask before continuing past proposal.
- Small scope, low risk, real value; find 2-3 options, let user choose.

### sdd-explore
- Investigate codebase; compare approaches; return structured analysis.
- Do NOT modify any existing code; keep analysis concise.

### sdd-propose
- Intent, scope, approach; rollback plan; success criteria.
- Capabilities section is contract with sdd-spec (New vs Modified capabilities).
- Keep under 450 words; bullet points and tables over prose.

### sdd-spec
- Delta specs with Given/When/Then scenarios.
- RFC 2119 keywords (MUST/SHALL/SHOULD/MAY).
- MODIFIED requirements: copy FULL block from main spec, then edit.
- Keep under 650 words; each scenario 3-5 lines max.

### sdd-design
- Architecture decisions with rationale; data flow; file changes.
- Read actual codebase before designing; never guess.
- Keep under 800 words; ASCII diagrams for clarity.

### sdd-tasks
- Concrete, actionable steps organized by phase.
- Review Workload Forecast at top: estimate lines, 400-line risk, chain strategy.
- Each task 1-2 lines max; specific file paths; keep under 530 words.

### sdd-apply
- Follow specs and design strictly; match existing code patterns.
- Engram mode: mark tasks complete via mem_update; save apply-progress.
- Blocked if workload forecast exceeds budget and no decision provided.
- Strict TDD: load strict-tdd.md module; produce TDD Cycle Evidence table.

### sdd-verify
- Execute tests; prove implementation matches specs/design/tasks.
- Spec scenario compliant only when covering test passed at runtime.
- Persist verify-report; return PASS / PASS WITH WARNINGS / FAIL verdict.

### sdd-archive
- Sync delta specs to main specs; move change folder to archive.
- NEVER archive with CRITICAL issues in verify report.
- Engram mode: record all observation IDs for traceability.

### skill-registry
- Build `.atl/skill-registry.md` always; also save to Engram.
- Skip sdd-*, _shared, skill-registry; deduplicate by name (project > user).
- Compact rules 5-15 lines per skill; actionable constraints only.