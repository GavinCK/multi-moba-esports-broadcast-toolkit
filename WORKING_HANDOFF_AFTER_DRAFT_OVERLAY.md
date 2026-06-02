# Working Handoff After Draft Overlay

Date: 2026-06-02

Branch: `main`

Task: TQ-091 - Implement Draft Overlay

Commit/push status: not committed, not pushed.

## Summary

Implemented the read-only draft overlay route at `/overlay/draft/:matchId` in `apps/overlay`.

The draft overlay now renders a production-oriented 1920x1080 browser-source layout with transparent background support, safe fixed sizing, team identity, blue/red bans and picks, current phase/timer/status, sponsor slot, completed state, safe missing-data states, and optional debug diagnostics.

The overlay remains read-only. It does not add operator controls, production controls, REST mutation calls, or mutation Socket.IO emits.

## Scope Boundaries Confirmed

- Implemented TQ-091 only.
- Did not implement Score Bug full graphics.
- Did not implement Program/Preview full graphics.
- Did not implement Emergency full graphics.
- Did not add OBS WebSocket, vMix, Companion, Stream Deck, game API reader, database, cloud sync, auth, player automation, auto-pick, or auto-ban behavior.

## Files Changed

- `README.md`
- `apps/overlay/src/App.test.tsx`
- `apps/overlay/src/client/types.ts`
- `apps/overlay/src/guardrails.test.ts`
- `apps/overlay/src/routes/OverlayRouteView.tsx`
- `apps/overlay/src/state/overlayState.ts`
- `apps/overlay/src/state/socketClient.test.ts`
- `apps/overlay/src/state/socketClient.ts`
- `apps/overlay/src/state/useOverlayState.ts`
- `apps/overlay/src/styles.css`
- `apps/overlay/src/overlays/DraftOverlay.tsx`
- `apps/overlay/src/overlays/DraftOverlay.test.tsx`
- `WORKING_HANDOFF_AFTER_DRAFT_OVERLAY.md`

## Implementation Notes

- Added `DraftOverlay` and `selectDraftOverlayViewModel`.
- Routed `/overlay/draft/:matchId` to the new draft overlay component.
- Extended overlay-side public types for draft actions, rulesets, themes, and adapter heroes.
- Added read-only handling for `draft:updated` Socket.IO payloads.
- Preserved overlay socket behavior so production code emits only:
  - `client:hello`
  - `state:request-full`
- Merged full public draft actions from `draft:updated` into local overlay state when available.
- Preserved draft actions across later `state:full` refreshes when summary payloads do not include action history.
- Synthesized stable pick/ban slots from ruleset + draft summary data when only summary arrays are available.
- Added focused tests for rendering, slot states, timer/current phase, missing-data behavior, debug diagnostics, and no controls.
- Updated guardrail tests for mutation events including graphics preview/clear.
- Updated README to mark draft overlay as implemented while leaving Score Bug and Program/Preview/Emergency full graphics as not implemented.

## Commands Run

- `git status --short` - passed; clean before implementation after user cleanup.
- `git branch --show-current` - passed; branch was `main`.
- `git log --oneline -5` - passed; latest commit was `411a9f1 feat(overlay): add app shell and debug mode`.
- `pnpm.cmd install --frozen-lockfile` - first failed in sandbox because Corepack could not write outside the sandbox; approved rerun passed.
- `pnpm.cmd verify` - first failed in sandbox because Corepack could not write outside the sandbox; approved rerun passed.
- `pnpm.cmd --filter @mmbt/overlay lint` - first failed in sandbox because Corepack could not write outside the sandbox; approved rerun passed.
- `pnpm.cmd --filter @mmbt/overlay typecheck` - passed.
- `pnpm.cmd --filter @mmbt/overlay test` - passed before implementation.
- `pnpm.cmd --filter @mmbt/overlay build` - passed before implementation.
- `pnpm.cmd --filter @mmbt/overlay typecheck` - passed after implementation.
- `pnpm.cmd --filter @mmbt/overlay test` - first post-change run failed on three test expectation mismatches; fixed and reran successfully.
- `pnpm.cmd --filter @mmbt/overlay lint` - first post-change run failed on an unused import; fixed and reran successfully.
- `pnpm.cmd --filter @mmbt/overlay build` - passed after implementation.
- `pnpm.cmd lint` - passed.
- `pnpm.cmd typecheck` - passed.
- `pnpm.cmd test` - passed.
- `pnpm.cmd build` - passed.
- `pnpm.cmd verify` - passed.
- `pnpm.cmd install --frozen-lockfile` - passed after implementation; lockfile was up to date. Command emitted a Node deprecation warning for `url.parse()` but exited successfully.
- Mutation REST scan with `rg -e ... apps/overlay/src` - initial combined regex attempt had PowerShell quoting errors; rerun with `rg -e` patterns passed with no production matches.
- Socket mutation scan with `rg "socket\.emit|draft:start|..." apps/overlay/src` - passed; production emits remain read-only state/hello events, with mutation strings only in negative tests/guardrails.
- Future-scope scan with `rg "OBSWebSocket|obs-websocket|vMix|..." apps/overlay/src apps packages games event-packages tests` - passed; matches were acceptable boundary/negative tests only.
- Control scan for `<button|<input|<select|<textarea` in `apps/overlay/src` - passed with no matches.
- Control text scan for `role="button"|Start Draft|...` in `apps/overlay/src` - passed; matches were negative test strings only.
- Fetch/client scan for `fetch\(|axios|method:` in `apps/overlay/src` - passed; no production fetch/client mutation calls.
- `git ls-files -- "node_modules" "apps/*/node_modules" "packages/*/node_modules" "games/*/node_modules" "apps/*/dist" "packages/*/dist" "games/*/dist" ".turbo" ".vite" "coverage"` - passed with no tracked generated artifacts.
- `Get-ChildItem -Force event-packages\sample-event\logs` - passed; only `.gitkeep` present.
- `git diff --check` - passed before handoff creation.
- `git status --short` - passed; showed only expected TQ-091 changes before handoff creation.

## Verification

Passed:

- Root install with frozen lockfile.
- Root lint.
- Root typecheck.
- Root tests.
- Root build.
- Root verify.
- Overlay lint.
- Overlay typecheck.
- Overlay tests.
- Overlay build.
- Read-only overlay guardrail scans.
- Future-scope guardrail scans.
- Whitespace check before handoff creation.

Failed then fixed:

- Overlay test expectations for rendered team/full-name/manual-skip text.
- Overlay lint unused import.
- PowerShell quoting in two initial guardrail scan commands.

Not run:

- Manual OBS/browser-source rehearsal.
- In-app browser visual screenshot QA.

## Notes / Risks

- The overlay can render richer slot status from `draft:updated` payload actions when available.
- When only `state:full` draft summaries are available, the overlay builds stable visual slots from the ruleset plus summary pick/ban arrays.
- Browser-source visual QA is still recommended before production use.

## Suggested Next Task

- Implement the next scoped overlay graphic route, likely Score Bug or Program/Preview, with the same read-only overlay guardrails.
