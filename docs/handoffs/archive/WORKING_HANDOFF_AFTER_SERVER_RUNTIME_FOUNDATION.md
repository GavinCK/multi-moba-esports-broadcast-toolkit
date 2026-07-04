Summary:
- Completed TQ-070 as an expanded server runtime foundation per the latest user prompt.
- Replaced the server skeleton with a local Node HTTP server app that can start on a local host/port.
- Added a deterministic local event package loader for `event-packages/sample-event`.
- The loader reads local JSON files, validates event/team/player/sponsor/match/game data through `core-match`, validates rulesets through `core-draft`, validates themes through `theme-engine`, rejects unsafe local package fields/paths, and returns structured success/failure results.
- Added read-only REST endpoints: `GET /health`, `GET /api/health`, `GET /api/event-package`, and `GET /api/matches`.
- All REST responses use the shared `ApiResponse<T>` envelope.
- Added minimal in-memory runtime state: startup timestamp, loaded package result, local package path, revision, initial production state, health status, and asset warnings.
- Added server tests for loader success, missing/invalid package errors, API envelopes, health shape, public-safe/local-only endpoint responses, no Socket.IO runtime, and no forbidden automation/external-integration hooks.
- Updated runtime-relevant core package local imports to explicit `.js` specifiers so their built ESM output can be executed by Node when the server starts.
- Did not add Admin UI, Operator UI, Caster UI, overlay routes/rendering, Socket.IO realtime sync, file watching, hot reload, audit log writing, database persistence, cloud sync, user login, official game APIs, client sync, player-side automation, auto-pick, or auto-ban.

Files changed:
- `package.json`
- `pnpm-lock.yaml`
- `apps/server/package.json`
- `apps/server/src/api.ts`
- `apps/server/src/event-package-loader.ts`
- `apps/server/src/index.ts`
- `apps/server/src/index.test.ts`
- `apps/server/src/paths.ts`
- `apps/server/src/result.ts`
- `apps/server/src/runtime-state.ts`
- `apps/server/src/server.ts`
- `packages/core-draft/src/actions.ts`
- `packages/core-draft/src/index.ts`
- `packages/core-draft/src/lifecycle.ts`
- `packages/core-draft/src/timer.ts`
- `packages/core-draft/src/validation.ts`
- `packages/core-match/src/helpers.ts`
- `packages/core-match/src/index.ts`
- `packages/core-match/src/validation.ts`
- `packages/core-production/src/emergency.ts`
- `packages/core-production/src/graphics.ts`
- `packages/core-production/src/index.ts`
- `packages/core-production/src/selectors.ts`
- `packages/core-production/src/state.ts`
- `packages/core-production/src/validation.ts`
- `packages/theme-engine/src/asset-references.ts`
- `packages/theme-engine/src/constants.ts`
- `packages/theme-engine/src/index.ts`
- `packages/theme-engine/src/merge.ts`
- `packages/theme-engine/src/validation.ts`
- `WORKING_HANDOFF_AFTER_SERVER_RUNTIME_FOUNDATION.md`

Commands run:
- command: Read required source documents (`AGENTS.md`, `docs/TASK_QUEUE.md`, `docs/ACCEPTANCE_CRITERIA.md`, `docs/API_SOCKET_CONTRACT.md`, `docs/EVENT_PACKAGE_SPEC.md`, `docs/BAN_PICK_RULES.md`, `docs/OVERLAY_SPEC.md`, `Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md`, `IMPLEMENTATION_PROMPT_FOR_CODEX.md`, `WORKING_HANDOFF_AFTER_SAMPLE_EVENT_PACKAGE.md`, `WORKING_HANDOFF_AFTER_SAMPLE_EVENT_VALIDATION.md`); result: succeeded.
- command: Repository/package inspection (`Get-ChildItem`, package.json reads, source reads, `git status --short`); result: succeeded.
- command: `pnpm.cmd add -D @types/node@^22.15.29 -w`; result: failed once in sandbox with Corepack EPERM, then passed with approved escalation.
- command: `pnpm.cmd install`; result: passed with approved escalation.
- command: `pnpm.cmd --filter @mmbt/server test`; result: failed before workspace dependency linking, then passed after `pnpm install` and code fixes.
- command: `pnpm.cmd --filter @mmbt/server typecheck`; result: failed before dependency linking and loader narrowing fixes, then passed.
- command: `pnpm.cmd --filter @mmbt/server lint`; result: passed.
- command: `pnpm.cmd --filter @mmbt/server build`; result: failed before dependency linking and loader narrowing fixes, then passed.
- command: `pnpm.cmd --filter @mmbt/core-draft typecheck`; result: passed after ESM import updates.
- command: `pnpm.cmd --filter @mmbt/core-match typecheck`; result: passed after ESM import updates.
- command: `pnpm.cmd --filter @mmbt/core-production typecheck`; result: passed after ESM import updates.
- command: `pnpm.cmd --filter @mmbt/theme-engine typecheck`; result: passed after ESM import updates.
- command: `pnpm.cmd --filter @mmbt/core-draft build`; result: passed after ESM import updates.
- command: `pnpm.cmd --filter @mmbt/core-match build`; result: passed after ESM import updates.
- command: `pnpm.cmd --filter @mmbt/core-production build`; result: passed after ESM import updates.
- command: `pnpm.cmd --filter @mmbt/theme-engine build`; result: passed after ESM import updates.
- command: `pnpm.cmd lint`; result: passed.
- command: `pnpm.cmd typecheck`; result: passed.
- command: `pnpm.cmd test`; result: passed.
- command: `pnpm.cmd build`; result: passed.
- command: `pnpm.cmd verify`; result: passed.
- command: `node -e "import('./apps/server/dist/server.js').then(async ({ startServer }) => { const started = await startServer({ port: 0, host: '127.0.0.1', logger: { log() {}, error: console.error } }); const address = started.server.address(); if (!address || typeof address === 'string') throw new Error('Missing TCP address'); const response = await fetch('http://127.0.0.1:' + address.port + '/api/health'); const body = await response.json(); console.log(JSON.stringify({ status: response.status, ok: body.ok, loadedEventPackageId: body.data?.loadedEventPackageId, currentProductionState: body.data?.currentProductionState })); await new Promise((resolve, reject) => started.server.close((error) => error ? reject(error) : resolve())); })"`; result: passed with `{"status":200,"ok":true,"loadedEventPackageId":"sample-event","currentProductionState":"PRE_SHOW"}`.
- command: `rg "autoPick|autoBan|playerAutomation|clientSync|championSelectSync|liveClient|riotApi|\blcu\b|lcuReader|dataDragon|datadragonSync|garenaApi|tencentApi|timiApi|obsWebSocket|vMixApi|cloudSync|databaseUrl|apiKey|secret|https://|http://" apps packages games event-packages tests`; result: only acceptable test-only guardrail strings, localhost test URL, and SVG namespace URL false positives.
- command: requested `git ls-files -- "<path>"` checks for `node_modules`, `apps/server/dist`, `packages/server/dist`, `event-packages/sample-event/dist`, `tests/sample-event/dist`, `games/aov/dist`, `games/hok/dist`, `games/lol/dist`, `games/generic-moba/dist`, `packages/game-adapters/dist`, `packages/theme-engine/dist`, `packages/core-production/dist`, `packages/core-draft/dist`, `packages/core-match/dist`, `packages/shared-types/dist`; result: no output from all checks.
- command: `git diff --check`; result: passed with Windows LF-to-CRLF warnings only.
- command: `git status --short` and `git diff --stat`; result: reviewed changed files.

Verification:
- Passed: `pnpm.cmd --filter @mmbt/server lint`.
- Passed: `pnpm.cmd --filter @mmbt/server typecheck`.
- Passed: `pnpm.cmd --filter @mmbt/server test`, 5 tests.
- Passed: `pnpm.cmd --filter @mmbt/server build`.
- Passed: `pnpm.cmd lint`.
- Passed: `pnpm.cmd typecheck`.
- Passed: `pnpm.cmd test`.
- Passed: `pnpm.cmd build`.
- Passed: `pnpm.cmd verify`.
- Passed: built server smoke test on local ephemeral port using `/api/health`.
- Passed: static guardrail review with only accepted false positives.
- Passed: no requested `node_modules` or `dist` outputs are tracked.
- Failed: none remaining.
- Not run / unavailable: Socket.IO integration tests, audit log tests, UI/overlay/manual production rehearsal are intentionally out of scope for TQ-070.

Manual rehearsal:
- Required: minimal local server smoke test if a runnable server is added.
- Result: passed. Exact command recorded above started the built server on `127.0.0.1` using port `0`, fetched `/api/health`, confirmed HTTP 200, `ok: true`, `loadedEventPackageId: "sample-event"`, and `currentProductionState: "PRE_SHOW"`, then closed the server.

Scope guardrails checked:
- Server runtime remains local-first.
- Event package loading is local-only.
- No file watcher or hot reload added.
- REST foundation remains minimal and read-only.
- No Admin UI / Operator UI / Caster UI added.
- No overlay routes or overlay rendering added.
- No Socket.IO realtime sync added.
- No database / SQLite / Prisma added.
- No cloud sync or user login added.
- No OBS WebSocket / vMix API / Companion / Stream Deck integration added.
- No official game API / client / live sync integration added.
- No Riot API / LCU / Data Dragon sync added.
- No Garena / Tencent / TiMi API added.
- No player-side automation.
- No auto-pick.
- No auto-ban.
- No hidden competitive information exposure.
- No internet/cloud asset requirement added.
- No node_modules or dist build outputs tracked.

Notes / risks:
- `docs/TASK_QUEUE.md` scopes TQ-070 narrowly as server shell plus health endpoint. The latest user prompt explicitly requested a minimal event package loader and read-only package/matches endpoints, so this implementation intentionally overlaps the beginning of TQ-071 while keeping adapter runtime loading, full `/api/state`, Socket.IO, mutations, and audit writing deferred.
- Adapter loading is not implemented in this task. `adapterStatus` is currently `{}` in health instead of claiming loaded adapters.
- Audit log writing is not implemented in this task. The loader exposes the event package production log path but does not create or append `production-log.jsonl`.
- Built Node ESM runtime required explicit `.js` local import specifiers in core packages used by the server. This was a runtime-hardening change, not a behavior change to draft/match/production/theme logic.
- `@types/node` was added as a root dev dependency so the server package can typecheck Node runtime APIs.
- Static guardrail search false positives are intentional test-only forbidden strings, the localhost test URL in `apps/server/src/index.test.ts`, and standard SVG namespace URLs in local placeholder SVG assets.

Suggested next task:
- TQ-071 - Implement Event Package and Adapter Loading in Server Runtime. Focus on adding runtime adapter loading, adapter health, and documented read endpoints such as `/api/state` and `/api/adapters`, building on this loader without adding UI, overlays, Socket.IO mutations, or audit writing unless the task queue explicitly scopes them.
