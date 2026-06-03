# Working Handoff After FIX-LOL-SWAP-PHASE-A Revision

## 1. Summary

- Fixed repeated Ban/Pick slot labels by deriving labels from the full draft action sequence, not phase-local slot indexes.
- Fixed the non-moving Draft Operator timer display by deriving a local display timer from authoritative timer snapshots and `phaseStartedAt`.
- Added direct same-side final lineup swap controls in the Draft Operator panel.
- Kept direct swap on the existing final lineup reorder API; no dedicated swap endpoint was added.
- Added focused core/admin regression tests for labels, display timer behavior, and direct same-side swap UX.
- Ran focused and full repository verification; all checks passed.
- Did not modify overlay rendering.

## 2. Files changed

- `packages/shared-types/src/draft.ts`
- `packages/core-draft/src/actions.ts`
- `packages/core-draft/src/actions.test.ts`
- `packages/core-draft/src/index.ts`
- `packages/core-draft/src/labels.ts`
- `packages/core-draft/src/lifecycle.ts`
- `packages/core-draft/src/lineup.ts`
- `apps/server/src/api.ts`
- `apps/server/src/draft-runtime.ts`
- `apps/server/src/index.test.ts`
- `apps/admin-dashboard/src/App.test.tsx`
- `apps/admin-dashboard/src/client/types.ts`
- `apps/admin-dashboard/src/draft/DraftOperatorPanel.tsx`
- `apps/admin-dashboard/src/draft/actionLabels.ts`
- `apps/admin-dashboard/src/draft/actionLabels.test.ts`
- `apps/admin-dashboard/src/draft/timerDisplay.ts`
- `apps/admin-dashboard/src/draft/timerDisplay.test.ts`
- `apps/admin-dashboard/src/styles.css`
- `WORKING_HANDOFF_AFTER_FIX_LOL_SWAP_PHASE_A_CORE_ADMIN.md` was already present as an untracked Phase A handoff.
- `WORKING_HANDOFF_AFTER_FIX_LOL_SWAP_PHASE_A_REVISION.md`

## 3. Root cause of repeated BAN/PICK 1 labels

- The Draft Operator was formatting labels with `action.slotIndex + 1`.
- `slotIndex` is scoped to the phase/action slot, not to the whole side/type sequence.
- In LoL-style drafts with many one-slot phases, multiple actions legitimately have `slotIndex: 0`, so the UI repeatedly displayed labels such as `Blue Ban 1` or `Blue Pick 1`.
- The fix counts actions up to the current action in the full draft action list, filtered by the same team and action type. This restores labels such as `Blue Ban 1`, `Blue Ban 2`, `Blue Pick 1`, ..., `Blue Pick 5` without adding LoL-specific logic.

## 4. Root cause of non-moving timer

- The admin UI rendered `timer.remainingSeconds` directly from the latest server/socket state snapshot.
- The server does not broadcast a new timer value every second, and the core timer remains passive by design.
- Because the UI did not locally derive elapsed time from `phaseStartedAt`, the displayed value stayed static until another mutation or state refresh occurred.
- The fix adds `deriveDisplayedDraftTimer`, which calculates display-only remaining time from `phaseStartedAt` on a local interval. It does not mutate draft state, auto-complete, auto-confirm, auto-pick, or auto-ban.

## 5. Direct swap UX behavior

- Each final lineup card now includes a `Swap with` select and a `Swap` button.
- Swap targets are limited to other pick actions on the same side.
- BLUE cards can only swap with BLUE cards; RED cards can only swap with RED cards.
- Confirmed final lineups disable swap controls.
- Move Up and Move Down controls remain available for editable lineups.
- The UI builds the next side order client-side and sends it through the existing reorder mutation.

## 6. API/server changes, if any

- No new direct swap API endpoint was added.
- Direct swap reuses `POST /api/drafts/:draftId/lineup/reorder` with a full same-side `actionIds` order.
- Existing Phase A final lineup endpoints in this worktree remain:
  - `POST /api/drafts/:draftId/lineup/reorder`
  - `POST /api/drafts/:draftId/lineup/reset`
  - `POST /api/drafts/:draftId/lineup/confirm`
- Server validation still requires the requested side order to contain exactly that side's locked pick action IDs, with no duplicates and no cross-side action IDs.

## 7. Commands run and results

- `git status --short`: recorded pre-edit dirty worktree.
- `git diff --stat`: recorded pre-edit diff shape.
- `git log --oneline -5`: recorded baseline commits.
- `pnpm.cmd --filter @mmbt/core-draft test`: initial sandbox/Corepack EPERM, rerun escalated and passed.
- `pnpm.cmd --filter @mmbt/core-draft typecheck`: passed.
- `pnpm.cmd --filter @mmbt/server test`: passed.
- `pnpm.cmd --filter @mmbt/server typecheck`: passed.
- `pnpm.cmd --filter @mmbt/admin-dashboard test`: passed.
- `git diff --check`: passed.
- `pnpm.cmd --filter @mmbt/admin-dashboard typecheck`: passed.
- `pnpm.cmd lint`: passed.
- `pnpm.cmd typecheck`: passed.
- `pnpm.cmd test`: passed.
- `pnpm.cmd build`: passed.

## 8. Manual verification instructions

1. Run `pnpm.cmd dev`.
2. Open the admin dashboard locally.
3. Load/select the sample LoL match.
4. Run a full manual draft until all pick slots are locked.
5. Confirm Ban/Pick labels advance naturally for each side and type instead of repeating `1`.
6. Confirm the current draft timer visibly counts down while running.
7. In Final Lineup, use `Swap with` on a BLUE card and verify only BLUE targets are available.
8. Swap two BLUE cards and verify their order changes.
9. Repeat with RED and verify only RED targets are available.
10. Use Reset Blue/Reset Red and verify each side returns to original pick order.
11. Confirm Final Lineup and verify swap/move controls become disabled.

## 9. Scope guardrails checked

- Universal core remains game-agnostic.
- Labeling counts generic `DraftAction` team/type order; it does not hardcode LoL champion names, Riot APIs, LCU behavior, or Data Dragon behavior.
- Timer display remains manual-first and passive; no automatic picks, bans, confirms, completes, or player-side automation were added.
- Direct swap remains a manual operator action.
- No runtime internet, Riot API, Data Dragon, cloud, database, login, OBS WebSocket, vMix, Bitfocus, Stream Deck, or player-client dependency was added.
- LoL roster, localization, local icons, Data Dragon scripts, ZIPs, and generated icon assets were not modified.
- The existing untracked `event-packages/sample-event/logs/production-log.jsonl` was not edited by this revision.

## 10. Confirmation overlay rendering was not changed unless explicitly necessary

Confirmed. No files under `apps/overlay` or `packages/core-overlay` were modified.

## 11. git status --short

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
?? WORKING_HANDOFF_AFTER_FIX_LOL_SWAP_PHASE_A_REVISION.md
?? apps/admin-dashboard/src/draft/actionLabels.test.ts
?? apps/admin-dashboard/src/draft/actionLabels.ts
?? apps/admin-dashboard/src/draft/timerDisplay.test.ts
?? apps/admin-dashboard/src/draft/timerDisplay.ts
?? event-packages/sample-event/logs/production-log.jsonl
?? packages/core-draft/src/labels.ts
?? packages/core-draft/src/lineup.ts
```

## 12. Suggested next step

- Manual browser rehearsal of the Draft Operator LoL flow, then Phase B can add read-only overlay/preview/program rendering for confirmed final lineup order if explicitly requested.
