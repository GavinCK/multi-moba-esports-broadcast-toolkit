# Multi-MOBA Esports Broadcast Toolkit

This repository is the v0.1 workspace baseline for a local-first, manual-first esports broadcast control system.

The architecture is intentionally game-agnostic at the core. Universal Ban/Pick logic belongs in `packages/core-draft`, production control belongs in `packages/core-production`, and game-specific behavior belongs under `games/*`.

## Current Status

This is the TQ-011 baseline tooling setup. It keeps the TQ-010 monorepo skeleton intact and adds standard verification commands.

Implemented in this step:

- pnpm workspace layout.
- Placeholder apps, packages, and game folders.
- Root TypeScript config.
- TypeScript build and typecheck scripts for every workspace package.
- ESLint baseline for placeholder TypeScript sources.
- Vitest baseline tests for placeholder workspace exports.
- Root `verify` script that runs lint, typecheck, test, and build.

Not implemented yet:

- Server APIs or Socket.IO runtime.
- Admin dashboard UI.
- Overlay routes.
- Shared production data types.
- Universal draft logic.
- Game adapter data.
- Sample event JSON fixtures.
- Audit logging.

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

For this baseline task, `dev` scripts still report placeholder status because server, dashboard, and overlay runtimes are not implemented yet. `lint`, `typecheck`, `test`, `build`, and `verify` are real verification commands for the current placeholder workspace.

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
