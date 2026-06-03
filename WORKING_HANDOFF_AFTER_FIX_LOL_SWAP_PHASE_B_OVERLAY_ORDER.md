# Working Handoff After Fix LoL Swap Phase B Overlay Order

## 1. Summary

- Updated the draft overlay route so pick cards resolve display order from `draft.finalLineup.finalLineupBySide` when that side's final lineup order is present and valid.
- Kept the overlay strictly read-only: no lineup controls, no mutation REST calls, and no mutation Socket.IO events were added.
- Preserved existing overlay layout, local champion icon behavior, full hero names, and safe fallback rendering.
- Added overlay tests for no-lineup fallback, BLUE reorder, RED reorder, independent side handling, live draft-update reorder, invalid lineup fallback, and mutation-control absence.

## 2. Files Changed

- `apps/overlay/src/client/types.ts`
  - Added `DraftFinalLineupState` to overlay draft summary/public draft types.
- `apps/overlay/src/state/overlayState.ts`
  - Preserved cloned `finalLineup` data from `draft:updated` payloads.
- `apps/overlay/src/overlays/DraftOverlay.tsx`
  - Added side-specific pick-order resolution from valid final lineup action IDs.
- `apps/overlay/src/overlays/DraftOverlay.test.tsx`
  - Added render/reducer coverage for final lineup order and fallback cases.
- `apps/overlay/src/guardrails.test.ts`
  - Added static guardrail coverage for lineup mutation endpoints.
- `WORKING_HANDOFF_AFTER_FIX_LOL_SWAP_PHASE_B_OVERLAY_ORDER.md`
  - Added this task handoff.

## 3. Overlay Final Lineup Order Behavior

- The overlay still derives ban/pick cards from draft actions.
- For each side independently, the overlay:
  - Filters that side's pick cards.
  - Builds a map of locked PICK action IDs for that side.
  - Reads `draft.finalLineup.finalLineupBySide[side]`.
  - Uses that order only when it exactly maps to the side's locked pick action IDs.
- During active final lineup phase, a `draft:updated` message that includes changed `finalLineupBySide` now updates overlay order.
- After final lineup confirmation, the confirmed order remains the displayed order as long as the server state carries the confirmed `finalLineup`.

## 4. Fallback Behavior When Final Lineup Is Absent

- If `finalLineupBySide[side]` is absent, the overlay renders that side in normal locked pick/action order.
- If final lineup data is partial, duplicated, points at a missing action, or includes an action from the other side, only that side falls back to normal pick/action order.
- Invalid final lineup data does not crash overlay rendering and does not create duplicated or broken cards.

## 5. Read-Only Guardrails Checked

- No swap, move, reset, or confirm controls were added to overlay routes.
- No mutation REST calls were added.
- No mutation Socket.IO events were added.
- Static guardrail test now also rejects:
  - `/api/drafts/:draftId/lineup/reorder`
  - `/api/drafts/:draftId/lineup/reset`
  - `/api/drafts/:draftId/lineup/confirm`
- Existing overlay read-only source guardrails still pass.

## 6. Commands Run And Results

- `git status --short`: clean before editing.
- `git diff --stat`: no output before editing.
- `git log --oneline -8`:
  - `3ec6963 feat(draft): add final lineup swap phase controls`
  - `5f9d483 feat(lol): add local champion icon package`
  - `8ec5bce feat(lol): add generated roster and zh-TW metadata`
  - `aeed802 feat(admin): add bilingual LoL champion search`
  - `7a27559 docs: add reference-driven implementation policy`
  - `acefe1e docs: research LoL draft overlay design`
  - `e073b5c docs: update README local run and v0.1 scope`
  - `ff906b1 docs: add game adapter developer guide`
- `pnpm.cmd --filter @mmbt/overlay test`: first attempt failed due sandbox/Corepack `EPERM`; rerun with approval passed, 9 files / 59 tests.
- `pnpm.cmd --filter @mmbt/overlay typecheck`: passed.
- `pnpm.cmd --filter @mmbt/server test`: passed, 1 file / 30 tests.
- `pnpm.cmd --filter @mmbt/server typecheck`: passed.
- `pnpm.cmd test`: passed across workspace.
- `pnpm.cmd typecheck`: passed across workspace.
- `pnpm.cmd build`: passed across workspace.
- `git diff --check`: passed.
- `git status --short`: see section 8.

## 7. Manual Verification Instructions

After restarting local apps:

1. Open Draft Operator: `http://127.0.0.1:5173/draft/match_lol-showmatch`
2. Open Overlay: `http://127.0.0.1:5174/overlay/draft/match_lol-showmatch`
3. Reach final lineup phase.
4. Swap Blue lineup order in Admin.
5. Confirm overlay updates to Blue final lineup order.
6. Swap Red lineup order in Admin.
7. Confirm overlay updates to Red final lineup order.
8. Confirm final lineup.
9. Confirm overlay remains in the final confirmed order.
10. Confirm overlay has no controls and remains read-only.
11. Confirm no broken images.
12. Confirm zh-TW names, English names, and local icons still render.
13. Confirm fallback behavior still works when final lineup is absent: overlay uses normal locked pick order.

Manual browser verification was not run in this task.

## 8. git status --short

```text
 M apps/overlay/src/client/types.ts
 M apps/overlay/src/guardrails.test.ts
 M apps/overlay/src/overlays/DraftOverlay.test.tsx
 M apps/overlay/src/overlays/DraftOverlay.tsx
 M apps/overlay/src/state/overlayState.ts
?? WORKING_HANDOFF_AFTER_FIX_LOL_SWAP_PHASE_B_OVERLAY_ORDER.md
```

## 9. Suggested Next Task

- Run the manual rehearsal checklist above with the local server/dashboard/overlay apps restarted, then visually review the final lineup overlay order before committing.
