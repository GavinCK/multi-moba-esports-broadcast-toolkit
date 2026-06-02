# Working Handoff After README Local Run and v0.1 Scope

Summary:
- Completed TQ-112: Update README with Local Run and v0.1 Scope.
- Reworked `README.md` into a practical high-level entry point for developers and production operators.
- Documented project overview, v0.1 scope, out-of-scope items, install/run commands, development and verification commands, dashboard/role URLs, overlay browser-source URLs, `?debug=1`, sample event package notes, health/audit notes, documentation links, known limitations, and v0.1 guardrails.
- Kept the task docs-only.
- Did not modify application code, tests, package scripts, lockfiles, event package JSON, checked-in sample-event logs, commits, or pushes.

Files changed:
- `README.md`
- `WORKING_HANDOFF_AFTER_README_LOCAL_RUN_SCOPE.md`

Commands run:
- `Get-Content -Raw -LiteralPath 'D:\CodexPrompts\TQ-112_README_LOCAL_RUN_SCOPE.md'`: passed before confirmation; attachment was readable and non-empty.
- `git status --short`: passed before edits; working tree was clean.
- `git branch --show-current`: passed; branch was `main`.
- `git log --oneline -5`: passed; latest commits inspected.
- `Get-ChildItem -Force`: passed; repository root inspected.
- `Get-ChildItem -Force docs`: passed; docs directory inspected.
- Required source document reads with `Get-Content -Raw`: succeeded for `AGENTS.md`, `Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md`, `IMPLEMENTATION_PROMPT_FOR_CODEX.md`, `docs/ACCEPTANCE_CRITERIA.md`, `docs/TASK_QUEUE.md`, `docs/deployment-guide.md`, `docs/operator-guide.md`, `docs/game-adapter-guide.md`, and the required recent working handoffs.
- `Get-Content -Raw` for root and app package files plus Vite configs: passed; README commands and default ports were checked against actual scripts/config.
- `rg -n '"lint:docs"|lint:docs' package.json apps packages games`: returned no matches; no runnable docs lint script exists in workspace package scripts.
- `rg -n "Project Overview|Current v0\.1 Scope|What Is Not in v0\.1|Install|Run Locally|Common URLs|Sample Event Package|Verification Commands|Documentation|Known Limitations|Guardrails" README.md`: passed; required README sections found.
- `rg -n "pnpm install|pnpm --filter @mmbt/server dev|pnpm --filter @mmbt/admin-dashboard dev|pnpm --filter @mmbt/overlay dev|pnpm lint|pnpm typecheck|pnpm test|pnpm build|pnpm verify" README.md`: passed; install/run/verification commands found.
- `rg -n "/admin/system-health|/draft/:matchId|/producer/:matchId|/caster/:matchId|/overlay/draft/:matchId|/overlay/scorebug/:matchId|/overlay/preview|/overlay/program|/overlay/emergency|\?debug=1" README.md`: passed; dashboard/role/overlay/debug routes found.
- `rg -n "docs/deployment-guide.md|docs/operator-guide.md|docs/game-adapter-guide.md|docs/OPERATOR_REHEARSAL_CHECKLIST.md|docs/ACCEPTANCE_CRITERIA.md|docs/TASK_QUEUE.md|docs/API_SOCKET_CONTRACT.md|docs/EVENT_PACKAGE_SPEC.md|docs/OVERLAY_SPEC.md|docs/BAN_PICK_RULES.md" README.md`: passed; required documentation links found.
- `rg -n "OBS WebSocket|vMix API|Cloud sync|External database|SQLite|Prisma|Login/auth|Official game APIs|Riot API|LCU|Data Dragon|Garena API|Tencent API|TiMi API|Player-side software|Player-side automation|Auto-pick|Auto-ban|LoL in-game HUD|Objective tracker|Hidden competitive information" README.md`: passed; out-of-scope/guardrail items found as explicit exclusions.
- `rg "required OBS WebSocket|required vMix API|required cloud|required internet|required database|required login|required LCU|required Data Dragon|player PC software required|auto-pick required|auto-ban required|rehearsal passed|OBS tested|vMix tested|offline passed|implemented LCU|implemented Data Dragon|implemented in-game HUD|v0\.2 implemented|v0\.3 implemented|v0\.4 implemented" README.md`: returned no matches; unsafe claims were not found.
- `git diff --check`: passed after the README edit.
- `git status --short`: passed after the README edit; showed `M README.md`.
- `git diff --name-only`: passed after the README edit; showed `README.md`.
- `git diff -- README.md`: reviewed README diff.
- `Get-ChildItem -Force -LiteralPath 'event-packages\sample-event\logs'`: passed; only `.gitkeep` was present.

Verification:
- Passed: README explains project overview.
- Passed: README states current v0.1 scope.
- Passed: README lists out-of-scope features.
- Passed: README includes `pnpm install`.
- Passed: README includes server, Admin Dashboard, and Overlay app run commands.
- Passed: README includes root development and verification commands.
- Passed: README includes dashboard and role panel URLs.
- Passed: README includes OBS/vMix browser-source overlay URLs.
- Passed: README includes `?debug=1` note.
- Passed: README includes sample event package instructions and log hygiene note.
- Passed: README includes health dashboard and audit log notes.
- Passed: README includes required documentation links.
- Passed: README includes known limitations.
- Passed: README does not claim v0.2, v0.3, or v0.4 features are implemented.
- Passed: README does not imply external services are required.
- Passed: README does not advertise LoL in-game HUD as v0.1.
- Passed: README does not claim OBS, vMix, two-device LAN, offline, or full manual rehearsal passed.
- Passed: checked-in sample-event logs were not polluted.
- Failed: none.
- Not run / unavailable: docs lint; no runnable docs lint package script exists.
- Not run / unavailable: heavy application `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm verify`; not run because TQ-112 is docs-only and requested lightweight repo-safe checks only.

Manual rehearsal:
- Required: no.
- Result: not performed. README explicitly points to TQ-131 for full local manual rehearsal and does not claim OBS/vMix, two-device LAN, offline, browser visual QA, or full live rehearsal passed.

Scope guardrails checked:
- Docs-only task.
- No application code changed.
- No tests changed.
- No package scripts changed.
- No `pnpm-lock.yaml` changes.
- No event package JSON changed.
- No checked-in sample-event logs mutated.
- No new docs besides the required handoff file.
- No OBS WebSocket, vMix API, Companion, Stream Deck, cloud sync, internet, external database, SQLite, Prisma, login/auth, official game API, Riot API, LCU, Data Dragon, Garena API, Tencent API, TiMi API, player-side software, player-side automation, auto-pick, or auto-ban requirement introduced.
- No LoL in-game HUD or objective tracker advertised as v0.1.
- No hidden competitive information display advertised as v0.1.
- No OBS/vMix/two-device/offline rehearsal claimed.
- No commit made.
- No push made.

Notes / risks:
- Local development defaults bind to `127.0.0.1`; LAN use still requires host binding and firewall confirmation during rehearsal.
- README is an entry point, not a replacement for the deployment guide, operator guide, game adapter guide, acceptance criteria, or rehearsal checklist.
- Full local manual rehearsal remains future work in TQ-131.

Suggested next task:
- TQ-120 - Add Static Scope Guardrail Tests
