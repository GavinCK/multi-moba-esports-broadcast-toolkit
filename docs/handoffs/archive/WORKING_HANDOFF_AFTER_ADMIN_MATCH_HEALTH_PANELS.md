Summary:
- Completed TQ-081: Implement Admin Match Setup and System Health Panels.
- Expanded the existing `@mmbt/admin-dashboard` app into a read-only admin surface with lightweight section navigation for `/admin`, `/admin/matches`, `/admin/teams`, `/admin/players`, `/admin/sponsors`, `/admin/themes`, and `/admin/system-health`.
- Added client-only match selection for inspection, richer selected-match setup detail, game/ruleset/theme/draft linkage visibility, team rosters, sponsor references, adapter summaries, and setup warnings.
- Added a safe System Health section showing server/REST/realtime status, loaded package, runtime revision, production state, emergency status, connected client groups, adapter health, missing asset counts, warning codes, and audit-writer readiness without exposing raw socket IDs, log paths, raw warning messages, or raw emergency details.
- Added selector helpers and tests for selected match derivation, setup warnings, and health summaries.
- Kept the task read-only: no draft mutation UI, no production mutation UI, no Operator/Producer/Caster panels, no overlay routes/rendering, no official game API/client sync, no database, no cloud, no login, no auto-pick, and no auto-ban.

Files changed:
- `apps/admin-dashboard/src/App.tsx`
- `apps/admin-dashboard/src/App.test.tsx`
- `apps/admin-dashboard/src/state/selectors.ts`
- `apps/admin-dashboard/src/state/selectors.test.ts`
- `apps/admin-dashboard/src/styles.css`
- `WORKING_HANDOFF_AFTER_ADMIN_MATCH_HEALTH_PANELS.md`

Commands run:
- command: Read required source documents and task prompt attachment; result: succeeded.
- command: `rg -n -C 80 "TQ-081" docs\TASK_QUEUE.md`; result: confirmed TQ-081 scope and read-only/admin-health requirements.
- command: `pnpm.cmd --filter @mmbt/admin-dashboard typecheck`; result: failed once in sandbox due Corepack EPERM, then passed with approved escalation.
- command: `pnpm.cmd --filter @mmbt/admin-dashboard lint`; result: failed once in sandbox due Corepack EPERM, then passed with approved escalation.
- command: `pnpm.cmd --filter @mmbt/admin-dashboard test`; result: failed once in sandbox due Corepack EPERM, then passed with approved escalation, 19 tests.
- command: `pnpm.cmd --filter @mmbt/admin-dashboard build`; result: passed.
- command: `pnpm.cmd lint`; result: passed.
- command: `pnpm.cmd typecheck`; result: passed.
- command: `pnpm.cmd test`; result: passed.
- command: `pnpm.cmd build`; result: passed.
- command: `pnpm.cmd verify`; result: passed.
- command: first local smoke script from repo root; result: failed because `vite` is scoped to the admin package and not resolvable from repo root.
- command: local smoke script from `apps/admin-dashboard`; result: passed for `/admin`, `/admin/system-health`, proxied `/api/health`, and proxied `/api/state`.
- command: broad requested `rg` guardrail search across `apps packages games event-packages tests`; result: only accepted test-only assertions/guardrail strings, localhost/dev proxy URLs, and SVG namespace URLs.
- command: requested targeted admin source search for forbidden controls; result: only accepted negative test assertion in `App.test.tsx`.
- command: production-source guardrail search excluding tests/SVGs/local Vite proxy config; result: no matches.
- command: targeted admin production-source forbidden-control search excluding tests; result: no matches.
- command: `git ls-files -- "node_modules" "apps/*/node_modules" "packages/*/node_modules" "games/*/node_modules" "apps/*/dist" "packages/*/dist" "games/*/dist" ".turbo" ".vite" "coverage"`; result: no tracked generated artifacts.
- command: `Get-ChildItem -Force event-packages\sample-event\logs`; result: only `.gitkeep` present.
- command: `git diff --check`; result: passed.
- command: `git status --short`; result: reviewed final changed files.

Verification:
- Passed: Admin lint.
- Passed: Admin typecheck.
- Passed: Admin tests, 19 tests.
- Passed: Admin build.
- Passed: Root lint.
- Passed: Root typecheck.
- Passed: Root test.
- Passed: Root build.
- Passed: Root verify.
- Passed: local script smoke for `/admin`, `/admin/system-health`, `/api/health`, `/api/state`, `sample-event`, 4 matches, and 4 adapters.
- Passed: static guardrail review; production source has no forbidden live controls or future-integration dependencies.
- Passed: no generated runtime `production-log.jsonl` exists in `event-packages/sample-event/logs`.
- Passed: no requested `node_modules` or `dist` outputs are tracked.
- Failed: initial non-escalated pnpm commands failed due Corepack cache access outside the workspace sandbox; approved reruns passed.
- Failed then resolved: first smoke script failed from repo root because `vite` is package-scoped; rerun from `apps/admin-dashboard` passed.
- Not run / unavailable: browser visual QA through in-app Browser was not retried for this task; the previous TQ-080 handoff recorded Browser runtime startup failure, and this task used automated render tests plus scriptable HTTP smoke instead.

Manual rehearsal:
- Required: minimal local admin dashboard smoke test if practical.
- Result: passed scriptable local smoke. The built server started on `127.0.0.1` using port `0`; a Vite dev server started from `apps/admin-dashboard` with local proxying to that server. Checked `/admin` HTTP 200, `/admin/system-health` HTTP 200, `/api/health` `ok: true`, `/api/state` `ok: true`, `eventPackageId: "sample-event"`, 4 matches, and 4 adapters. Both local servers were closed by the script.

Scope guardrails checked:
- Admin dashboard remains admin-focused.
- Match setup panels do not become live Operator controls.
- System health panels expose only safe local runtime status.
- Client state remains read-oriented.
- REST remains authoritative for mutations.
- Socket.IO client remains read-only realtime sync.
- No draft hover/lock/start/reset/complete/undo/redo UI added.
- No production preview/take/clear/emergency UI added.
- No Operator UI / Producer UI / Caster UI added.
- No overlay routes or overlay rendering added.
- No OBS WebSocket integration.
- No vMix API integration.
- No Companion / Stream Deck integration.
- No database / SQLite / Prisma added.
- No cloud sync or user login added.
- No file watcher beyond normal frontend dev server behavior.
- No official game API / client / live sync integration added.
- No Riot API / LCU / Data Dragon sync added.
- No Garena / Tencent / TiMi API added.
- No player-side automation.
- No auto-pick.
- No auto-ban.
- No hidden competitive information exposure.
- No internet/cloud runtime asset requirement added.
- No generated runtime audit log is committed.
- No node_modules or dist build outputs tracked.

Notes / risks:
- Route coverage is implemented as a lightweight SPA section mapper, not a full router. Direct paths such as `/admin/system-health` map to the corresponding section when the app loads.
- Match selection is client-only and only changes which match detail panel is visible. It does not switch active match or mutate server state.
- The health panel intentionally groups Socket.IO clients by role/panel and does not display raw socket IDs.
- Warning panels show warning codes instead of raw server warning messages to avoid surfacing secrets, paths, or operator-entered details.
- Audit log status is displayed as writable/needs review without showing the log file path or raw log contents.
- Build output exists in ignored `dist/` folders after verification, but no build output is tracked.

Suggested next task:
- TQ-082 - Implement Draft Operator Panel. This is the first queued task that explicitly scopes Operator controls; keep dangerous actions confirmation-gated and server-logged.
