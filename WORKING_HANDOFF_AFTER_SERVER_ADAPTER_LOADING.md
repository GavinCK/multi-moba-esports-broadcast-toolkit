Summary:
- Completed TQ-071 by adding local static adapter loading to the server runtime.
- Loaded and registered the existing Generic MOBA, LoL sample, AOV sample, and HoK sample adapters through the existing game adapter registry package.
- Added adapter-aware runtime health with deterministic known adapter IDs, public adapter metadata, hero/ruleset counts, and structured adapter reference warnings.
- Added read-only REST endpoints: `GET /api/state`, `GET /api/events`, `GET /api/events/:eventId`, `GET /api/teams`, `GET /api/teams/:teamId`, `GET /api/players`, `GET /api/players/:playerId`, `GET /api/sponsors`, `GET /api/sponsors/:sponsorId`, `GET /api/adapters`, and `GET /api/adapters/:adapterId`.
- Preserved the existing TQ-070 read-only endpoints: `GET /health`, `GET /api/health`, `GET /api/event-package`, and `GET /api/matches`.
- Kept the runtime local-first, read-only, manual-first, and free of official game API/client/cloud integration.
- Did not add Socket.IO, UI, overlay routes, draft mutation endpoints, audit writing, file watching, database persistence, user login, or player-side automation.

Files changed:
- `apps/server/package.json`
- `apps/server/src/adapter-loader.ts`
- `apps/server/src/api.ts`
- `apps/server/src/index.ts`
- `apps/server/src/index.test.ts`
- `apps/server/src/runtime-state.ts`
- `apps/server/src/server.ts`
- `packages/game-adapters/src/index.ts`
- `packages/game-adapters/src/registry.ts`
- `games/generic-moba/src/adapter.ts`
- `games/generic-moba/src/index.ts`
- `games/generic-moba/src/rulesets.ts`
- `games/generic-moba/src/validation.ts`
- `games/lol/src/adapter.ts`
- `games/lol/src/index.ts`
- `games/lol/src/rulesets.ts`
- `games/lol/src/validation.ts`
- `games/aov/src/adapter.ts`
- `games/aov/src/index.ts`
- `games/aov/src/rulesets.ts`
- `games/aov/src/validation.ts`
- `games/hok/src/adapter.ts`
- `games/hok/src/index.ts`
- `games/hok/src/rulesets.ts`
- `games/hok/src/validation.ts`
- `pnpm-lock.yaml`
- `WORKING_HANDOFF_AFTER_SERVER_ADAPTER_LOADING.md`

Commands run:
- command: Read required source documents (`AGENTS.md`, `docs/TASK_QUEUE.md`, `docs/ACCEPTANCE_CRITERIA.md`, `docs/API_SOCKET_CONTRACT.md`, `docs/EVENT_PACKAGE_SPEC.md`, `docs/BAN_PICK_RULES.md`, `docs/OVERLAY_SPEC.md`, `Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md`, `IMPLEMENTATION_PROMPT_FOR_CODEX.md`, `WORKING_HANDOFF_AFTER_SAMPLE_EVENT_PACKAGE.md`, `WORKING_HANDOFF_AFTER_SAMPLE_EVENT_VALIDATION.md`, `WORKING_HANDOFF_AFTER_SERVER_RUNTIME_FOUNDATION.md`); result: succeeded.
- command: Repository/source inspection (`git status --short`, `rg --files apps/server packages games event-packages tests`, package/source reads); result: succeeded.
- command: `pnpm.cmd install`; result: failed once in sandbox with Corepack EPERM, then passed with approved escalation.
- command: `pnpm.cmd --filter @mmbt/server lint`; result: failed once in sandbox with Corepack EPERM, then passed with approved escalation.
- command: `pnpm.cmd --filter @mmbt/server typecheck`; result: failed once in sandbox with Corepack EPERM, then passed with approved escalation.
- command: `pnpm.cmd --filter @mmbt/server test`; result: failed once in sandbox with Corepack EPERM, then passed with approved escalation, 10 tests.
- command: `pnpm.cmd --filter @mmbt/server build`; result: failed once in sandbox with Corepack EPERM, then passed with approved escalation.
- command: `pnpm.cmd lint`; result: passed with approved escalation.
- command: `pnpm.cmd typecheck`; result: passed with approved escalation.
- command: `pnpm.cmd test`; result: passed with approved escalation.
- command: `pnpm.cmd build`; result: passed with approved escalation.
- command: `pnpm.cmd verify`; result: passed with approved escalation.
- command: built server smoke test with `node -e "import('./apps/server/dist/server.js')..."`; result: passed for `GET /api/health`, `GET /api/adapters`, and `GET /api/state` on an ephemeral `127.0.0.1` port.
- command: `rg "autoPick|autoBan|playerAutomation|clientSync|championSelectSync|liveClient|riotApi|\blcu\b|lcuReader|dataDragon|datadragonSync|garenaApi|tencentApi|timiApi|obsWebSocket|vMixApi|cloudSync|databaseUrl|apiKey|secret|https://|http://" apps packages games event-packages tests`; result: only accepted false positives in guardrail tests, local smoke-test URL, and SVG namespace strings.
- command: same guardrail `rg` against production sources excluding tests and SVGs; result: no hits.
- command: requested `git ls-files -- "<path>"` checks for `node_modules`, `apps/server/dist`, `packages/server/dist`, `event-packages/sample-event/dist`, `tests/sample-event/dist`, `games/aov/dist`, `games/hok/dist`, `games/lol/dist`, `games/generic-moba/dist`, `packages/game-adapters/dist`, `packages/theme-engine/dist`, `packages/core-production/dist`, `packages/core-draft/dist`, `packages/core-match/dist`, `packages/shared-types/dist`; result: no output from all checks.
- command: `git diff --check`; result: passed with Windows LF-to-CRLF warnings only.

Verification:
- Passed: `pnpm.cmd --filter @mmbt/server lint`.
- Passed: `pnpm.cmd --filter @mmbt/server typecheck`.
- Passed: `pnpm.cmd --filter @mmbt/server test`, 10 tests.
- Passed: `pnpm.cmd --filter @mmbt/server build`.
- Passed: `pnpm.cmd lint`.
- Passed: `pnpm.cmd typecheck`.
- Passed: `pnpm.cmd test`.
- Passed: `pnpm.cmd build`.
- Passed: `pnpm.cmd verify`.
- Passed: built server smoke test on `127.0.0.1` with `/api/health`, `/api/adapters`, and `/api/state`.
- Passed: static guardrail review with only accepted false positives.
- Passed: no requested `node_modules` or `dist` outputs are tracked.
- Failed: none remaining.
- Not run / unavailable: Socket.IO tests, UI/overlay manual rehearsal, draft mutation tests, and audit log write tests remain out of scope for TQ-071.

Manual rehearsal:
- Required: minimal local server smoke test if runnable server remains available.
- Result: passed. Exact command started the built server from `apps/server/dist/server.js` on `127.0.0.1` using port `0`, fetched `/api/health`, `/api/adapters`, and `/api/state`, confirmed HTTP 200 and `ok: true` for all three, confirmed `sample-event` loaded, confirmed 4 adapters returned, then closed the server.

Scope guardrails checked:
- Server runtime remains local-first.
- Adapter loading is local static/manual/sample-only.
- No official game API / client / live sync integration added.
- No Riot API / LCU / Data Dragon sync added.
- No Garena / Tencent / TiMi API added.
- No player-side automation.
- No auto-pick.
- No auto-ban.
- No hidden competitive information exposure.
- No Admin UI / Operator UI / Caster UI added.
- No overlay routes or overlay rendering added.
- No Socket.IO realtime sync added.
- No file watcher or hot reload added.
- No audit log writing added.
- No database / SQLite / Prisma added.
- No cloud sync or user login added.
- No OBS WebSocket / vMix API / Companion / Stream Deck integration added.
- No internet/cloud asset requirement added.
- No node_modules or dist build outputs tracked.

Notes / risks:
- The server runtime creation path is now async so it can safely load adapter hero/ruleset data before the HTTP server starts.
- Adapter endpoint responses intentionally expose serializable public metadata, hero lists, and rulesets only; adapter functions and registry internals are not exposed.
- `GET /api/state` currently includes `drafts: {}` because draft runtime creation and mutations are TQ-072 scope.
- The adapter packages and registry received explicit `.js` local import specifiers so their built ESM output can be executed by the server.
- Guardrail search false positives are intentional forbidden strings in tests, the local `127.0.0.1` smoke-test URL, and standard SVG namespace URLs.
- Existing uncommitted TQ-070 changes were preserved and built on rather than reverted.

Suggested next task:
- TQ-072 - Implement Draft REST APIs and Audit Logging. Do not jump to UI, overlay, Socket.IO, or mutable operator controls beyond what TQ-072 scopes.
