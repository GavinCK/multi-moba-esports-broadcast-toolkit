# Working Handoff After Draft Operator Panel

## Summary

- Implemented TQ-082 Draft Operator Panel inside the existing `apps/admin-dashboard` package.
- Added `/draft` and `/draft/:matchId` routing to the admin dashboard without creating a separate app.
- Built a manual-first operator workflow for draft selection, hero hover/lock, draft lifecycle actions, undo/redo, reset, and completion.
- Kept draft mutations on REST endpoints only. The dashboard Socket.IO client remains limited to hello and full-state request events.
- Added confirmation gates for dangerous draft actions, including start, lock, undo, redo, reset, and complete.
- Kept production controls, overlay routes, raw audit paths, socket IDs, and sensitive validation details out of the draft operator view.

## Files Changed

- `apps/admin-dashboard/package.json`
- `apps/admin-dashboard/src/App.tsx`
- `apps/admin-dashboard/src/App.test.tsx`
- `apps/admin-dashboard/src/client/apiClient.ts`
- `apps/admin-dashboard/src/client/apiClient.test.ts`
- `apps/admin-dashboard/src/client/types.ts`
- `apps/admin-dashboard/src/draft/DraftOperatorPanel.tsx`
- `apps/admin-dashboard/src/state/socketClient.ts`
- `apps/admin-dashboard/src/state/socketClient.test.ts`
- `apps/admin-dashboard/src/styles.css`

## Implementation Notes

- The panel loads draft summaries from `/api/drafts`, selected draft detail from `/api/drafts/:draftId`, and local adapter data from `/api/adapters/:gameCode`.
- Hero hover and lock use:
  - `/api/drafts/:draftId/actions/:actionId/hover`
  - `/api/drafts/:draftId/actions/:actionId/lock`
- Draft lifecycle actions use:
  - `/api/drafts/:draftId/start`
  - `/api/drafts/:draftId/pause`
  - `/api/drafts/:draftId/resume`
  - `/api/drafts/:draftId/undo`
  - `/api/drafts/:draftId/redo`
  - `/api/drafts/:draftId/reset`
  - `/api/drafts/:draftId/complete`
- The reset dialog requires the typed confirmation `RESET_DRAFT`.
- Undo, redo, and reset require operator-provided reasons.
- A selected game without a draft can create a draft through the documented REST route.
- The `/draft/:matchId` route preselects the match when the URL includes a known match id.

## Commands Run

- `pnpm.cmd --filter @mmbt/admin-dashboard lint`: passed after rerunning outside the sandbox because Corepack access hit `EPERM` inside the sandbox.
- `pnpm.cmd --filter @mmbt/admin-dashboard typecheck`: passed after rerunning outside the sandbox.
- `pnpm.cmd --filter @mmbt/admin-dashboard test`: passed, 5 test files and 28 tests.
- `pnpm.cmd install --frozen-lockfile`: passed, lockfile already up to date.
- `pnpm.cmd verify`: passed. This ran root lint, typecheck, test, and build.
- Read-only local smoke:
  - `GET http://127.0.0.1:3000/api/health`: 200, `ok: true`, status `OK`.
  - `GET http://127.0.0.1:3000/api/state`: 200, `ok: true`.
  - `GET http://127.0.0.1:3000/api/drafts`: 200, `ok: true`, 6 drafts.
  - `GET http://127.0.0.1:4173/draft`: 200.
- Static guardrail scans:
  - Forbidden automation and integration scan reviewed.
  - Draft socket and production-control scan reviewed.
- Repository hygiene:
  - `git ls-files` checks found no tracked `node_modules`, app/package/game `dist`, `.turbo`, `.vite`, or `coverage`.
  - `Get-ChildItem -Force event-packages\sample-event\logs` showed only `.gitkeep`.
  - `git diff --check`: passed.

## Verification

- Passed: dashboard lint, dashboard typecheck, dashboard tests, frozen install check, root verify, read-only HTTP smoke, static guardrail review, generated-output tracking checks, audit-log hygiene check, whitespace check.
- Failed: none in final verification.
- Not run: visual in-app browser verification. The in-app browser runtime failed twice before connecting with `windows sandbox failed: spawn setup refresh`. HTTP smoke coverage passed, and the temporary local server and preview processes were stopped afterward.

## Guardrail Review

- No auto-pick, auto-ban, player-client automation, live-client reader, LCU reader, Data Dragon sync, game API integration, OBS WebSocket, vMix API, cloud sync, database URL, or player-side workflow was added.
- No League of Legends-specific logic was added to the universal draft flow.
- No production Take/Clear or Emergency controls were added to the draft route.
- No overlay mutation controls were added.
- The dashboard socket client emits only `client:hello` and `state:request-full`.
- Remaining static-search matches are existing negative tests, existing server production tests/routes, local dev URLs, SVG XML namespaces, or the existing overview production status labels outside the draft panel.

## Notes / Risks

- Build emits an existing Node deprecation warning about `url.parse()` after the build completes, but the build exits successfully.
- The draft panel depends on the server REST contracts already implemented by prior tasks.
- The panel intentionally avoids mutating the sample event during smoke testing, so no new JSONL audit file was created.
- The UI is functional and tested through React unit/integration coverage plus read-only HTTP smoke, but it did not receive visual browser verification because the Browser runtime was unavailable in this session.

## Suggested Next Task

- TQ-083: Implement Producer Panel and Production Control UI.
