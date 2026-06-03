# Working Handoff After FIX-LOL-SWAP-PHASE-A Core/Admin

## Summary

- Added a game-agnostic final lineup phase after all BLUE and RED pick slots are locked.
- Stored final lineup order by draft action ID, preserving original pick action history and avoiding LoL-specific core logic.
- Added server REST endpoints for final lineup reorder, side reset, and confirmation.
- Added basic Draft Operator final lineup controls for LoL rehearsal, using existing local hero metadata and icon rendering.
- Added unit, server integration, and admin UI test coverage.
- Did not modify overlay rendering.

## References inspected and what concepts were used

- `AGENTS.md`: project guardrails, source-of-truth order, manual-first/local-first rules, handoff requirements.
- `Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md`: universal draft/core/server/admin boundaries.
- `IMPLEMENTATION_PROMPT_FOR_CODEX.md`: v0.1 implementation constraints and verification expectations.
- `docs/REFERENCE_DRIVEN_IMPLEMENTATION_POLICY.md`: reference-driven guardrails; no copy-driven implementation.
- `docs/BAN_PICK_RULES.md`: draft phase and timer expectations.
- `docs/ACCEPTANCE_CRITERIA.md`: v0.1 acceptance context.
- `docs/TASK_QUEUE.md`: milestone context.
- `WORKING_HANDOFF_AFTER_PREP_LOL_LOCAL_ICON_PACKAGE.md`: local LoL champion metadata/icon package context.

`WORKING_HANDOFF_AFTER_FIX_DRAFT_TIMER_LABELS.md` was requested but is not present in the repository.

No external third-party repositories, source code, screenshots, artwork, or exact layouts were inspected or copied in this round. Implementation used local project documents and existing repo patterns.

## Files changed

- `packages/shared-types/src/draft.ts`
- `packages/core-draft/src/lineup.ts`
- `packages/core-draft/src/index.ts`
- `packages/core-draft/src/actions.ts`
- `packages/core-draft/src/lifecycle.ts`
- `packages/core-draft/src/actions.test.ts`
- `apps/server/src/draft-runtime.ts`
- `apps/server/src/api.ts`
- `apps/server/src/index.test.ts`
- `apps/admin-dashboard/src/client/types.ts`
- `apps/admin-dashboard/src/draft/DraftOperatorPanel.tsx`
- `apps/admin-dashboard/src/styles.css`
- `apps/admin-dashboard/src/App.test.tsx`
- `WORKING_HANDOFF_AFTER_FIX_LOL_SWAP_PHASE_A_CORE_ADMIN.md`

## Data model added/changed

- Added `DraftLineupSide`, `DraftFinalLineupStatus`, and `DraftFinalLineupState`.
- Added optional `DraftState.finalLineup`.
- `DraftFinalLineupState.finalLineupBySide` stores ordered pick action IDs for `BLUE` and `RED`.
- Final lineup status is `ACTIVE` or `CONFIRMED`.
- Final lineup timestamps track phase start, update, and confirmation.
- Server public summaries omit `confirmedByOperatorId`.

## API endpoints added/changed

- `POST /api/drafts/:draftId/lineup/reorder`
  - Body: `operatorId`, `side`, `actionIds`, optional `now`.
  - Reorders one side's lineup using locked pick action IDs.
- `POST /api/drafts/:draftId/lineup/reset`
  - Body: `operatorId`, `side`, optional `now`.
  - Resets one side back to original locked pick order.
- `POST /api/drafts/:draftId/lineup/confirm`
  - Body: `operatorId`, `confirm: true`, optional `now`.
  - Confirms final lineup and stops the lineup timer.

Audit events added:

- `DRAFT_LINEUP_REORDERED`
- `DRAFT_LINEUP_RESET`
- `DRAFT_LINEUP_CONFIRMED`

## Timer behavior for lineup phase

- The final lineup phase starts automatically only after all BLUE and RED pick slots are locked and all draft actions are complete.
- The lineup timer starts at 60 seconds.
- Timer expiry does not auto-pick, auto-ban, auto-reorder, auto-confirm, auto-complete, or mutate draft/lineup state.
- Confirming final lineup pauses/stops the timer.
- Completing a draft is rejected while an active final lineup is unconfirmed.

## Draft Operator basic UI behavior

- A Final Lineup section appears once picks are ready or the lineup phase is active.
- BLUE and RED lineups are shown separately.
- Each lineup card displays slot label, local icon, primary localized name when available, and English secondary name.
- Operators can move heroes up/down, reset a side to pick order, and confirm final lineup.
- Confirm uses the same deliberate confirmation prompt pattern as other dangerous live-production actions.

## Commands run and results

- `git status --short`: clean before edits.
- `git diff --stat`: no output before edits.
- `git log --oneline -5`: recorded baseline commits.
- `pnpm.cmd --filter @mmbt/core-draft test`: initial sandbox/Corepack EPERM, rerun escalated and passed.
- `pnpm.cmd --filter @mmbt/shared-types build`: passed.
- `pnpm.cmd --filter @mmbt/core-draft typecheck`: passed.
- `pnpm.cmd --filter @mmbt/core-draft build`: passed.
- `pnpm.cmd --filter @mmbt/server test`: failed during iteration due stale build/test assertion shape, then passed.
- `pnpm.cmd --filter @mmbt/server typecheck`: passed.
- `pnpm.cmd --filter @mmbt/admin-dashboard test`: passed.
- `pnpm.cmd --filter @mmbt/admin-dashboard typecheck`: passed.
- `pnpm.cmd lint`: passed.
- `pnpm.cmd typecheck`: passed.
- `pnpm.cmd test`: passed.
- `pnpm.cmd build`: passed.

## Manual verification instructions

1. Run `pnpm.cmd dev`.
2. Open the admin dashboard locally.
3. Load/select the sample LoL match.
4. Run a full manual LoL draft until all pick slots are locked.
5. Confirm the Final Lineup section appears with both BLUE and RED local champion names/icons.
6. Move a BLUE or RED lineup card up/down and verify the order changes.
7. Use Reset Blue/Reset Red and verify the side returns to original pick order.
8. Click Confirm Final Lineup, accept the confirmation prompt, and verify the lineup status becomes confirmed.
9. Verify overlay routes still render their existing draft output; this round intentionally did not change overlay final lineup rendering.

## Scope guardrails checked

- Universal core stores generic draft action IDs, not champion names or Riot-specific concepts.
- LoL-specific UX only consumes existing LoL adapter metadata in admin.
- Manual operator input remains required.
- No auto-pick, auto-ban, auto-confirm, or player-side automation was added.
- No runtime Data Dragon, Riot API, LCU, OBS WebSocket, vMix, cloud, database, or login dependency was added.
- Overlay routes remain read-only and were not modified.

## Confirmation overlay rendering not changed

Confirmed. No files under `apps/overlay` or `packages/core-overlay` were modified for this task.

## Confirmation no third-party code/assets/exact layouts copied

Confirmed. No third-party code, assets, screenshots, artwork, proprietary layouts, trade dress, or exact visual treatments were copied.

## git status --short

```text
 M apps/admin-dashboard/src/App.test.tsx
 M apps/admin-dashboard/src/client/types.ts
 M apps/admin-dashboard/src/draft/DraftOperatorPanel.tsx
 M apps/admin-dashboard/src/styles.css
 M apps/server/src/api.ts
 M apps/server/src/draft-runtime.ts
 M apps/server/src/index.test.ts
 M packages/core-draft/src/actions.test.ts
 M packages/core-draft/src/actions.ts
 M packages/core-draft/src/index.ts
 M packages/core-draft/src/lifecycle.ts
 M packages/shared-types/src/draft.ts
?? WORKING_HANDOFF_AFTER_FIX_LOL_SWAP_PHASE_A_CORE_ADMIN.md
?? packages/core-draft/src/lineup.ts
```

## Suggested Round B task

- `FIX-LOL-SWAP-PHASE-B`: Add read-only overlay/preview/program rendering for confirmed final lineup order, gated by production control and preserving existing read-only browser-source behavior.
