# Working Handoff After Game Adapter Guide

Summary:
- Completed TQ-111: Create Game Adapter Developer Guide.
- Created `docs/game-adapter-guide.md` as a docs-only developer guide for adding or maintaining game adapters without contaminating the universal core.
- Documented v0.1 adapter principles, current adapter locations, `GameAdapter` responsibilities, what belongs in `/games/<game>`, what must stay out of `/games/<game>` for v0.1, hero data, rulesets, assets/fallbacks, capabilities flags, required adapter tests, universal core boundaries, future LoL plugin boundary, a new-game checklist, folder skeleton, future-agent review checklist, and known limitations.
- Added a small README documentation link to the new guide.
- Did not modify application code, tests, package scripts, dependencies, game adapter source files, core packages, server/dashboard/overlay code, event package logs, commits, or pushes.

Files changed:
- `docs/game-adapter-guide.md`
- `README.md`
- `WORKING_HANDOFF_AFTER_GAME_ADAPTER_GUIDE.md`

Commands run:
- `Get-Content -LiteralPath 'D:\CodexPrompts\TQ-111_GAME_ADAPTER_DEVELOPER_GUIDE.md'`: succeeded; attachment was readable and non-empty.
- `git status --short`: clean before edits.
- `git branch --show-current`: `main`.
- `git log --oneline -5`: latest commits reviewed; newest was `9a8998e docs: add operator guide`.
- Required source documents and handoffs were read with `Get-Content -Raw`: succeeded for `AGENTS.md`, technical spec, implementation prompt, `docs/ACCEPTANCE_CRITERIA.md`, `docs/TASK_QUEUE.md`, `docs/BAN_PICK_RULES.md`, `docs/API_SOCKET_CONTRACT.md`, `docs/EVENT_PACKAGE_SPEC.md`, `docs/OVERLAY_SPEC.md`, `docs/deployment-guide.md`, `docs/operator-guide.md`, and the required working handoffs through `WORKING_HANDOFF_AFTER_SYSTEM_HEALTH_DASHBOARD.md`.
- `rg --files`: repository files inspected.
- `Get-ChildItem -Force`: repository root inspected.
- `Get-ChildItem -Force -LiteralPath 'docs'`: docs directory inspected.
- `Get-Content -Raw -LiteralPath 'README.md'`: README docs section inspected.
- `Get-Content -Raw -LiteralPath 'package.json'`: root scripts inspected.
- `Get-Content -Raw` for shared adapter/draft types, game-adapter registry helpers, and current adapter files: succeeded; current `GameAdapter` contract and sample adapter capabilities reviewed.
- `rg -n "lint:docs" package.json apps packages games docs README.md`: found only task-document references; no runnable docs lint package script exists.
- `rg -n "GameAdapter Responsibilities|Hero Data Guidelines|Ruleset Guidelines|Asset and Fallback Guidelines|Capabilities Flags|Required Adapter Tests|What Belongs|Universal Core Boundaries|Future LoL Plugin Boundary" docs\game-adapter-guide.md`: passed; required topic sections found.
- `rg -n "games/generic-moba|games/lol|games/aov|games/hok|packages/core-draft|packages/core-match|packages/core-production|packages/shared-types" docs\game-adapter-guide.md`: passed; current adapter locations and universal core boundaries found.
- `rg "required LCU|required Data Dragon|required Riot API|required official game API|required OBS WebSocket|required vMix API|required cloud|required internet|required database|required login|player PC software required|auto-pick required|auto-ban required|implemented LCU|implemented Data Dragon|implemented in-game HUD" docs\game-adapter-guide.md`: passed with no matches.
- `git diff --check`: passed before and after adding the handoff file.
- `git status --short`: final status shows `README.md` modified plus new untracked `docs/game-adapter-guide.md` and `WORKING_HANDOFF_AFTER_GAME_ADAPTER_GUIDE.md`.
- `git diff --name-only`: final tracked diff shows `README.md`; new docs are untracked and visible through `git status --short`.
- `rg -n "game-adapter-guide" README.md`: passed; README link found.
- `Get-ChildItem -Force -LiteralPath 'event-packages\sample-event\logs'`: passed; only `.gitkeep` is present.

Verification:
- Passed: `docs/game-adapter-guide.md` explains `GameAdapter` responsibilities.
- Passed: `docs/game-adapter-guide.md` explains how to add hero data.
- Passed: `docs/game-adapter-guide.md` explains how to add rulesets.
- Passed: `docs/game-adapter-guide.md` explains assets and fallbacks.
- Passed: `docs/game-adapter-guide.md` explains capabilities flags.
- Passed: `docs/game-adapter-guide.md` explains required adapter tests.
- Passed: `docs/game-adapter-guide.md` explains what belongs in `/games/<game>`.
- Passed: `docs/game-adapter-guide.md` explains what must stay out of `/games/<game>` in v0.1.
- Passed: `docs/game-adapter-guide.md` explains what must never go into `packages/core-draft` or shared universal core.
- Passed: `docs/game-adapter-guide.md` explains the future LoL plugin boundary.
- Passed: `docs/game-adapter-guide.md` does not describe LCU, Data Dragon, official APIs, OBS WebSocket, vMix API, cloud, internet, database, login, player-PC software, auto-pick, or auto-ban as required v0.1 features.
- Passed: `docs/game-adapter-guide.md` does not encourage game-specific logic in universal core.
- Passed: README includes a small link to the new guide.
- Passed: unsafe-claim guardrail search returned no matches.
- Passed: `git diff --check`.
- Passed: checked-in sample-event logs were not polluted.
- Failed: none.
- Not run / unavailable: docs lint; no runnable docs lint package script exists. Heavy application lint/typecheck/test/build commands were not run because this task is docs-only and requested lightweight repo-safe checks only.

Manual rehearsal:
- Required: no.
- Result: not performed. This was a docs-only developer guide task and does not claim live rehearsal, OBS/vMix rehearsal, browser visual QA, or adapter implementation validation.

Scope guardrails checked:
- Docs-only task.
- No application code changed.
- No new game adapter added.
- No existing game adapter modified.
- No core packages modified.
- No server, dashboard, or overlay code modified.
- No tests added.
- No package dependencies added.
- No package scripts changed.
- No OBS WebSocket, vMix API, Companion, Stream Deck, cloud sync, internet, external database, SQLite, Prisma, login/auth, official game APIs, Riot API, LCU, Data Dragon, Garena API, Tencent API, TiMi API, player-side software, player-side automation, auto-pick, or auto-ban requirement introduced.
- No guidance added that puts game-specific logic into `packages/core-draft`, `packages/core-match`, `packages/core-production`, or shared universal core.
- No future LoL plugin feature claimed as active v0.1 behavior.
- No checked-in sample-event logs mutated.
- No commit made.
- No push made.

Notes / risks:
- This guide documents extension boundaries only. It does not register a new adapter or prove a future adapter implementation.
- The guide reflects the current `GameAdapter` contract and current sample adapter capability posture: local manual draft support is active, while client readers, in-game HUD, post-game stats, and asset sync stay inactive for v0.1 sample adapters.
- `git diff --name-only` reports tracked file changes only, so untracked new docs are visible through `git status --short`.

Suggested next task:
- TQ-112 - Update README with Local Run and v0.1 Scope
