# Multi-MOBA Esports Broadcast Toolkit

This repository is the v0.1 workspace baseline for a local-first, manual-first esports broadcast control system.

The architecture is intentionally game-agnostic at the core. Universal Ban/Pick logic belongs in `packages/core-draft`, production control belongs in `packages/core-production`, and game-specific behavior belongs under `games/*`.

## Current Status

This repository now contains the early v0.1 foundation for the local server runtime, sample event package loading, Socket.IO realtime sync, and the first read-only Admin Dashboard app shell.

Implemented so far:

- pnpm workspace layout.
- Shared TypeScript contracts and core match/draft/production packages.
- Local sample event package with Generic MOBA, LoL sample, AOV sample, and HoK sample adapter data.
- Node server with local event package loading, health/state/adapters/draft/production REST APIs, append-only JSONL audit logging for accepted mutations, and read-only Socket.IO state sync.
- React + TypeScript + Vite Admin Dashboard with admin, draft operator, producer, and caster/read-only panels.
- Root lint, typecheck, test, build, and verify scripts.
- Root `verify` script that runs lint, typecheck, test, and build.

Not implemented yet:

- Overlay routes.
- OBS/vMix integration.
- Cloud sync, database persistence, login, official game-client sync, or player-side automation.

## Workspace Shape

```text
apps/server
apps/admin-dashboard
apps/overlay
packages/shared-types
packages/core-match
packages/core-draft
packages/core-production
packages/core-overlay
packages/theme-engine
games/generic-moba
games/lol
games/aov
games/hok
event-packages/sample-event
tests
docs
```

## Commands

After `pnpm` is available, the root scripts are:

```bash
pnpm install
pnpm -r list
pnpm typecheck
pnpm build
pnpm test
pnpm lint
pnpm verify
```

`lint`, `typecheck`, `test`, `build`, and `verify` are real verification commands for the current workspace. Some later role panels and overlay apps remain placeholders until their task queue items are implemented.

For local admin dashboard development, start the server and dashboard in separate terminals:

```bash
pnpm --filter @mmbt/server dev
pnpm --filter @mmbt/admin-dashboard dev
```

The Admin Dashboard runs as a Vite app at `http://127.0.0.1:5173/admin` by default and proxies `/api` plus `/socket.io` to the local server at `http://127.0.0.1:3000`. Set `MMBT_SERVER_URL` before starting the dashboard if the server is on another local port.

Implemented dashboard role routes include:

```text
/admin
/admin/matches
/admin/teams
/admin/players
/admin/sponsors
/admin/themes
/admin/system-health
/draft
/draft/:matchId
/producer
/producer/:matchId
/caster
/caster/:matchId
```

## v0.1 Guardrails

The v0.1 system must remain:

- Local-first.
- Manual-first.
- Production-safe.
- Game-agnostic in universal core packages.
- Free of player-side automation.
- Free of auto-pick and auto-ban behavior.
- Free of required cloud, OBS WebSocket, vMix API, database, or login dependencies.

LoL-specific in-game HUD, client readers, and asset sync are future plugin scope and are not implemented in this skeleton.
