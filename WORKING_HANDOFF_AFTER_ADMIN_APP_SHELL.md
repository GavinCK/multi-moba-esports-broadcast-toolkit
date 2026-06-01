Summary:
- Completed TQ-080: created the first Admin Dashboard browser app shell and read-oriented shared client state foundation.
- Replaced the admin placeholder with a React + TypeScript + Vite app under `apps/admin-dashboard`.
- Added a local API client that consistently unwraps `ApiResponse<T>` from `GET /api/health` and `GET /api/state`.
- Added app-local typed dashboard state, selectors, REST loading/error states, manual refresh, and a read-only Socket.IO client.
- Socket.IO client emits only `client:hello` and `state:request-full`, consumes safe realtime snapshots/health updates, and requests a full state after patch/domain update events.
- Added a practical read-only dashboard shell showing connection/server health, event package summary, current match/team/game/ruleset summary, match list, adapter summary, draft summary, and production/emergency summary.
- Updated `README.md` so the local admin dashboard dev commands no longer describe the app as only a placeholder.
- Kept TQ-080 narrow: no draft mutation UI, no production mutation UI, no operator/producer/caster panel, no overlay routes/rendering, no official game API/client sync, no database, no cloud, and no login.

Files changed:
- `apps/admin-dashboard/package.json`
- `apps/admin-dashboard/tsconfig.json`
- `apps/admin-dashboard/index.html`
- `apps/admin-dashboard/vite.config.ts`
- `apps/admin-dashboard/src/index.ts`
- `apps/admin-dashboard/src/main.tsx`
- `apps/admin-dashboard/src/App.tsx`
- `apps/admin-dashboard/src/App.test.tsx`
- `apps/admin-dashboard/src/styles.css`
- `apps/admin-dashboard/src/client/apiClient.ts`
- `apps/admin-dashboard/src/client/apiClient.test.ts`
- `apps/admin-dashboard/src/client/types.ts`
- `apps/admin-dashboard/src/state/dashboardState.ts`
- `apps/admin-dashboard/src/state/dashboardState.test.ts`
- `apps/admin-dashboard/src/state/selectors.ts`
- `apps/admin-dashboard/src/state/socketClient.ts`
- `apps/admin-dashboard/src/state/useDashboardState.ts`
- `apps/admin-dashboard/src/index.test.ts` removed; superseded by focused API/state/render tests.
- `pnpm-lock.yaml`
- `README.md`
- `WORKING_HANDOFF_AFTER_ADMIN_APP_SHELL.md`

Commands run:
- command: Read required source documents and prior handoffs; result: succeeded.
- command: `git status --short`; result: clean before edits, then reviewed final intentional changes.
- command: repository/source inspection with `rg --files`, package reads, shared/server type reads; result: succeeded.
- command: `pnpm.cmd --filter @mmbt/admin-dashboard add react react-dom socket.io-client`; result: failed once in sandbox with Corepack EPERM, then passed with approved escalation.
- command: `pnpm.cmd --filter @mmbt/admin-dashboard add -D vite @vitejs/plugin-react @types/react @types/react-dom jsdom`; result: failed once in sandbox with Corepack EPERM, then passed with approved escalation.
- command: `pnpm.cmd install`; result: failed once in sandbox with Corepack EPERM, then passed with approved escalation.
- command: `pnpm.cmd --filter @mmbt/admin-dashboard lint`; result: passed.
- command: `pnpm.cmd --filter @mmbt/admin-dashboard typecheck`; result: passed.
- command: `pnpm.cmd --filter @mmbt/admin-dashboard test`; result: passed, 10 tests.
- command: `pnpm.cmd --filter @mmbt/admin-dashboard build`; result: passed.
- command: `pnpm.cmd lint`; result: passed.
- command: `pnpm.cmd typecheck`; result: passed.
- command: `pnpm.cmd test`; result: passed.
- command: `pnpm.cmd build`; result: passed.
- command: `pnpm.cmd verify`; result: passed.
- command: Node smoke from `apps/admin-dashboard` starting built server + Vite dev server on local ports; result: passed for `/admin`, `/api/health`, and `/api/state`.
- command: Attempted in-app Browser check for `http://127.0.0.1:5177/admin`; result: Browser control failed to start because the Node REPL browser runtime exited unexpectedly with a Windows sandbox startup failure.
- command: stopped smoke server/dashboard processes; result: passed.
- command: requested broad static guardrail `rg`; result: only accepted test-only guardrail strings, local test/dev URLs, and SVG namespace URLs.
- command: production-source guardrail `rg` excluding tests/SVGs/dist; result: one reviewed acceptable local dev Vite proxy URL in `apps/admin-dashboard/vite.config.ts`.
- command: `rg "socket\.emit|fetch\(|/api/drafts|/api/production|draft:start|draft:lock|graphics:take|emergency:trigger|Start Draft|Reset Draft|Complete Draft|Take to Program|Clear Program|Trigger Emergency" apps\admin-dashboard\src`; result: only `client:hello`, `state:request-full`, and a negative test assertion.
- command: `git ls-files -- "node_modules" "apps/*/node_modules" "packages/*/node_modules" "games/*/node_modules" "apps/*/dist" "packages/*/dist" "games/*/dist" ".turbo" ".vite" "coverage"`; result: no output.
- command: `Get-ChildItem -Force event-packages\sample-event\logs`; result: only `.gitkeep`.
- command: `git diff --check`; result: passed.

Verification:
- Passed: admin lint.
- Passed: admin typecheck.
- Passed: admin tests, 10 tests covering API envelope unwrap/errors, REST snapshot state, realtime snapshot state, loading UI, summary rendering, error UI, and no mutation controls/overlay routes.
- Passed: admin build.
- Passed: root lint.
- Passed: root typecheck.
- Passed: root test.
- Passed: root build.
- Passed: root verify.
- Passed: local script smoke for `/admin`, `/api/health`, `/api/state`, `sample-event`, 4 matches, and 4 adapters.
- Passed: no requested generated output paths are tracked.
- Passed: no generated `production-log.jsonl` in `event-packages/sample-event/logs`.
- Failed: initial non-escalated pnpm commands failed due Corepack cache access outside sandbox; approved reruns passed.
- Failed: in-app Browser visual smoke could not run because Browser control startup failed in the Node REPL environment.
- Not run / unavailable: full visual browser QA due Browser tool startup failure; Playwright E2E was not added because TQ-080 did not require E2E.

Manual rehearsal:
- Required: minimal local admin app smoke test if practical.
- Result: passed scriptable local smoke. The built server started on `127.0.0.1` using an ephemeral port, Vite served the dashboard locally, `/admin` returned HTTP 200, `/api/health` returned `ok: true`, `/api/state` returned `ok: true`, `eventPackageId: "sample-event"`, 4 matches, and 4 adapters.
- Browser visual check was attempted against `http://127.0.0.1:5177/admin` but Browser control failed before navigation. Dev processes were stopped afterward.

Scope guardrails checked:
- Admin app remains an app shell.
- Client state remains read-oriented.
- REST remains authoritative for mutations.
- Socket.IO client is read-only realtime sync.
- No draft mutation UI added.
- No production mutation UI added.
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
- Route decision: TQ-080 asks for dashboard routes or panel navigation, while TQ-081 owns fuller admin route coverage. This task implements a single SPA shell that works at `/admin` and renders sections without adding CRUD flows or role panels.
- Realtime behavior follows the existing TQ-074 implementation, whose `state:full` payload is the full state snapshot directly inside the socket envelope. The client also accepts the documented `{ revision, timestamp, state }` shape for future compatibility.
- Vite dev proxy uses the local-only default `http://127.0.0.1:3000`; production/live runtime does not require internet or remote assets.
- The dashboard intentionally displays connected client count but not raw socket IDs or operator IDs.
- The dashboard intentionally displays emergency active/ready status but not raw emergency reason text.
- Build output exists in ignored `dist/` folders after verification, but no build output is tracked.

Suggested next task:
- TQ-081 - Implement Admin Match Setup and System Health Panels. Stay read-focused unless the task queue explicitly requires safe confirm/select controls; do not jump to Operator controls, overlay rendering, or production control UI before the queue scopes them.
