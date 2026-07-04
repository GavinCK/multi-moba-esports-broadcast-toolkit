# Working Handoff After Operator Guide

Summary:
- Completed TQ-110: Create Operator Guide.
- Created `docs/operator-guide.md` as a docs-only live-show operator guide for v0.1.
- Documented role responsibilities, pre-show startup, current service commands, Admin setup checks, Draft Operator workflow, hover/lock/timer/undo/reset/complete behavior, Producer Preview/Program workflow, Emergency workflow, Caster/read-only workflow, overlay URLs, disconnection recovery, health/audit warnings, live-show guardrails, end-of-show notes, known limitations, and a quick checklist.
- Added a small README documentation link to the new guide.
- Did not modify application code, tests, package scripts, dependencies, event package logs, commits, or pushes.

Files changed:
- `docs/operator-guide.md`
- `README.md`
- `WORKING_HANDOFF_AFTER_OPERATOR_GUIDE.md`

Commands run:
- `git status --short`: clean before edits.
- `git branch --show-current`: `main`.
- `git log --oneline -5`: latest commits reviewed before edits.
- `rg --files`: repository files inspected.
- `Get-ChildItem -LiteralPath . -Force`: repository root inspected.
- `Get-ChildItem -LiteralPath docs -Force`: docs directory inspected.
- Required source documents and handoffs read with `Get-Content -Raw`: succeeded for `AGENTS.md`, technical spec, implementation prompt, required docs, required prior handoffs, README, and package scripts.
- `rg -n "lint:docs" package.json apps packages games docs README.md`: found only task-document references; no runnable docs lint package script.
- `rg -n "pnpm --filter @mmbt/server dev|pnpm --filter @mmbt/admin-dashboard dev|pnpm --filter @mmbt/overlay dev" docs\operator-guide.md`: passed; startup commands found.
- `rg -n "sample event|match, game, and draft|match, current game|Blue and red teams|ruleset" docs\operator-guide.md`: passed; sample event and match/team/game/ruleset checks found.
- `rg -n "manual Ban/Pick|Hover|Lock|Timer operation|Pause|Resume|Undo|Reset|Complete" docs\operator-guide.md`: passed; manual draft workflow coverage found.
- `rg -n "Preview|Take to Program|Clear Program|Producer|Program is live output" docs\operator-guide.md`: passed; Producer Preview/Take/Clear coverage found.
- `rg -n "Emergency|/overlay/emergency|emergency override|Technical Pause" docs\operator-guide.md`: passed; Emergency coverage found.
- `rg -n "/overlay/draft|/overlay/scorebug|/overlay/preview|/overlay/program|/overlay/emergency|\?debug=1" docs\operator-guide.md`: passed; overlay URLs and debug variants found.
- `rg -n "disconnect|system-health|Socket.IO|refresh|LAN connectivity|read-only" docs\operator-guide.md`: passed; disconnect/recovery coverage found.
- `rg -n "Do not:|overlay routes as controls|internet|cloud|LCU|Data Dragon|player PCs|auto-pick|auto-ban|health errors|audit errors" docs\operator-guide.md`: passed; live-show prohibition coverage found.
- `rg "required OBS WebSocket|required vMix API|required cloud|required internet|required database|required login|required LCU|required Data Dragon|player PC software required|auto-pick required|auto-ban required|rehearsal passed|OBS tested|vMix tested|offline passed|ignore health errors|ignore audit errors" docs\operator-guide.md`: passed after review; matches are explicit negations only.
- `git diff --check`: passed.
- `git status --short`: passed; final status shows `README.md` modified and new untracked `docs/operator-guide.md` plus `WORKING_HANDOFF_AFTER_OPERATOR_GUIDE.md`.
- `git diff --name-only`: passed; tracked diff is `README.md`, with new untracked docs visible through `git status --short`.
- `Get-ChildItem -Force event-packages\sample-event\logs`: passed; only `.gitkeep` is present.

Verification:
- Passed: `docs/operator-guide.md` explains startup commands for server, Admin Dashboard, and Overlay app.
- Passed: `docs/operator-guide.md` explains loading or confirming the sample event.
- Passed: `docs/operator-guide.md` explains selecting or confirming match, team, game, and ruleset.
- Passed: `docs/operator-guide.md` explains manual Ban/Pick.
- Passed: `docs/operator-guide.md` explains hover vs lock.
- Passed: `docs/operator-guide.md` explains pause/resume timer.
- Passed: `docs/operator-guide.md` explains undo/reset/complete confirmations.
- Passed: `docs/operator-guide.md` explains Producer Preview/Take/Clear.
- Passed: `docs/operator-guide.md` explains Emergency workflow.
- Passed: `docs/operator-guide.md` includes overlay URLs and `?debug=1` variants.
- Passed: `docs/operator-guide.md` explains overlay disconnect recovery.
- Passed: `docs/operator-guide.md` includes what not to do during live show.
- Passed: `docs/operator-guide.md` does not claim rehearsal passed.
- Passed: `docs/operator-guide.md` does not require future-scope systems.
- Passed: unsafe-claim guardrail search; only explicit negations matched.
- Passed: `git diff --check`.
- Passed: checked-in sample event logs were not polluted.
- Failed: none.
- Not run / unavailable: docs lint; no runnable docs lint package script exists. Heavy app build/test commands were not run because this was docs-only.

Manual rehearsal:
- Required: no.
- Result: not performed. This task documents operator workflows and does not claim OBS/vMix, offline LAN, two-device LAN, or independent operator rehearsal passed.

Scope guardrails checked:
- Docs-only task.
- No application code changed.
- No server feature added.
- No dashboard feature added.
- No overlay feature added.
- No tests added.
- No package dependencies added.
- No package scripts changed.
- No OBS WebSocket, vMix API, Companion, Stream Deck, cloud sync, internet, external database, SQLite, Prisma, login/auth, official game API, Riot API, LCU, Data Dragon, Garena API, Tencent API, TiMi API, player-side software, player-side automation, auto-pick, or auto-ban requirement introduced.
- No guidance added to bypass confirmations.
- No guidance added to ignore health or audit errors.
- No checked-in sample-event logs mutated.
- No rehearsal claimed as performed.
- No commit made.
- No push made.

Notes / risks:
- This guide relies on the current v0.1 development topology: server on `3000`, dashboard on `5173`, overlay on `5174`, with LAN-reachable host binding and firewall access confirmed during rehearsal.
- This guide is not a substitute for TQ-131 full local manual rehearsal.

Suggested next task:
- TQ-111 - Create Game Adapter Developer Guide
