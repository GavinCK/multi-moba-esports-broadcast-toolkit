# Working Handoff After Score Bug Overlay

Date: 2026-06-02

Branch: `main`

Task: TQ-092 - Implement Score Bug Overlay

Commit/push status: not committed, not pushed.

## Summary

- Implemented the read-only `/overlay/scorebug/:matchId` score bug visual route in `apps/overlay`.
- Added a compact, fixed 1920x1080 browser-source-safe score bug that renders blue/red team identity, logos or CSS fallbacks, match score, current game number, match format, status, event/match context, optional score bug sponsor, theme colors, and safe standby states.
- Score is sourced only from public match state: `match.score.blue`, `match.score.red`, `match.currentGameNumber`, `match.format`, and `match.status`.
- Added public-safe score bug diagnostics behind `?debug=1`; normal mode hides debug-only text.
- Kept Program, Preview, and Emergency full graphics out of scope.

## Files changed

- `README.md`
- `apps/overlay/src/App.test.tsx`
- `apps/overlay/src/routes/OverlayRouteView.tsx`
- `apps/overlay/src/styles.css`
- `apps/overlay/src/overlays/ScoreBugOverlay.tsx`
- `apps/overlay/src/overlays/ScoreBugOverlay.test.tsx`
- `WORKING_HANDOFF_AFTER_SCORE_BUG_OVERLAY.md`

## Commands run

- `git status --short`: passed; clean before implementation.
- `git branch --show-current`: passed; `main`.
- `git log --oneline -5`: passed; latest commit before work was `34c41ad feat(overlay): add draft overlay`.
- `pnpm.cmd install --frozen-lockfile`: failed first in sandbox with Corepack `EPERM`; approved rerun passed.
- `pnpm.cmd verify`: failed first in sandbox with Corepack `EPERM`; approved rerun passed before implementation.
- `pnpm.cmd --filter @mmbt/overlay lint`: passed before implementation and after implementation.
- `pnpm.cmd --filter @mmbt/overlay typecheck`: passed before implementation and after implementation.
- `pnpm.cmd --filter @mmbt/overlay test`: passed before implementation with 23 tests; passed after implementation with 34 tests.
- `pnpm.cmd --filter @mmbt/overlay build`: passed before implementation and after implementation.
- `pnpm.cmd lint`: passed.
- `pnpm.cmd typecheck`: passed.
- `pnpm.cmd test`: passed.
- `pnpm.cmd build`: passed.
- `pnpm.cmd verify`: passed after implementation.
- `pnpm.cmd install --frozen-lockfile`: passed after implementation; emitted the existing Node `url.parse()` deprecation warning.
- Overlay mutation REST `rg` scan: passed with no matches.
- Overlay socket mutation `rg` scan: reviewed matches; accepted only read-only `client:hello` / `state:request-full` emits, read-only listener constants, and negative tests.
- Future-scope `rg` scan: reviewed matches; accepted only guardrail/negative tests and adapter boundary tests.
- `git ls-files -- "node_modules" "apps/*/node_modules" "packages/*/node_modules" "games/*/node_modules" "apps/*/dist" "packages/*/dist" "games/*/dist" ".turbo" ".vite" "coverage"`: passed with no tracked generated artifacts.
- `Get-ChildItem -Force event-packages\sample-event\logs`: passed; only `.gitkeep` present.
- `git diff --check`: passed before handoff creation.
- HTTP smoke with local built server and overlay Vite dev server: first attempt failed due missing guessed Vite path; second attempt reached routes but timed out because `cmd.exe` did not terminate its child; final direct Vite JS smoke passed.
- Final HTTP smoke result: `/api/health` returned ok, `/overlay/scorebug/match_grand-final` returned HTTP 200, `/overlay/scorebug/match_grand-final?debug=1` returned HTTP 200, `/overlay/scorebug/missing-match` returned HTTP 200, and no `production-log.jsonl` was created.
- In-app Browser setup: failed with known Windows sandbox startup issue `windows sandbox failed: spawn setup refresh`.

## Verification

- Passed: overlay lint.
- Passed: overlay typecheck.
- Passed: overlay tests, 6 files / 34 tests.
- Passed: overlay build.
- Passed: root lint.
- Passed: root typecheck.
- Passed: root tests.
- Passed: root build.
- Passed: root verify.
- Passed: final frozen install check.
- Passed: static read-only overlay REST guardrail.
- Passed: static read-only overlay socket guardrail after review of accepted matches.
- Passed: future-scope guardrail after review of accepted matches.
- Passed: repository generated-artifact hygiene check.
- Passed: final HTTP route smoke for scorebug normal/debug/missing-match routes.
- Failed first then passed: Corepack sandbox `EPERM` on `pnpm.cmd install --frozen-lockfile` and `pnpm.cmd verify`.
- Failed first then passed: scriptable HTTP smoke after correcting the Vite executable path and cleanup behavior.
- Failed / unavailable: in-app Browser visual QA due Windows sandbox browser runtime failure.
- Not run / unavailable: OBS/vMix rehearsal.
- Not run / unavailable: Playwright E2E; no E2E suite exists in this repo yet.

## Manual rehearsal

- Required: yes, at least smoke-level route rehearsal where practical.
- Result: scriptable HTTP smoke passed for server health plus scorebug normal/debug/missing-match routes.
- Browser-source visual rehearsal: not completed because the in-app Browser runtime was unavailable.
- OBS/vMix rehearsal: not run.
- Full score update rehearsal: not run because no scoped score mutation UI/API was added or requested for this overlay-only task.

## Scope guardrails checked

- `/overlay/scorebug/:matchId` is read-only.
- No mutation REST endpoints are called from `apps/overlay`.
- No mutation Socket.IO events are emitted from `apps/overlay`.
- Overlay production emits remain limited to `client:hello` and `state:request-full`.
- No draft controls were added.
- No Start Draft, Pause Draft, Resume Draft, Hover, Lock, Undo, Redo, Reset Draft, Complete Draft, or Create Draft control was added.
- No production controls were added.
- No Preview, Take to Program, Clear Program, Trigger Emergency, or Clear Emergency control was added.
- No OBS WebSocket, vMix API, Companion, or Stream Deck integration was added.
- No database, SQLite, Prisma, cloud sync, auth, or login feature was added.
- No official game API, Riot API, LCU, Data Dragon, Garena API, Tencent API, or TiMi API was added.
- No player-side automation was added.
- No auto-pick or auto-ban was added.
- No LoL in-game HUD or objective tracker was added.
- No remote asset download or CDN dependency was added.
- Debug mode does not expose raw socket IDs, raw audit paths, local file paths, raw emergency reason text, stack traces, private operator notes, secret-like values, or hidden competitive information.

## Notes / risks

- Score bug rendering uses CSS logo placeholders when team logos are missing or unsafe. Broken image fallback after a safe but nonexistent local path is still best verified visually in a browser-source run.
- The direct scorebug route remains normal even when emergency is active, matching the TQ-092 direct-route scope. Program/Preview/Emergency priority rendering remains TQ-093 scope.
- Browser visual QA remains recommended before production use because this environment could not start the in-app Browser.
- Score changes can only be rehearsed once a supported score mutation workflow exists; this task did not add one.

## Suggested next task

- TQ-093 - Implement Program, Preview, and Emergency Overlays
