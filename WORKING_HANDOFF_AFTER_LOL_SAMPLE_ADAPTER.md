Summary:
- Completed TQ-051 as a static local LoL sample adapter for manual draft testing only.
- Implemented `games/lol` as package `@mmbt/game-lol-sample` so the package name clearly marks the adapter as sample-only while preserving the existing workspace folder.
- Added static adapter metadata, 20 local sample champion/selectable entities, local placeholder asset references, one LoL-like manual 5v5 ruleset, validation helpers, search/list helpers, and adapter action validation.
- Used shared `GameAdapter`, `Hero`, `DraftRuleset`, `DraftState`, and validation result contracts from `@mmbt/shared-types`.
- Used the existing `@mmbt/game-adapters` registry in tests for registration and resolution.
- Did not add any server APIs, Socket.IO runtime, UI, overlay rendering, external data fetches, client readers, or future runtime integrations.

Files changed:
- games/lol/package.json
- games/lol/src/adapter.ts
- games/lol/src/data.ts
- games/lol/src/index.test.ts
- games/lol/src/index.ts
- games/lol/src/rulesets.ts
- games/lol/src/validation.ts
- pnpm-lock.yaml
- WORKING_HANDOFF_AFTER_LOL_SAMPLE_ADAPTER.md

Commands run:
- command: Get-Content source reads for AGENTS.md, docs/TASK_QUEUE.md, docs/ACCEPTANCE_CRITERIA.md, docs/BAN_PICK_RULES.md, docs/EVENT_PACKAGE_SPEC.md, Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md, IMPLEMENTATION_PROMPT_FOR_CODEX.md, and WORKING_HANDOFF_AFTER_GENERIC_MOBA_ADAPTER.md; result: succeeded.
- command: repo inspection with Get-ChildItem, rg --files, git status --short, package.json/pnpm-workspace reads, and TQ-051 Select-String; result: succeeded.
- command: pnpm.cmd install; result: failed once in sandbox with Corepack EPERM, then passed with approved escalation.
- command: pnpm.cmd --filter @mmbt/game-lol-sample test; result: passed, 12 tests.
- command: pnpm.cmd --filter @mmbt/game-lol-sample typecheck; result: passed.
- command: pnpm.cmd --filter @mmbt/game-adapters test; result: passed, 6 tests.
- command: pnpm.cmd --filter @mmbt/game-adapters typecheck; result: passed.
- command: pnpm.cmd lint; result: passed.
- command: pnpm.cmd typecheck; result: passed.
- command: pnpm.cmd test; result: passed.
- command: pnpm.cmd build; result: passed.
- command: pnpm.cmd verify; result: passed after final patch.
- command: rg "LCU|DataDragon|Data Dragon|Riot API|champion-select|spectator API|live client|WebSocket|Socket.IO|OBS|vMix|Prisma|SQLite|login|cloud|https://|http://" games packages; result: one allowed false positive, `OBSERVER` in packages/shared-types/src/health.ts.
- command: rg "LCU|DataDragon|Data Dragon|Riot API|champion-select|spectator API|live client|WebSocket|Socket.IO|OBS WebSocket|vMix|Prisma|SQLite|login|cloud|https://|http://" games packages; result: no matches.
- command: rg "LCU|DataDragon|Data Dragon|Riot API|champion-select|spectator API|live client|https://|http://" games/lol; result: no matches.
- command: rg "autoPick|autoBan|playerClient|player-side|auto-pick|auto-ban" games/lol packages/core-draft packages/shared-types packages/game-adapters; result: no matches.
- command: git ls-files -- "games/lol-sample/dist"; result: no tracked files.
- command: git ls-files -- "games/lol/dist"; result: no tracked files.
- command: git ls-files -- "packages/game-adapters/dist"; result: no tracked files.
- command: git ls-files -- "games/generic-moba/dist"; result: no tracked files.
- command: git ls-files -- "packages/theme-engine/dist"; result: no tracked files.
- command: git ls-files -- "packages/core-production/dist"; result: no tracked files.
- command: git ls-files -- "packages/core-draft/dist"; result: no tracked files.
- command: git ls-files -- "packages/core-match/dist"; result: no tracked files.
- command: git ls-files -- "packages/shared-types/dist"; result: no tracked files.
- command: git ls-files -- "node_modules"; result: no tracked files.
- command: git ls-files -- "*/dist/*"; result: no tracked files.
- command: git diff --check; result: passed with Windows LF-to-CRLF warnings only.

Verification:
- Passed: `pnpm.cmd --filter @mmbt/game-lol-sample test`.
- Passed: `pnpm.cmd --filter @mmbt/game-lol-sample typecheck`.
- Passed: `pnpm.cmd --filter @mmbt/game-adapters test`.
- Passed: `pnpm.cmd --filter @mmbt/game-adapters typecheck`.
- Passed: `pnpm.cmd lint`.
- Passed: `pnpm.cmd typecheck`.
- Passed: `pnpm.cmd test`.
- Passed: `pnpm.cmd build`.
- Passed: `pnpm.cmd verify`.
- Passed: refined static guardrail searches found no forbidden runtime integration strings.
- Passed: requested tracked-output checks found no tracked `node_modules` or checked `dist` outputs.
- Failed: initial sandboxed pnpm/Corepack commands failed with EPERM; approved reruns passed.
- Not run / unavailable: none.

Manual rehearsal:
- Required: no
- Result: Not applicable

Scope guardrails checked:
- Universal Ban/Pick remains game-agnostic.
- LoL adapter is static/manual/sample-only.
- LoL In-game HUD remains future plugin.
- Production Control remains above Universal Draft and game-specific plugins.
- v0.1 remains local-first, manual-first, production-safe.
- Overlay routes remain read-only.
- No Riot API / LCU / Data Dragon / champion select sync / live client integration added.
- No player-side automation.
- No auto-pick.
- No auto-ban.
- No hidden competitive information exposure.
- No internet/cloud/OBS WebSocket/vMix API requirement added.
- No node_modules or dist build outputs tracked.

Notes / risks:
- Package name is `@mmbt/game-lol-sample`; the workspace path remains `games/lol` to match existing repo conventions and task queue references.
- The adapter uses 20 manually maintained sample champions so the no-duplicate 10-ban/10-pick ruleset is draft-compatible.
- Asset helpers return local placeholder references and safe fallbacks only; they do not check whether asset files exist yet.
- No automatic adapter loading was added to `@mmbt/game-adapters`; later server/runtime work should compose known local adapters explicitly.
- A broad static search matched `OBS` inside the existing `OBSERVER` role string; this is not an OBS integration.

Suggested next task:
- TQ-052 - AOV and HoK Sample Adapters
