# Working Handoff After Socket Realtime Sync

## Summary

- Completed TQ-074: Implement Socket.IO Realtime Sync for the server runtime.
- Added a read-only Socket.IO layer attached to the existing HTTP server.
- Socket clients receive `state:full` on connect, `client:hello`, explicit full-state request, and reconnect.
- REST remains the only authoritative mutation path. Socket-side mutation events are rejected with explicit `SOCKET_MUTATION_NOT_ALLOWED` errors.
- Accepted REST draft and production mutations now emit realtime envelopes after audit/state commit.
- Health state now tracks connected Socket.IO clients for `/api/health`.
- No UI, overlay routes, OBS/vMix integration, database, login, cloud sync, auto-pick, auto-ban, or player automation were added.

## Files Changed

- `apps/server/package.json`
- `apps/server/src/api.ts`
- `apps/server/src/index.test.ts`
- `apps/server/src/index.ts`
- `apps/server/src/realtime.ts`
- `apps/server/src/runtime-state.ts`
- `apps/server/src/server.ts`
- `apps/server/src/socket.ts`
- `pnpm-lock.yaml`
- `WORKING_HANDOFF_AFTER_SOCKET_REALTIME_SYNC.md`

## Implementation Notes

- `apps/server/src/realtime.ts` defines Socket.IO event constants, mutation-event guardrails, reusable envelope helpers, and broadcaster interfaces.
- `apps/server/src/socket.ts` attaches Socket.IO with `serveClient: false`, tracks readonly clients, serves full-state snapshots, handles heartbeat, and rejects socket mutation attempts.
- `apps/server/src/api.ts` broadcasts only after successful REST mutations and after audit log append/state commit.
- Draft realtime snapshots avoid exposing action `operatorId` inside draft history; socket envelopes and audit log entries may still include the acting operator where contractually expected.
- Production snapshots reuse the existing public production state and avoid exposing raw private emergency details in the realtime production event payloads.
- `state:request-full` and compatibility `state:requestSnapshot` are both supported.

## Realtime Events Added

- Full/snapshot flow: `state:full`, `state:patch`, `state:request-full`, `state:requestSnapshot`, `client:hello`, `client:heartbeat`
- Draft broadcasts: `draft:updated`, `draft:timer`
- Production broadcasts: `production:state`, `graphics:preview`, `graphics:program`, `graphics:clear`
- Supporting broadcasts: `log:entry`, `health:update`, `error`

## Socket Mutation Guardrail

Socket mutation attempts are registered only to reject, not to mutate state. Covered mutation-like events include:

- `draft:start`
- `draft:pause`
- `draft:resume`
- `draft:reset`
- `draft:complete`
- `draft:hover`
- `draft:lock`
- `draft:undo`
- `draft:timer`
- `draft:override`
- `production:set-state`
- `graphics:preview`
- `graphics:take`
- `graphics:clear`
- `emergency:trigger`
- `emergency:clear`
- `match:set-active`
- `result:set`
- `result:unlock`

## Commands Run

- `pnpm.cmd --filter @mmbt/server add socket.io socket.io-client`: initially failed in sandbox due Corepack EPERM; rerun with approved escalation and passed.
- `pnpm.cmd install`: passed after package manifest adjustment.
- `pnpm.cmd --filter @mmbt/server lint`: passed.
- `pnpm.cmd --filter @mmbt/server typecheck`: passed.
- `pnpm.cmd --filter @mmbt/server test`: initially exposed a realtime close behavior issue; after the fix, passed with 23 tests.
- `pnpm.cmd --filter @mmbt/server build`: passed.
- `pnpm.cmd lint`: passed.
- `pnpm.cmd typecheck`: passed.
- `pnpm.cmd test`: passed.
- `pnpm.cmd build`: passed.
- `pnpm.cmd verify`: passed after the final socket redaction patch.
- Manual smoke from repo root: failed because `socket.io-client` is scoped as the server package devDependency.
- Manual smoke from `apps/server`: passed. It started the built server on `127.0.0.1:0`, checked `/api/health`, received `state:full`, posted `POST /api/production/state`, received `production:state`, and confirmed an isolated temp JSONL audit log was created.
- Static forbidden-scope guardrail: passed for production source after redaction patch.
- Broad forbidden-scope scan: only accepted false positives in tests, safety strings, local test URLs, and SVG namespace URLs.
- `git ls-files -- "node_modules" "apps/*/node_modules" "packages/*/node_modules" "games/*/node_modules" "apps/*/dist" "packages/*/dist" "games/*/dist" ".turbo" ".vite" "coverage"`: no tracked generated artifacts found.
- `Get-ChildItem -Force event-packages\sample-event\logs`: only `.gitkeep` present.
- `git diff --check`: passed.

## Verification

- Passed: server lint, server typecheck, server tests, server build.
- Passed: root lint, root typecheck, root tests, root build, root verify.
- Passed: manual server + Socket.IO smoke test from `apps/server`.
- Passed: production-source forbidden-scope guardrail.
- Failed: none remaining.
- Not run: UI/overlay browser rehearsal, because TQ-074 is server-only and no UI/overlay implementation was requested.
- Not run: Playwright E2E, because no E2E suite is currently part of this task path.

## Scope Guardrails Checked

- No UI implementation.
- No overlay implementation.
- No OBS WebSocket or vMix integration.
- No database or SQLite.
- No cloud dependency.
- No login/auth system.
- No client-side sync package.
- No auto-pick or auto-ban.
- No player-side automation.
- No LoL LCU, Data Dragon sync, or in-game HUD implementation.
- No game-specific logic added to universal draft core.

## Notes / Risks

- Socket.IO currently provides broad server-level realtime sync, not per-match rooms. This matches the minimal v0.1 server-only scope but can be refined later if client scale or route isolation requires it.
- Health client tracking is intentionally simple and readonly. It records role/panel/client type metadata when safely supplied by clients.
- Socket mutation event names are explicitly registered so clients receive machine-readable errors instead of silent no-ops.
- `socket.io-client` is a devDependency of `@mmbt/server`, so ad hoc smoke scripts that import it should run from `apps/server` or through the server test harness.

## Suggested Next Task

- TQ-080: Create Admin Dashboard App Shell and Shared Client State.
