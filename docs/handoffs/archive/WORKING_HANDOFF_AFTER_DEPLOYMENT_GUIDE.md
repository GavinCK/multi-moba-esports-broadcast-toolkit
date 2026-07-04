# Working Handoff After Deployment Guide

## Summary

- Completed TQ-102: Document Local LAN Deployment and Browser Source URLs.
- Created `docs/deployment-guide.md` as a docs-only local LAN deployment guide for v0.1.
- Documented control machine, graphics PC, draft operator, producer, and caster machine roles.
- Documented default local ports, localhost-to-LAN-IP replacement examples, Admin Dashboard URLs, role panel URLs, and overlay browser-source URLs.
- Documented OBS/vMix browser-source assumptions, firewall/port assumptions, offline operation, emergency overlay usage, health dashboard checks, pre-show startup, post-show notes, known limitations, and TQ-131 handoff checklist.
- Added a small README documentation link to the new guide.
- Did not modify application code, add tests, mutate sample event logs, commit, or push.

## Files changed

- `docs/deployment-guide.md`
- `README.md`
- `WORKING_HANDOFF_AFTER_DEPLOYMENT_GUIDE.md`

## Commands run

- `Get-Content -Raw -LiteralPath 'D:\CodexPrompts\TQ-102_DEPLOYMENT_GUIDE.md'`: succeeded; attachment was readable and non-empty before confirmation.
- `git status --short`: passed before edits; working tree was clean.
- `git branch --show-current`: passed; branch was `main`.
- `git log --oneline -5`: passed; latest commit reviewed was `c4ac68f feat(health): complete system health dashboard`.
- `Get-ChildItem -Force`: passed; repository shape inspected.
- `rg --files`: passed; repository files inspected.
- Required source document reads with `Get-Content -Raw`: succeeded for `AGENTS.md`, `Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md`, `IMPLEMENTATION_PROMPT_FOR_CODEX.md`, `docs/ACCEPTANCE_CRITERIA.md`, `docs/TASK_QUEUE.md`, `docs/API_SOCKET_CONTRACT.md`, `docs/EVENT_PACKAGE_SPEC.md`, `docs/OVERLAY_SPEC.md`, `docs/OPERATOR_REHEARSAL_CHECKLIST.md`, and the required working handoffs through `WORKING_HANDOFF_AFTER_SYSTEM_HEALTH_DASHBOARD.md`.
- `Get-Content -Raw` for root/app package files and Vite configs: passed; confirmed server `3000`, dashboard `5173`, overlay `5174`, and current local host/proxy defaults.
- `Test-Path -LiteralPath 'docs\deployment-guide.md'`: passed before edit; returned `False`, so the guide was created.
- `rg -n "/admin|/admin/system-health|/admin/matches|/admin/teams|/admin/players|/admin/sponsors|/admin/themes|/draft|/producer|/caster" docs\deployment-guide.md`: passed; confirmed dashboard and role route coverage.
- `rg -n "/overlay/draft|/overlay/scorebug|/overlay/preview|/overlay/program|/overlay/emergency|\?debug=1" docs\deployment-guide.md`: passed; confirmed overlay and debug URL coverage.
- `rg -n "192\.168\.0\.50|127\.0\.0\.1|localhost|LAN IP|firewall|Socket.IO|offline|OBS WebSocket|vMix API|TQ-131|rehearsal" docs\deployment-guide.md`: passed; confirmed LAN IP, firewall, offline, Socket.IO, and rehearsal caveat coverage.
- `rg "required OBS WebSocket|required vMix API|required cloud|required internet|required database|required login|required LCU|required Data Dragon|player PC software required|auto-pick required|auto-ban required|rehearsal passed|OBS tested|vMix tested|offline passed" docs\deployment-guide.md`: passed after review; matches were explicit negations that the guide does not claim rehearsal/offline/OBS/vMix passed.
- `rg -n "deployment-guide" README.md`: passed; README link confirmed.
- `rg -n "lint:docs" package.json apps packages games docs README.md`: passed; found only task-document references, so no runnable docs lint script exists in package scripts.
- `git diff --check`: passed before and after this handoff was added.
- `git status --short`: passed; final status shows `README.md` modified plus new untracked `docs/deployment-guide.md` and `WORKING_HANDOFF_AFTER_DEPLOYMENT_GUIDE.md`.
- `git diff --name-only`: passed; showed tracked diff `README.md`; new docs files are untracked and visible through `git status --short`.
- `Get-ChildItem -Force event-packages\sample-event\logs`: passed; only `.gitkeep` is present.

## Verification

- Passed: `docs/deployment-guide.md` includes all required Admin Dashboard URLs.
- Passed: `docs/deployment-guide.md` includes all required role panel URLs.
- Passed: `docs/deployment-guide.md` includes all required overlay browser-source URLs.
- Passed: `docs/deployment-guide.md` includes `?debug=1` variants.
- Passed: `docs/deployment-guide.md` includes LAN IP replacement examples using `192.168.0.50`.
- Passed: `docs/deployment-guide.md` includes firewall and port assumptions for `3000`, `5173`, `5174`, and Socket.IO reachability.
- Passed: `docs/deployment-guide.md` includes offline operation principles and pre-show/post-show checklists.
- Passed: `docs/deployment-guide.md` states OBS WebSocket and vMix API are not required for v0.1.
- Passed: `docs/deployment-guide.md` does not imply player-PC software is required.
- Passed: `docs/deployment-guide.md` does not claim OBS, vMix, offline, or two-device LAN rehearsal passed.
- Passed: `README.md` contains a small link to the deployment guide.
- Passed: `git diff --check`.
- Passed: checked-in sample event logs were not polluted.
- Failed: none.
- Not run / unavailable: docs lint; no `lint:docs` script exists in package scripts.
- Not run / unavailable: heavy application `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm verify`; not run because TQ-102 is docs-only and the task scope requested lightweight repo-safe checks.

## Manual rehearsal

- Required: no for TQ-102 documentation authoring.
- Result: not performed. This guide explicitly states that TQ-131 performs the actual two-device LAN/offline rehearsal and does not claim OBS/vMix/offline rehearsal passed.

## Scope guardrails checked

- Docs-only task.
- No application code changed.
- No server feature added.
- No dashboard feature added.
- No overlay feature added.
- No tests added.
- No OBS WebSocket requirement introduced.
- No vMix API requirement introduced.
- No Companion or Stream Deck requirement introduced.
- No cloud sync, internet, database, SQLite, Prisma, login/auth, official game API, Riot API, LCU, Data Dragon, Garena API, Tencent API, or TiMi API requirement introduced.
- No player-side software, player-side automation, auto-pick, or auto-ban requirement introduced.
- No OBS/vMix/two-device/offline rehearsal claimed as performed.
- No checked-in sample event logs mutated.
- No commit made.
- No push made.

## Notes / risks

- The guide intentionally distinguishes local development defaults from LAN-reachable rehearsal setup. The current server and Vite defaults bind to `127.0.0.1`; operators must confirm host binding and firewall access during TQ-131 before opening the apps from other devices.
- The guide documents v0.1 running dashboard and overlay as separate local Vite apps, consistent with current repo state.
- The guide is not a substitute for actual OBS/vMix or offline LAN rehearsal.

## Suggested next task

- TQ-110 - Create Operator Guide
