Summary:
- Completed TQ-052 by replacing the AOV and HoK workspace skeleton markers with static local sample adapters.
- Implemented `games/aov` as package `@mmbt/game-aov-sample` and `games/hok` as package `@mmbt/game-hok-sample`, matching the sample-adapter naming convention established by TQ-051.
- Added static adapter metadata, 20 local sample selectable entities per adapter, local placeholder asset references, default manual rulesets, validation helpers, search/list helpers, and adapter action validation.
- The AOV sample ruleset is `aov-sample-standard-5v5` with 8 ban slots and 10 pick slots.
- The HoK sample ruleset is `hok-sample-global-bp-5v5` with 8 ban slots and 10 pick slots, and exposes series-wide global ban/pick flags as static ruleset configuration only.
- Used shared `GameAdapter`, `Hero`, `DraftRuleset`, `DraftState`, and validation result contracts from `@mmbt/shared-types`.
- Used the existing `@mmbt/game-adapters` registry in tests for registration and resolution.
- Did not add server APIs, Socket.IO runtime, UI, overlays, external data fetches, client readers, official runtime integrations, or automation.

Files changed:
- games/aov/package.json
- games/aov/src/adapter.ts
- games/aov/src/data.ts
- games/aov/src/index.test.ts
- games/aov/src/index.ts
- games/aov/src/rulesets.ts
- games/aov/src/validation.ts
- games/hok/package.json
- games/hok/src/adapter.ts
- games/hok/src/data.ts
- games/hok/src/index.test.ts
- games/hok/src/index.ts
- games/hok/src/rulesets.ts
- games/hok/src/validation.ts
- pnpm-lock.yaml
- WORKING_HANDOFF_AFTER_AOV_HOK_SAMPLE_ADAPTERS.md

Commands run:
- command: Get-Content source reads for AGENTS.md, docs/TASK_QUEUE.md, docs/ACCEPTANCE_CRITERIA.md, docs/BAN_PICK_RULES.md, docs/EVENT_PACKAGE_SPEC.md, Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md, IMPLEMENTATION_PROMPT_FOR_CODEX.md, and WORKING_HANDOFF_AFTER_LOL_SAMPLE_ADAPTER.md; result: succeeded.
- command: repo inspection with Get-ChildItem, rg --files, git status --short, package.json/pnpm-workspace reads, TQ-052 Select-String, and adapter/package source reads; result: succeeded.
- command: pnpm.cmd install; result: failed once in sandbox with Corepack EPERM, then passed with approved escalation.
- command: pnpm.cmd --filter @mmbt/game-aov-sample test; result: failed once in sandbox with Corepack EPERM, then passed with approved escalation, 12 tests.
- command: pnpm.cmd --filter @mmbt/game-aov-sample typecheck; result: failed once in sandbox with Corepack EPERM, then passed with approved escalation.
- command: pnpm.cmd --filter @mmbt/game-hok-sample test; result: failed once in sandbox with Corepack EPERM, then passed with approved escalation, 12 tests.
- command: pnpm.cmd --filter @mmbt/game-hok-sample typecheck; result: failed once in sandbox with Corepack EPERM, then passed with approved escalation.
- command: pnpm.cmd --filter @mmbt/game-adapters test; result: failed once in sandbox with Corepack EPERM, then passed with approved escalation, 6 tests.
- command: pnpm.cmd --filter @mmbt/game-adapters typecheck; result: failed once in sandbox with Corepack EPERM, then passed with approved escalation.
- command: pnpm.cmd lint; result: passed with approved escalation.
- command: pnpm.cmd typecheck; result: passed with approved escalation.
- command: pnpm.cmd test; result: passed with approved escalation.
- command: pnpm.cmd build; result: passed with approved escalation.
- command: pnpm.cmd verify; result: passed with approved escalation.
- command: rg "Garena API|Tencent API|TiMi API|live client|official client|spectator API|external CDN|WebSocket|Socket.IO|OBS|vMix|Prisma|SQLite|login|cloud|https://|http://" games packages; result: one allowed false positive, `OBSERVER` in packages/shared-types/src/health.ts.
- command: rg "Garena API|Tencent API|TiMi API|live client|official client|spectator API|external CDN|https://|http://" games\aov games\hok; result: no matches.
- command: rg "autoPick|autoBan|player-side|auto-pick|auto-ban|playerClient" games\aov games\hok packages\core-draft packages\shared-types packages\game-adapters; result: no matches.
- command: rg "Garena|Tencent|TiMi|spectator|external CDN|official client|live client" games\aov games\hok; result: matched only test-only guardrail token construction in games/aov/src/index.test.ts and games/hok/src/index.test.ts, not runtime behavior or sample payload data.
- command: git ls-files -- "games/aov/dist"; result: no tracked files.
- command: git ls-files -- "games/hok/dist"; result: no tracked files.
- command: git ls-files -- "games/lol/dist"; result: no tracked files.
- command: git ls-files -- "packages/game-adapters/dist"; result: no tracked files.
- command: git ls-files -- "games/generic-moba/dist"; result: no tracked files.
- command: git ls-files -- "packages/theme-engine/dist"; result: no tracked files.
- command: git ls-files -- "packages/core-production/dist"; result: no tracked files.
- command: git ls-files -- "packages/core-draft/dist"; result: no tracked files.
- command: git ls-files -- "packages/core-match/dist"; result: no tracked files.
- command: git ls-files -- "packages/shared-types/dist"; result: no tracked files.
- command: git ls-files -- "node_modules"; result: no tracked files.
- command: git diff --check; result: passed with Windows LF-to-CRLF warnings only.
- command: git status --short and git diff --stat; result: reviewed changed files.

Verification:
- Passed: `pnpm.cmd --filter @mmbt/game-aov-sample test`.
- Passed: `pnpm.cmd --filter @mmbt/game-aov-sample typecheck`.
- Passed: `pnpm.cmd --filter @mmbt/game-hok-sample test`.
- Passed: `pnpm.cmd --filter @mmbt/game-hok-sample typecheck`.
- Passed: `pnpm.cmd --filter @mmbt/game-adapters test`.
- Passed: `pnpm.cmd --filter @mmbt/game-adapters typecheck`.
- Passed: `pnpm.cmd lint`.
- Passed: `pnpm.cmd typecheck`.
- Passed: `pnpm.cmd test`.
- Passed: `pnpm.cmd build`.
- Passed: `pnpm.cmd verify`.
- Passed: exact static guardrail searches found no forbidden runtime integration strings in AOV/HoK sample payloads or implementation.
- Passed: requested tracked-output checks found no tracked `node_modules` or checked `dist` outputs.
- Failed: initial sandboxed pnpm/Corepack commands failed with EPERM; approved reruns passed.
- Not run / unavailable: none.

Manual rehearsal:
- Required: no
- Result: Not applicable

Scope guardrails checked:
- Universal Ban/Pick remains game-agnostic.
- AOV adapter is static/manual/sample-only.
- HoK adapter is static/manual/sample-only.
- LoL In-game HUD remains future plugin.
- Production Control remains above Universal Draft and game-specific plugins.
- v0.1 remains local-first, manual-first, production-safe.
- Overlay routes remain read-only.
- No Garena API / Tencent API / TiMi API / live client / official client integration added.
- No player-side automation.
- No auto-pick.
- No auto-ban.
- No hidden competitive information exposure.
- No internet/cloud/OBS WebSocket/vMix API requirement added.
- No node_modules or dist build outputs tracked.

Notes / risks:
- Package names are `@mmbt/game-aov-sample` and `@mmbt/game-hok-sample`; workspace paths remain `games/aov` and `games/hok` to match existing repo conventions and task queue references.
- The AOV and HoK adapters each expose 20 manually maintained sample selectable entities, enough for their no-duplicate sample rulesets.
- Asset helpers return local placeholder references and safe fallbacks only; they do not check whether asset files exist yet.
- HoK global ban/pick flags are exposed in the ruleset for future series-aware behavior, but no series-wide enforcement or hidden state was added in this task.
- Broad static search matched `OBS` inside the existing `OBSERVER` role string; this is not an OBS integration.
- A partial-term guardrail search matched constructed forbidden-token strings in adapter tests only; those tests assert the sample payloads do not contain those strings.

Suggested next task:
- TQ-060 - Create Sample Event Package Structure and JSON Files
