# Working Handoff After FIX-LOL-SWAP-PHASE-A Admin UX Cleanup

## 1. Summary

- Cleaned up the Admin Dashboard Draft Operator final lineup UI.
- During active Final Lineup mode, the normal draft action workspace and full hero entity search/list are hidden so the operator focuses on the 10 locked picks.
- During confirmed Final Lineup mode, the UI now presents a locked review state instead of disabled swap/reorder/timer clutter.
- Added admin dashboard tests for active lineup visibility, hidden hero pool, confirmed locked review behavior, and preserved localized/icon card rendering.
- No commit was made. No `git add` command was run.

## 2. Files Changed

Files changed by this cleanup:

- `apps/admin-dashboard/src/draft/DraftOperatorPanel.tsx`
- `apps/admin-dashboard/src/styles.css`
- `apps/admin-dashboard/src/App.test.tsx`
- `WORKING_HANDOFF_AFTER_FIX_LOL_SWAP_PHASE_A_ADMIN_UX_CLEANUP.md`

Pre-existing Phase A working tree changes outside this task remain present and were not reverted.

## 3. Admin UI Behavior Before / After Confirmation

Active Final Lineup mode, before confirmation:

- Final Lineup panel remains visible.
- Blue Lineup and Red Lineup remain separated.
- The lineup timer remains visible while the lineup phase is active.
- Reset Blue / Reset Red remain visible.
- Swap dropdowns, Swap buttons, Move Up, and Move Down remain visible.
- Confirm Final Lineup remains visible.
- The full hero search/entity pool is hidden by default.
- Current Action, Manual Controls, and Slots and History are hidden in lineup mode to reduce operator clutter.

Confirmed Final Lineup mode:

- Shows `Final lineup is confirmed and locked.`
- Blue and Red final lineup cards remain visible.
- Cards still show local champion icons, zh-TW primary names, English secondary names, and slot labels.
- Lineup timer is hidden.
- Confirm Final Lineup is hidden.
- Reset Blue / Reset Red are hidden.
- Swap dropdowns, Swap buttons, Move Up, and Move Down are hidden.
- The full hero search/entity pool stays hidden.

## 4. Overlay Rendering Confirmation

- No overlay rendering code was changed in this cleanup.
- `apps/overlay/src/overlays/DraftOverlay.tsx` and `apps/overlay/src/overlays/DraftOverlay.test.tsx` are still listed by `git diff --name-only -- apps/overlay`, but those files were already modified before this task in the recorded pre-edit git state.
- Overlay final lineup order remains explicitly deferred to Round B.

## 5. Commands Run And Results

Pre-edit required record:

- `git status --short`: showed existing modified/untracked Phase A files, including admin dashboard, overlay, server, core-draft, LoL ruleset, shared types, handoff docs, and runtime log files.
- `git diff --stat`: 20 files changed, 1827 insertions, 50 deletions.
- `git log --oneline -5`:
  - `5f9d483 feat(lol): add local champion icon package`
  - `8ec5bce feat(lol): add generated roster and zh-TW metadata`
  - `aeed802 feat(admin): add bilingual LoL champion search`
  - `7a27559 docs: add reference-driven implementation policy`
  - `acefe1e docs: research LoL draft overlay design`

Verification commands:

- `pnpm.cmd --filter @mmbt/admin-dashboard test`: first sandboxed run failed with Corepack `EPERM` reading `C:\Users\Gavin\AppData\Local\node\corepack\v1\pnpm`; rerun with approval passed, 8 test files and 52 tests.
- `pnpm.cmd --filter @mmbt/admin-dashboard typecheck`: first sandboxed run failed with the same Corepack `EPERM`; rerun with approval passed.
- `pnpm.cmd lint`: passed.
- `pnpm.cmd typecheck`: passed.
- `pnpm.cmd test`: passed.
- `pnpm.cmd build`: passed.
- `git diff --check`: passed.

Additional inspection:

- `git diff --name-only -- apps/admin-dashboard/src/draft/DraftOperatorPanel.tsx apps/admin-dashboard/src/styles.css apps/admin-dashboard/src/App.test.tsx`: listed only the three intended admin dashboard files.
- `git diff --name-only -- apps/overlay`: listed pre-existing overlay diffs only; no overlay file was edited in this cleanup.

## 6. Manual Verification Instructions

1. Start the local toolkit using the normal development command, for example `pnpm.cmd dev`.
2. Open the Admin Dashboard Draft Operator panel for the LoL sample match.
3. Complete Ban/Pick until Final Lineup mode begins.
4. Confirm that the full hero search/entity pool is hidden.
5. Confirm that Final Lineup, Blue Lineup, Red Lineup, the active lineup timer, Reset Blue, Reset Red, Swap, Move Up, Move Down, and Confirm Final Lineup are visible before confirmation.
6. Reorder within Blue and Red and confirm same-side behavior is unchanged.
7. Use Reset Blue and Reset Red and confirm each side returns to pick order.
8. Click Confirm Final Lineup.
9. Confirm the timer, reset controls, swap dropdowns, Swap buttons, Move Up, Move Down, and Confirm Final Lineup are hidden.
10. Confirm the locked final review still shows all 10 cards with local icons, zh-TW primary names, English secondary names, and slot labels.
11. Do not use overlay final lineup order as acceptance for this round; that remains Round B.

## 7. Final `git status --short`

Expected after this handoff file is written:

```text
 M apps/admin-dashboard/src/App.test.tsx
 M apps/admin-dashboard/src/App.tsx
 M apps/admin-dashboard/src/caster/CasterPanel.tsx
 M apps/admin-dashboard/src/client/types.ts
 M apps/admin-dashboard/src/draft/DraftOperatorPanel.tsx
 M apps/admin-dashboard/src/styles.css
 M apps/overlay/src/overlays/DraftOverlay.test.tsx
 M apps/overlay/src/overlays/DraftOverlay.tsx
 M apps/server/src/api.ts
 M apps/server/src/draft-runtime.ts
 M apps/server/src/index.test.ts
 M event-packages/sample-event/rulesets/lol-standard.json
 M games/lol/src/index.test.ts
 M games/lol/src/rulesets.ts
 M packages/core-draft/src/actions.test.ts
 M packages/core-draft/src/actions.ts
 M packages/core-draft/src/index.ts
 M packages/core-draft/src/lifecycle.ts
 M packages/core-draft/src/timer.ts
 M packages/shared-types/src/draft.ts
?? WIP_BEFORE_TIMER_REALTIME_FIX.patch
?? WORKING_HANDOFF_AFTER_FIX_DRAFT_TIMER_REALTIME_DURATIONS.md
?? WORKING_HANDOFF_AFTER_FIX_LOL_SWAP_PHASE_A_ADMIN_UX_CLEANUP.md
?? WORKING_HANDOFF_AFTER_FIX_LOL_SWAP_PHASE_A_CORE_ADMIN.md
?? WORKING_HANDOFF_AFTER_FIX_LOL_SWAP_PHASE_A_REVISION.md
?? apps/admin-dashboard/src/draft/actionLabels.test.ts
?? apps/admin-dashboard/src/draft/actionLabels.ts
?? apps/admin-dashboard/src/draft/timerDisplay.test.ts
?? apps/admin-dashboard/src/draft/timerDisplay.ts
?? apps/admin-dashboard/src/draft/useDisplayedDraftTimer.ts
?? apps/overlay/src/overlays/timerDisplay.ts
?? event-packages/sample-event/logs/production-log.jsonl
?? packages/core-draft/src/labels.ts
?? packages/core-draft/src/lineup.ts
```

## Notes / Risks

- The repository already had broad Phase A changes before this task. This cleanup intentionally edited only the admin dashboard UI/test files plus this handoff.
- The first two pnpm commands needed approval because sandboxed Corepack access to the user-profile pnpm directory failed with `EPERM`.
- Confirmed lineup UI is admin-only; overlay ordering/rendering was not changed.

## Suggested Next Task

- Round B: update overlay final lineup ordering once the accepted admin-side final lineup state is ready to drive broadcast output.
