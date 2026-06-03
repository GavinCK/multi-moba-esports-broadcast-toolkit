# Working Handoff After Fix Draft Timer Realtime Durations

## Scope

Fixed only the draft timer realtime display issue and LoL pick phase duration issue.

Preserved the existing uncommitted Phase A final lineup / swap phase work. No commit was made.

## Initial Required Commands

- `git status --short`: showed existing uncommitted Phase A changes plus untracked WIP files.
- `git diff --stat`: showed 12 modified files, 1604 insertions, 32 deletions before this timer task.
- `git log --oneline -5`:
  - `5f9d483 feat(lol): add local champion icon package`
  - `8ec5bce feat(lol): add generated roster and zh-TW metadata`
  - `aeed802 feat(admin): add bilingual LoL champion search`
  - `7a27559 docs: add reference-driven implementation policy`
  - `acefe1e docs: research LoL draft overlay design`

## Root Causes

### Wrong 60s LoL Pick Duration

The LoL ruleset data had several multi-pick phases configured with `timeSeconds: 60`:

- `pick-red-1-2`
- `pick-blue-2-3`
- `pick-blue-4-5`

The core draft engine was using the configured phase duration as expected. The incorrect 60s display came from the LoL adapter/sample ruleset values, not from generic timer multiplication.

Fix: normal LoL pick phases, including `count > 1` multi-pick phases, are now configured as 30 seconds. The final lineup / swap phase remains 60 seconds.

### Non-Moving UI Timer

The server broadcasts authoritative draft state on mutations. It does not broadcast a new timer value every second.

The Admin Dashboard and overlay were rendering the authoritative `remainingSeconds` snapshot directly in some places, so the visible timer only changed after a draft mutation such as locking a hero.

Fix: UI surfaces now use display-only local ticking derived from the authoritative timer snapshot. This countdown does not mutate draft state and does not auto-pick, auto-ban, auto-lock, auto-confirm, auto-complete, auto-advance, or reorder anything when it reaches zero.

### Timer Snapshot Rebase

`calculateTimerState` reduced `remainingSeconds` but kept the original `phaseStartedAt` while the timer was still running. After an in-phase mutation, display-only ticking could subtract elapsed time twice from a partially elapsed snapshot.

Fix: running timer snapshots are rebased to the calculation timestamp after elapsed time is applied.

## Files Changed For This Task

- `packages/core-draft/src/timer.ts`
- `packages/core-draft/src/actions.test.ts`
- `games/lol/src/rulesets.ts`
- `games/lol/src/index.test.ts`
- `event-packages/sample-event/rulesets/lol-standard.json`
- `apps/server/src/index.test.ts`
- `apps/admin-dashboard/src/App.tsx`
- `apps/admin-dashboard/src/App.test.tsx`
- `apps/admin-dashboard/src/caster/CasterPanel.tsx`
- `apps/admin-dashboard/src/draft/DraftOperatorPanel.tsx`
- `apps/admin-dashboard/src/draft/useDisplayedDraftTimer.ts`
- `apps/overlay/src/overlays/DraftOverlay.tsx`
- `apps/overlay/src/overlays/DraftOverlay.test.tsx`
- `apps/overlay/src/overlays/timerDisplay.ts`
- `WORKING_HANDOFF_AFTER_FIX_DRAFT_TIMER_REALTIME_DURATIONS.md`

Existing Phase A files and untracked files remain uncommitted and were preserved.

## Tests And Verification Run

Some first `pnpm.cmd` attempts failed inside the sandbox because Corepack could not open `C:\Users\Gavin\AppData\Local\node\corepack\v1\pnpm`. The same commands were rerun with approved escalation and passed unless noted below.

- `pnpm.cmd --filter @mmbt/core-draft test`: passed
- `pnpm.cmd --filter @mmbt/core-draft typecheck`: passed
- `pnpm.cmd --filter @mmbt/server test`: passed
- `pnpm.cmd --filter @mmbt/server typecheck`: passed
- `pnpm.cmd --filter @mmbt/admin-dashboard test`: passed
- `pnpm.cmd --filter @mmbt/admin-dashboard typecheck`: passed
- `pnpm.cmd --filter @mmbt/overlay test`: passed after renaming a local variable that tripped the overlay source guardrail
- `pnpm.cmd --filter @mmbt/overlay typecheck`: passed after tightening timer state typing
- `pnpm.cmd --filter @mmbt/game-lol-sample test`: passed
- `pnpm.cmd --filter @mmbt/lol test`: no projects matched the filter; correct package is `@mmbt/game-lol-sample`
- `pnpm.cmd lint`: passed
- `pnpm.cmd typecheck`: passed
- `pnpm.cmd test`: passed
- `pnpm.cmd build`: passed
- `git diff --check`: passed

## Test Coverage Added

- LoL normal pick phases are 30 seconds.
- LoL multi-pick phases are 30 seconds.
- Final lineup / swap phase remains 60 seconds.
- `count > 1` does not multiply pick timer duration.
- Running timer snapshots are rebased after elapsed time is applied.
- Admin Dashboard draft timer decreases under fake time without receiving a new mutation/state revision.
- Paused Admin Dashboard timer remains frozen.
- Overlay timer display can derive countdown from authoritative timer state without mutating that state.

## Manual Verification Steps

Recommended quick manual check:

1. Run the server and Admin Dashboard.
2. Open a LoL draft from the sample event.
3. Start the draft and confirm pick phases display 30 seconds, including multi-pick phases.
4. Let the timer run without locking a hero and confirm the Admin Dashboard timer visibly ticks down every second.
5. Pause the draft and confirm the displayed timer freezes.
6. Resume and confirm the timer continues ticking down.
7. Let a timer reach zero and confirm no pick, ban, lock, confirm, complete, phase advance, or final lineup reorder happens automatically.
8. Complete the pick/ban flow and confirm the final lineup / swap phase displays 60 seconds.
9. Confirm the existing final lineup controls, zh-TW primary names, English secondary names, and local icons are still present.

## Final Git Status

Captured after `git diff --check`:

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

This handoff file will appear as an additional untracked file after it is created.

## Notes / Risks

- `docs/BAN_PICK_RULES.md` still contains older example timing patterns with 60s multi-pick examples. The latest explicit task requirement overrides that example for this project LoL ruleset. Documentation was not changed because the requested scope was limited to timer realtime display and LoL phase durations.
- The timer display is intentionally local and display-only. The authoritative server state still changes only through deliberate draft actions.
- No runtime log files were modified.

## Suggested Next Task

- Re-run the manual Phase A acceptance pass, including the timer checks above, then decide whether to accept `FIX-LOL-SWAP-PHASE-A`.
