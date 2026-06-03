# Working Handoff: ADD-MATCH-PRESENTATION-METADATA-E - Overlay Presentation View Model

## 1. Summary

- Added overlay-side presentation metadata consumption and view-model preparation for draft overlays.
- Added a pure overlay presentation selector that resolves match label, patch label, series format, game number, score, first-pick side, side status label, team presentation data, safe local logo URLs, team colors, and broadcast player display order.
- Extended draft pick slot view-model data with optional player metadata by visual slot index, after the existing final-lineup order resolution.
- Kept the normal overlay route visually unchanged; presentation data is exposed through the view model and debug-only diagnostics.
- Did not change server, admin dashboard, Draft Operator controls, Producer Panel controls, timer logic, ban/pick rules, final lineup logic, LoL roster/localization/icon data, event setup JSON, or runtime logs.

## 2. Files Changed

- `apps/overlay/src/client/types.ts`
- `apps/overlay/src/state/presentationViewModel.ts`
- `apps/overlay/src/state/overlayState.ts`
- `apps/overlay/src/overlays/DraftOverlay.tsx`
- `apps/overlay/src/overlays/DraftOverlay.test.tsx`
- `WORKING_HANDOFF_AFTER_ADD_MATCH_PRESENTATION_METADATA_E_OVERLAY_VIEW_MODEL.md`

## 3. Overlay Presentation View-Model Behavior

- `OverlayRuntimeState` now includes `players`, matching the existing server `/api/state` snapshot.
- `selectMatchPresentationViewModel` resolves:
  - `matchLabel`
  - `patchLabel`
  - `seriesFormat`
  - `gameNumber`
  - `scoreBySide.BLUE` / `scoreBySide.RED`
  - `firstPickSide`
  - `sideStatusLabel`
  - BLUE / RED team presentation data
  - BLUE / RED player display order
- `selectDraftOverlayViewModel` now exposes `presentation` on the draft overlay view model.
- `?debug=1` draft diagnostics include presentation metadata and player order for inspection.
- Normal `/overlay/draft/:matchId` output does not show the debug-only presentation text.

## 4. Team Metadata Resolution Behavior

- BLUE and RED team presentation data resolves from the selected match team IDs.
- Team short name falls back to team name, then team ID, then `TBD`.
- Team logo asset path uses `team.logoAssetPath`, then `team.logoUrl`.
- Safe local asset paths are converted to browser URLs such as `/assets/team-logos/blue.svg`.
- Unsafe/remote logo paths are preserved as raw `logoAssetPath` but do not become browser image URLs.
- Primary and secondary team colors are exposed when available; missing colors remain `null`.

## 5. Player Display Order Resolution Behavior

- BLUE and RED player order comes from:

```text
match.presentation.playerDisplayOrderBySide.BLUE
match.presentation.playerDisplayOrderBySide.RED
```

- Each player slot exposes:
  - slot index
  - player ID
  - handle
  - display name
  - label
  - role
  - team ID
  - team short name
  - unresolved flag
- Player label falls back from handle to display name to player ID.
- Missing handles are safe and covered by tests.

## 6. Pick Card / Player Slot Mapping Behavior

- Existing final lineup pick ordering still resolves champion card order first.
- Broadcast player display order is attached afterward by index:
  - visual pick slot 1 gets player order 1
  - visual pick slot 2 gets player order 2
  - and so on
- The mapping only adds view-model metadata: `player`, `playerLabel`, and `playerRole`.
- It does not mutate draft state, change draft legality, change champion ownership, change pick/ban history, change timer behavior, or change final lineup state.
- If player order is missing or incomplete, champion pick cards still resolve and the unmatched slots have no player label.

## 7. Fallback Behavior

- Missing presentation metadata falls back to match title, match format, current game number, and match score.
- Missing first-pick side and side status label expose `null`.
- Missing `playerDisplayOrderBySide` exposes empty player lists plus a fallback message.
- Side-specific missing player order exposes empty side player lists without crashing.
- Unresolved player IDs are retained as visible unresolved placeholders in the view model.
- Missing/unsafe team logo paths never produce remote runtime asset dependencies.
- Older `state:full` payloads without `players` are normalized to `players: []`.

## 8. Guardrails Checked

- Overlay remains read-only:
  - no inputs
  - no buttons
  - no save controls
  - no mutation REST calls
  - no mutation Socket.IO events
- Timer logic not changed.
- Ban/pick rules not changed.
- Draft phase generation not changed.
- Final lineup reorder/reset/confirm logic not changed.
- Existing overlay final lineup ordering remains intact.
- Producer Panel not changed.
- Draft Operator controls not changed.
- Server not changed.
- Event setup JSON not changed.
- Overlay redesign not started.
- No runtime external asset dependency introduced.
- No LoL LCU, Data Dragon runtime sync, in-game HUD, auto-pick, auto-ban, OBS WebSocket, vMix, Companion, Stream Deck, database, cloud, login, or player-side automation added.

## 9. Commands Run and Results

Pre-edit required checks:

- `git status --short`: passed, clean output.
- `git diff --stat`: passed, clean output.
- `git log --oneline -8`: passed.
  - `1547b54 feat(admin): add teams players presentation preview`
  - `30944eb feat(admin): add match presentation producer controls`
  - `61b2899 feat(server): add match presentation update API`
  - `a59b084 feat(match): add presentation metadata foundation`
  - `9c84ebc fix(overlay): tick draft timer locally`
  - `993cd7e feat(overlay): use final lineup pick order`
  - `3ec6963 feat(draft): add final lineup swap phase controls`
  - `5f9d483 feat(lol): add local champion icon package`

Verification:

- `pnpm.cmd --filter @mmbt/overlay test`: first sandbox run failed with Corepack `EPERM`; escalated rerun passed, 10 files / 75 tests.
- `pnpm.cmd --filter @mmbt/overlay typecheck`: first sandbox run failed with Corepack `EPERM`; escalated rerun passed.
- `pnpm.cmd --filter @mmbt/admin-dashboard test`: passed, 8 files / 63 tests.
- `pnpm.cmd --filter @mmbt/admin-dashboard typecheck`: passed.
- `pnpm.cmd --filter @mmbt/server test`: passed, 1 file / 35 tests.
- `pnpm.cmd --filter @mmbt/server typecheck`: passed.
- `pnpm.cmd test`: passed across workspace.
- `pnpm.cmd lint`: passed across workspace.
- `pnpm.cmd typecheck`: passed across workspace.
- `pnpm.cmd build`: passed across workspace.
- `git diff --check`: passed.
- `git status --short`: final output recorded below.

Local app smoke:

- Started server, Admin Dashboard, and Overlay dev apps.
- `http://127.0.0.1:3000/api/health`: HTTP 200.
- `http://127.0.0.1:5173`: HTTP 200.
- `http://127.0.0.1:5174/overlay/draft/match_lol-showmatch`: HTTP 200.
- `http://127.0.0.1:5174/overlay/draft/match_lol-showmatch?debug=1`: HTTP 200.
- In-app Browser tool was not exposed in this thread after tool discovery, so browser visual automation was not performed.
- Stopped local listeners for `127.0.0.1:3000`, `127.0.0.1:5173`, and `127.0.0.1:5174`.

## 10. Manual Verification Instructions

1. Start server:

```powershell
pnpm.cmd --filter @mmbt/server dev
```

2. Start Admin Dashboard:

```powershell
pnpm.cmd --filter @mmbt/admin-dashboard dev -- --force
```

3. Start Overlay:

```powershell
pnpm.cmd --filter @mmbt/overlay dev -- --force
```

4. Open Draft Operator:

```text
http://127.0.0.1:5173/draft/match_lol-showmatch
```

5. Open Producer Panel:

```text
http://127.0.0.1:5173
```

6. Open normal overlay:

```text
http://127.0.0.1:5174/overlay/draft/match_lol-showmatch
```

7. Open debug overlay:

```text
http://127.0.0.1:5174/overlay/draft/match_lol-showmatch?debug=1
```

8. Confirm:
   - Normal overlay still loads.
   - Normal overlay is not visually redesigned.
   - Debug overlay exposes match label, patch label, BO format, game number, BLUE/RED score, first pick side, side status label, team short names, team logo paths, and BLUE/RED player order.
   - Overlay timer still ticks locally.
   - Final lineup swap/move in Admin still updates overlay pick order.
   - Confirm Final Lineup still keeps overlay in confirmed order.
   - Overlay remains read-only.
   - No broken image behavior or remote runtime asset dependency is introduced.

Do not commit `event-packages/sample-event/logs/production-log.jsonl` if manual app usage changes it.

## 11. git status --short

```text
 M apps/overlay/src/client/types.ts
 M apps/overlay/src/overlays/DraftOverlay.test.tsx
 M apps/overlay/src/overlays/DraftOverlay.tsx
 M apps/overlay/src/state/overlayState.ts
?? apps/overlay/src/state/presentationViewModel.ts
?? WORKING_HANDOFF_AFTER_ADD_MATCH_PRESENTATION_METADATA_E_OVERLAY_VIEW_MODEL.md
```

## 12. Notes / Risks

- `WORKING_HANDOFF_AFTER_ADD_MATCH_PRESENTATION_METADATA_A_API.md` was referenced by the broader task history but is not present in the repository. Work proceeded from committed source plus B/C/D handoffs.
- Browser visual automation was not performed because the Browser tool was not available in this thread. HTTP route smoke and React/server tests passed.
- No public reference repositories, third-party code, third-party assets, or external documentation were used for this task.

## 13. Suggested Next Task

- Project owner manual review of the normal and debug draft overlay with local server/dashboard/overlay running, then commit/push if accepted.
