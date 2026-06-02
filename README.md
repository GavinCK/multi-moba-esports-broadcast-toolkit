# Multi-MOBA Esports Broadcast Toolkit v0.1

## Project Overview

Multi-MOBA Esports Broadcast Toolkit v0.1 is a local-first, manual-first, production-safe broadcast control system for live MOBA esports events.

The project is designed as a game-agnostic foundation, not a League of Legends-only tool. Universal Ban/Pick logic belongs in `packages/core-draft`, production control belongs above draft and game adapters in `packages/core-production`, and game-specific data belongs under `games/*`.

The current v0.1 implementation includes:

- Node server for local REST APIs, Socket.IO state sync, event package loading, and append-only JSONL audit logging.
- React Admin Dashboard app for Admin, Draft Operator, Producer, and Caster/read-only panels.
- React Overlay app for OBS/vMix-compatible browser-source routes.
- Local JSON sample event package with local assets and fallbacks.
- Generic MOBA, LoL sample, AOV sample, and HoK sample adapter structure.

The system is intended to run on a trusted private production LAN without requiring internet access during live show operation after dependencies are installed.

## Current v0.1 Scope

v0.1 focuses on the reliable manual foundation:

- pnpm monorepo.
- Shared TypeScript contracts.
- Core match, draft, and production packages.
- Generic MOBA, LoL sample, AOV sample, and HoK sample adapters.
- Local sample event package.
- Local server runtime.
- REST APIs.
- Socket.IO read-only realtime sync.
- Append-only JSONL audit logging.
- Admin Dashboard.
- Draft Operator Panel.
- Producer Panel.
- Caster/read-only Panel.
- Overlay routes:
  - `/overlay/draft/:matchId`
  - `/overlay/scorebug/:matchId`
  - `/overlay/preview`
  - `/overlay/program`
  - `/overlay/emergency`
- System health dashboard.
- Local LAN, operator, and game-adapter documentation.

## What Is Not in v0.1

These are out of scope for v0.1 and are not required for live operation:

- OBS WebSocket integration.
- vMix API integration.
- Companion / Stream Deck integration.
- Cloud sync.
- External database.
- SQLite.
- Prisma.
- Login/auth.
- Official game APIs.
- Riot API.
- LCU.
- Data Dragon automatic sync.
- Garena API.
- Tencent API.
- TiMi API.
- Player-side software.
- Player-side automation.
- Auto-pick.
- Auto-ban.
- LoL in-game HUD.
- Objective tracker.
- Hidden competitive information display.

Future integrations must preserve manual fallback and stay out of the universal draft core.

## Repository Layout

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

## Install

Install dependencies from the repository root:

```bash
pnpm install
```

## Run Locally

Start each service from the repository root in separate terminals.

Server:

```bash
pnpm --filter @mmbt/server dev
```

Admin Dashboard:

```bash
pnpm --filter @mmbt/admin-dashboard dev
```

Overlay app:

```bash
pnpm --filter @mmbt/overlay dev
```

Default local development URLs:

- Server: `http://127.0.0.1:3000`
- Admin Dashboard: `http://127.0.0.1:5173`
- Overlay App: `http://127.0.0.1:5174`

For other devices on the same LAN, replace `127.0.0.1` with the control machine LAN IP. Actual host binding and firewall access must be confirmed during rehearsal. See [Local LAN deployment and browser source guide](docs/deployment-guide.md).

## Common URLs

Admin and role panel routes use the Admin Dashboard app host.

Route patterns:

```text
/admin
/admin/system-health
/admin/matches
/admin/teams
/admin/players
/admin/sponsors
/admin/themes
/draft
/draft/:matchId
/producer
/producer/:matchId
/caster
/caster/:matchId
```

Local examples:

```text
http://127.0.0.1:5173/admin/system-health
http://127.0.0.1:5173/draft/match_grand-final
http://127.0.0.1:5173/producer/match_grand-final
http://127.0.0.1:5173/caster/match_grand-final
```

OBS/vMix browser-source overlay routes use the Overlay app host.

Route patterns:

```text
/overlay/draft/:matchId
/overlay/scorebug/:matchId
/overlay/preview
/overlay/program
/overlay/emergency
```

Local examples:

```text
http://127.0.0.1:5174/overlay/draft/match_grand-final
http://127.0.0.1:5174/overlay/scorebug/match_grand-final
http://127.0.0.1:5174/overlay/preview
http://127.0.0.1:5174/overlay/program
http://127.0.0.1:5174/overlay/emergency
```

Add `?debug=1` to supported overlay routes during rehearsal or troubleshooting:

```text
http://127.0.0.1:5174/overlay/draft/match_grand-final?debug=1
http://127.0.0.1:5174/overlay/program?debug=1
```

Debug mode is for public-safe diagnostics such as route, match ID, realtime status, server status, revision, and last update timestamp. Standard Program output should normally use non-debug URLs.

## Sample Event Package

The sample event package lives at:

```text
event-packages/sample-event
```

It is a local JSON event package with sample event, match, team, player, sponsor, ruleset, theme, adapter, asset, and fallback data for local development and rehearsal.

The sample package logs folder contains a checked-in `.gitkeep`:

```text
event-packages/sample-event/logs/.gitkeep
```

During operation, the server may create a local append-only audit file such as:

```text
event-packages/sample-event/logs/production-log.jsonl
```

Do not pollute checked-in sample-event logs with runtime rehearsal or show logs unless the team explicitly intends to archive that log in source control.

## Verification Commands

Root development and verification commands:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify
```

`pnpm verify` runs:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Health and Audit Notes

Open the health dashboard at:

```text
http://127.0.0.1:5173/admin/system-health
```

`/admin/system-health` shows server, realtime, connected clients, adapters, assets, production state, emergency state, and audit log status.

Important accepted mutations are written to the local append-only JSONL audit log. Audit write failures surface in health and should be treated as live-production risk before continuing with live actions.

## Documentation

- [Local LAN deployment and browser source guide](docs/deployment-guide.md)
- [Operator guide](docs/operator-guide.md)
- [Game adapter developer guide](docs/game-adapter-guide.md)
- [Operator rehearsal checklist](docs/OPERATOR_REHEARSAL_CHECKLIST.md)
- [Acceptance criteria](docs/ACCEPTANCE_CRITERIA.md)
- [Task queue](docs/TASK_QUEUE.md)
- [API and Socket.IO contract](docs/API_SOCKET_CONTRACT.md)
- [Event package spec](docs/EVENT_PACKAGE_SPEC.md)
- [Overlay spec](docs/OVERLAY_SPEC.md)
- [Ban/Pick rules](docs/BAN_PICK_RULES.md)

## Known Limitations

- Local dev defaults may bind to `127.0.0.1`; LAN use requires host binding and firewall confirmation during rehearsal.
- Browser visual QA, OBS rehearsal, and vMix rehearsal are not claimed by this README.
- Two-device LAN rehearsal and offline rehearsal are not claimed by this README.
- TQ-131 is where full local manual rehearsal happens.
- v0.1 has no auth/login and assumes a trusted production LAN.
- v0.1 has no player-side automation or game-client sync.
- Official game APIs, Riot API, LCU, Data Dragon automatic sync, Garena API, Tencent API, TiMi API, LoL in-game HUD, and objective tracking remain outside v0.1 live operation.

## Guardrails

For v0.1 live operation:

- Manual operation must always work.
- Overlay routes are read-only browser-source outputs.
- Production output changes must be deliberate.
- Dangerous actions such as reset, complete, Take, Clear, and Emergency must require confirmation where implemented.
- Universal draft code must remain game-agnostic.
- LoL-specific future plugin work must remain separate from the universal core.
- OBS WebSocket, vMix API, cloud sync, internet, external database, login/auth, official game APIs, player-PC software, auto-pick, and auto-ban are not required for v0.1.
