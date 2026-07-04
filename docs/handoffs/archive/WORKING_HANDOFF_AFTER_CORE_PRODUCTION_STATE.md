Summary:
- Completed TQ-040 core-production scope for pure, game-agnostic production state logic.
- Replaced the core-production skeleton export with a serializable production runtime state model backed by shared production contracts from `@mmbt/shared-types`.
- Added production status transition validation, initial state creation, active match/game/draft selectors, overlay read-only safety selectors, Preview/Program graphic helpers, and emergency mode helpers.
- Added confirmation requirements for dangerous production operations in pure core helpers: live active-match switching, Take, Clear, emergency enter, and emergency exit.
- Added focused unit tests covering valid transitions, invalid transitions, live active-match switch confirmation, graphics preview/take/clear, emergency mode, JSON-safe payload validation, and selectors.
- Removed previously tracked `packages/core-production/dist` build artifacts from the Git index while leaving local generated files ignored.

Files changed:
- packages/core-production/package.json
- packages/core-production/src/constants.ts
- packages/core-production/src/emergency.ts
- packages/core-production/src/errors.ts
- packages/core-production/src/graphics.ts
- packages/core-production/src/index.ts
- packages/core-production/src/json.ts
- packages/core-production/src/selectors.ts
- packages/core-production/src/state.ts
- packages/core-production/src/state.test.ts
- packages/core-production/src/types.ts
- packages/core-production/src/validation.ts
- packages/core-production/src/index.test.ts (removed skeleton test)
- packages/core-production/dist/index.d.ts (untracked from Git)
- packages/core-production/dist/index.js (untracked from Git)
- packages/core-production/dist/index.js.map (untracked from Git)
- pnpm-lock.yaml
- WORKING_HANDOFF_AFTER_CORE_PRODUCTION_STATE.md

Commands run:
- Get-Content -Raw AGENTS.md: succeeded.
- Get-Content -Raw docs/TASK_QUEUE.md: succeeded.
- Get-Content -Raw docs/ACCEPTANCE_CRITERIA.md: succeeded.
- Get-Content -Raw docs/BAN_PICK_RULES.md: succeeded.
- Get-Content -Raw docs/API_SOCKET_CONTRACT.md: succeeded.
- Get-Content -Raw docs/OVERLAY_SPEC.md: succeeded.
- Get-Content -Raw Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md: succeeded.
- Get-Content -Raw WORKING_HANDOFF_AFTER_DRAFT_ACTIONS_TIMER_UNDO.md: succeeded.
- Get-Content -Raw IMPLEMENTATION_PROMPT_FOR_CODEX.md: succeeded.
- rg -n -C 80 "TQ-040" docs\TASK_QUEUE.md: succeeded.
- Get-ChildItem -Force: succeeded.
- Get-ChildItem -Recurse -Force packages\core-production: succeeded.
- Get-Content -Raw package.json: succeeded.
- Get-Content -Raw pnpm-workspace.yaml: succeeded.
- Get-Content -Raw packages\core-production\package.json: succeeded.
- Get-Content -Raw packages\core-production\tsconfig.json: succeeded.
- Get-Content -Raw packages\core-production\src\index.ts: succeeded.
- Get-Content -Raw packages\core-production\src\index.test.ts: succeeded.
- Get-Content / rg inspections for shared-types, core-draft, and core-match conventions: succeeded.
- git status --short: succeeded.
- pnpm.cmd install: failed once in sandbox with Corepack cache EPERM; rerun with approved escalation and succeeded.
- pnpm.cmd --filter @mmbt/core-production test: failed once in sandbox with Corepack cache EPERM; rerun with approved escalation and passed, 10 tests.
- pnpm.cmd --filter @mmbt/core-production typecheck: failed once in sandbox with Corepack cache EPERM; rerun with approved escalation found TypeScript issues, then passed after fixes.
- pnpm.cmd lint: passed.
- pnpm.cmd typecheck: passed.
- pnpm.cmd test: passed.
- pnpm.cmd build: passed.
- pnpm.cmd verify: passed.
- rg "Riot|LCU|DataDragon|champion-select|SummonerSpell" packages/core-production: no matches.
- rg "autoPick|autoBan|setInterval|WebSocket|Socket.IO|OBS|vMix|Prisma|SQLite|login|cloud" packages/core-production: no matches.
- git ls-files -- "packages/core-production/dist": initially showed tracked files, then no output after untracking.
- git ls-files -- "packages/core-draft/dist": no tracked files.
- git ls-files -- "packages/core-match/dist": no tracked files.
- git ls-files -- "packages/shared-types/dist": no tracked files.
- git ls-files -- "node_modules": no tracked files.
- git rm --cached -r -- packages/core-production/dist: failed once due index lock permission in sandbox; rerun with approved escalation and succeeded.
- git diff --check: no whitespace errors; line-ending warnings only.

Verification:
- Passed: pnpm.cmd --filter @mmbt/core-production test.
- Passed: pnpm.cmd --filter @mmbt/core-production typecheck.
- Passed: pnpm.cmd lint.
- Passed: pnpm.cmd typecheck.
- Passed: pnpm.cmd test.
- Passed: pnpm.cmd build.
- Passed: pnpm.cmd verify.
- Passed: forbidden LoL/client/runtime term guardrail searches returned no matches in packages/core-production.
- Passed: tracked-output checks returned no tracked dist or node_modules paths after untracking old core-production dist artifacts.
- Failed: initial non-escalated pnpm/corepack commands failed due sandbox access to `C:\Users\Gavin\AppData\Local\node\corepack\v1\pnpm`; approved reruns passed.
- Failed: first core-production typecheck rerun found strict JSON/detail typing and transition-table typing issues; both were fixed and typecheck passed.
- Not run / unavailable: none.

Manual rehearsal:
- Required: no
- Result: Not applicable

Scope guardrails checked:
- Universal Ban/Pick remains game-agnostic.
- LoL In-game HUD remains future plugin.
- Production Control remains above Universal Draft and game-specific plugins.
- v0.1 remains local-first, manual-first, production-safe.
- Overlay routes remain read-only.
- No player-side automation.
- No auto-pick.
- No auto-ban.
- No hidden competitive information exposure.
- No internet/cloud/OBS WebSocket/vMix API requirement added.
- No node_modules or dist build outputs tracked.

Notes / risks:
- This task intentionally added pure core-production helpers only. No server APIs, Socket.IO runtime, UI, overlay routes, audit-log writing, OBS/vMix integration, database, cloud sync, adapter changes, or player-side automation were added.
- Emergency mode is modeled separately from `ProductionState` because the existing shared contract does not include an `EMERGENCY` production status. Selectors expose emergency as a status category while preserving the underlying shared production status.
- `GraphicTakeState` keeps a required `graphicType`, so an idle initial state uses `DRAFT_OVERLAY` as the safe default type while both Preview and Program payloads are null.
- Pure helpers enforce confirmation for safety-sensitive operations, but actual audit logging and operator/UI confirmation prompts remain future server/UI tasks.

Suggested next task:
- TQ-041 - Implement Basic Theme Engine.
