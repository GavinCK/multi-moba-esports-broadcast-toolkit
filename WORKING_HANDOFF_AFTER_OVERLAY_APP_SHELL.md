# Working Handoff After Overlay App Shell

## Summary

- Completed TQ-090: Create Overlay App Shell, Socket Client, and Debug Mode.
- Converted `apps/overlay` from the TQ-010 skeleton into a minimal React + TypeScript + Vite browser-source app.
- Added required route foundations:
  - `/overlay/program`
  - `/overlay/preview`
  - `/overlay/draft/:matchId`
  - `/overlay/scorebug/:matchId`
  - `/overlay/emergency`
- Added a 1920x1080 browser-source-safe shell with transparent page/root background, fixed no-scroll behavior, standby/loading/disconnected/stale/missing-match states, and `?debug=1` diagnostics.
- Added a read-only Socket.IO client that emits only `client:hello` and `state:request-full`.
- The overlay socket identity is `role: "OVERLAY"`, `panel: "overlay-shell"`, `clientType: "overlay"`.
- The overlay consumes read-side realtime events and requests a fresh full state after patch/domain updates.
- Debug mode shows public-safe route, match, connection, runtime, server, revision, last update, and emergency active/inactive diagnostics.
- Debug mode intentionally does not show raw socket IDs, audit paths, local file paths, raw emergency reason text, stack traces, or secret-like data.
- Updated README with overlay dev command, local port, required shell routes, and debug query usage.
- Kept TQ-090 narrow: this is shell/debug foundation only, not the full Draft Overlay, Score Bug, or Program/Preview/Emergency graphic implementation.

## Files changed

- `README.md`
- `apps/overlay/package.json`
- `apps/overlay/index.html`
- `apps/overlay/vite.config.ts`
- `apps/overlay/tsconfig.json`
- `apps/overlay/src/index.ts`
- `apps/overlay/src/index.test.ts`
- `apps/overlay/src/App.tsx`
- `apps/overlay/src/App.test.tsx`
- `apps/overlay/src/client/types.ts`
- `apps/overlay/src/components/OverlayDebugPanel.tsx`
- `apps/overlay/src/guardrails.test.ts`
- `apps/overlay/src/main.tsx`
- `apps/overlay/src/routes/OverlayRouteView.tsx`
- `apps/overlay/src/routes/route.ts`
- `apps/overlay/src/routes/selectors.ts`
- `apps/overlay/src/state/overlayState.ts`
- `apps/overlay/src/state/socketClient.ts`
- `apps/overlay/src/state/socketClient.test.ts`
- `apps/overlay/src/state/useOverlayState.ts`
- `apps/overlay/src/styles.css`
- `pnpm-lock.yaml`
- `WORKING_HANDOFF_AFTER_OVERLAY_APP_SHELL.md`

## Commands run

- `git status --short`: clean before edits.
- `git branch --show-current`: `main`.
- `git log --oneline -5`: latest commits reviewed.
- Required source documents and prior handoffs: read successfully.
- `pnpm.cmd install --frozen-lockfile`: failed first in sandbox due Corepack `EPERM`, rerun with approval and passed before implementation.
- `pnpm.cmd verify`: failed first in sandbox due Corepack `EPERM`, rerun with approval and passed before implementation.
- `pnpm.cmd --filter @mmbt/overlay lint`: passed before implementation.
- `pnpm.cmd --filter @mmbt/overlay typecheck`: passed before implementation.
- `pnpm.cmd --filter @mmbt/overlay test`: passed before implementation, 1 skeleton test.
- `pnpm.cmd --filter @mmbt/overlay build`: passed before implementation.
- `pnpm.cmd --filter @mmbt/overlay add @mmbt/shared-types react react-dom socket.io-client`: failed because pnpm tried to fetch workspace package from npm.
- `pnpm.cmd --filter @mmbt/overlay add "@mmbt/shared-types@workspace:*" react react-dom socket.io-client`: passed.
- `pnpm.cmd --filter @mmbt/overlay add -D @types/react @types/react-dom @vitejs/plugin-react vite`: passed.
- `pnpm.cmd install`: passed and refreshed the overlay lockfile entry.
- `pnpm.cmd --filter @mmbt/overlay lint`: passed after implementation.
- `pnpm.cmd --filter @mmbt/overlay typecheck`: passed after implementation.
- `pnpm.cmd --filter @mmbt/overlay test`: passed after implementation, 4 files / 15 tests.
- `pnpm.cmd --filter @mmbt/overlay build`: passed after implementation.
- `pnpm.cmd lint`: passed.
- `pnpm.cmd typecheck`: passed.
- `pnpm.cmd test`: passed.
- `pnpm.cmd build`: passed.
- `pnpm.cmd verify`: passed.
- `pnpm.cmd install --frozen-lockfile`: passed after implementation.
- Overlay REST mutation guardrail `rg`: no matches.
- Overlay socket/event guardrail `rg`: reviewed matches; only accepted negative tests, read-only listener constants for `graphics:preview` / `graphics:clear`, and allowed emits.
- `Select-String` on overlay socket emits: confirmed emits are only `state:request-full` and `client:hello`.
- Broad future-scope guardrail `rg`: reviewed matches; only accepted guardrail/negative tests and adapter boundary tests.
- HTTP route smoke from `apps/overlay`: first inline script failed due shell quoting, next two route-check scripts succeeded but timed out while closing Vite helpers, final simplified smoke passed.
- Final HTTP smoke checked all five routes plus `?debug=1` variants and confirmed no `event-packages/sample-event/logs/production-log.jsonl` was created.
- In-app Browser verification: attempted after reading Browser skill; failed before navigation due known Windows sandbox startup failure: `windows sandbox failed: spawn setup refresh`.
- `git ls-files -- "node_modules" "apps/*/node_modules" "packages/*/node_modules" "games/*/node_modules" "apps/*/dist" "packages/*/dist" "games/*/dist" ".turbo" ".vite" "coverage"`: no tracked generated artifacts.
- `Get-ChildItem -Force event-packages\sample-event\logs`: only `.gitkeep`.
- `git diff --check`: passed.
- `git status --short`: reviewed final changed and untracked files.
- `git diff --name-only`: reviewed tracked file diff list.

## Verification

- Passed: overlay lint.
- Passed: overlay typecheck.
- Passed: overlay tests, 15 tests.
- Passed: overlay build.
- Passed: root lint.
- Passed: root typecheck.
- Passed: root tests.
- Passed: root build.
- Passed: root verify.
- Passed: final frozen install check.
- Passed: HTTP route smoke for `/overlay/program`, `/overlay/preview`, `/overlay/draft/match_grand-final`, `/overlay/scorebug/match_grand-final`, `/overlay/emergency`, and the same routes with `?debug=1`.
- Passed: route smoke confirmed no sample audit log was created.
- Passed: static guardrail scans after review.
- Failed first then passed: non-escalated `pnpm.cmd install --frozen-lockfile` and `pnpm.cmd verify` failed with Corepack `EPERM`; approved reruns passed.
- Failed first then passed: initial dependency add used an unqualified workspace package and failed with npm 404; explicit `@mmbt/shared-types@workspace:*` passed.
- Failed first then passed: first route smoke had shell quoting failure; final route smoke passed.
- Failed / unavailable: in-app Browser visual verification could not run because the Browser runtime crashed with the known Windows sandbox startup issue.
- Not run / unavailable: OBS/vMix visual rehearsal and Playwright E2E; no E2E suite exists for this repo yet.

## Manual rehearsal

- Required: yes, for basic route smoke where practical.
- Result: passed scriptable HTTP smoke for all required routes and debug variants.
- Browser-source visual rehearsal: not completed because in-app Browser runtime was unavailable.
- OBS/vMix rehearsal: not run in this task.
- Full operator rehearsal: not run; remains a later rehearsal task.

## Scope guardrails checked

- Overlay routes are read-only.
- No mutation REST endpoints are called from `apps/overlay`.
- No mutation Socket.IO events are emitted from `apps/overlay`.
- Overlay emits only `client:hello` and `state:request-full`.
- No draft controls were added.
- No Start Draft, Pause, Resume, Hover, Lock, Undo, Redo, Reset Draft, Complete Draft, or Create Draft control was added.
- No production controls were added.
- No Preview control, Take to Program, Clear Program, Trigger Emergency, or Clear Emergency control was added.
- No OBS WebSocket integration was added.
- No vMix API integration was added.
- No Companion or Stream Deck integration was added.
- No database, SQLite, Prisma, cloud sync, auth, or login was added.
- No official game API, Riot API, LCU, Data Dragon, Garena API, Tencent API, or TiMi API was added.
- No player-side automation was added.
- No auto-pick or auto-ban was added.
- No LoL in-game HUD or objective tracker was added.
- No remote asset, CDN, or internet dependency was added.
- Debug mode does not expose raw socket IDs, raw audit paths, local file paths, secret-like values, raw emergency reason text, stack traces, private operator notes, or hidden competitive information.
- No generated `production-log.jsonl`, `node_modules`, `dist`, `.vite`, `.turbo`, or `coverage` artifacts are tracked.

## Notes / risks

- TQ-090 intentionally renders shell/standby placeholders only. It does not implement full draft slots, score bug layout, or Program/Preview/Emergency payload rendering.
- Program and Preview routes currently identify whether a payload exists and show shell/standby text. Full payload rendering belongs to TQ-093.
- Draft and Score Bug routes resolve a match for shell context but do not render full picks/bans/scorebug visuals. Those belong to TQ-091 and TQ-092.
- Emergency route shows fixed public-safe active/standby text and does not echo raw server emergency message text.
- The CSS provides transparent root/page backgrounds and no-scroll browser-source behavior, with a `data-canvas-size="1920x1080"` shell marker.
- Vite route smoke proved HTTP 200/index fallback for route paths but did not prove pixel-level scrollbar behavior because Browser visual runtime was unavailable.
- Build output exists in ignored `dist/` folders after verification, but no build output is tracked.
- The root `pnpm dev` command will now include the overlay Vite dev server because `@mmbt/overlay` has a real dev script.

## Suggested next task

- TQ-091 — Implement Draft Overlay.
