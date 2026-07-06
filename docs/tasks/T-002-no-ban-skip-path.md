# T-002: No-Ban (skip) path — engine → API → operator → overlay

Status: SPEC READY — not run · Owner: Codex · Reviewer: planner + user

## Why

LCK reality includes forfeited bans (empty ban slot stays empty on broadcast). The engine already defines a `SKIPPED` action status (`COMPLETE_ACTION_STATUSES` includes it; `isActionComplete` honors it) but nothing can set it: no engine function, no endpoint, no operator control. Rules audit 2026-07-05.

## Design decisions (locked)

- Skip applies to **BAN slots only**. Picks can never be skipped (a game needs 10 locked picks; real tournaments never skip picks).
- Engine: additive pure function in `packages/core-draft` (e.g. `skipDraftAction`) — validates target slot is a pending BAN in the current phase, sets status `SKIPPED` (no heroId), appends a history entry (e.g. `ACTION_SKIPPED`), advances phase exactly like a lock does when the phase completes. Existing undo must work on skipped actions like on locked ones.
- Server: new endpoint following the existing draft action route pattern in `apps/server/src/api.ts` (mirror the lock action route shape, e.g. `POST /api/drafts/:draftId/actions/skip`), with audit event `DRAFT_ACTION_SKIPPED` and the same broadcast pattern as lock actions.
- Operator UI: a single "No Ban" button in the Draft Operator panel, visible/enabled only when the active phase is a BAN phase, styled consistently with existing controls, with the same confirm interaction pattern used for destructive/irreversible actions elsewhere in the panel (if none exists, a simple confirm step).
- Overlay: view model maps a SKIPPED ban slot to an explicit empty/"no ban" visual state with NO text label (no "SKIPPED"/"PENDING" strings on the broadcast surface). Keep the current visual rendering minimal — final visuals arrive with the redesign (T-003).

## Codex prompt (copy verbatim)

```text
TASK: T-002 — No-Ban (skip) path for ban slots

READ FIRST
- AGENTS.md
- docs/tasks/T-002-no-ban-skip-path.md (this spec — "Design decisions (locked)" is binding)
- packages/core-draft/src/actions.ts, constants.ts; apps/server/src/api.ts (draft action routes); apps/admin-dashboard/src/draft/DraftOperatorPanel.tsx; apps/overlay/src/overlays/DraftOverlay.tsx

GOAL
An operator can forfeit a ban ("No Ban"): the ban slot completes as SKIPPED with no hero, the draft advances normally, undo works, and the overlay shows an empty ban slot with no text label.

SCOPE — IN
1. packages/core-draft: additive skipDraftAction (or equivalent) per locked design; history entry; phase advance identical to lock; undo/redo compatibility.
2. apps/server: skip endpoint mirroring the existing lock-action route pattern; DRAFT_ACTION_SKIPPED audit event; same state broadcast behavior as lock.
3. Draft Operator panel: "No Ban" button, BAN phases only, consistent styling, confirm step.
4. Overlay view model: SKIPPED ban slot → empty state, zero text labels on the broadcast surface.

SCOPE — OUT (do not do any of these)
- Do not allow skipping PICK slots anywhere (engine validation must reject).
- Do not modify existing lock/undo/timer code paths beyond additive integration points.
- Do not auto-skip on timer expiry. Skip is a manual operator action only.
- Do not restyle the operator panel or overlay beyond the single button and the empty-slot state.
- Do not add overlay mutation capability of any kind; overlay change is view-model/rendering only.
- Do not run git add/commit/push.

FILES EXPECTED TO CHANGE
- packages/core-draft/src/actions.ts (+ its test file)
- apps/server/src/api.ts, audit-log.ts if event constants live there (+ server test file)
- apps/admin-dashboard/src/draft/DraftOperatorPanel.tsx (+ test)
- apps/overlay/src/overlays/DraftOverlay.tsx (+ test)

ACCEPTANCE CRITERIA
1. During any BAN phase, operator clicks No Ban → confirm → slot completes as SKIPPED, draft advances (phase advance matches lock behavior including multi-count phases).
2. Undo restores a skipped slot to pending, identical to undoing a lock.
3. Skip attempt on a PICK slot or out-of-phase slot is rejected with a clear engine error.
4. Overlay renders the skipped ban as an empty slot; no new text strings appear on the overlay.
5. Audit log contains DRAFT_ACTION_SKIPPED with slot metadata.

TESTING
- Engine unit tests: skip validity, rejection cases, phase advance, undo round-trip.
- Server test: endpoint happy path + rejection.
- pnpm lint, pnpm typecheck, pnpm test all pass.

REPORT FORMAT (produce this at the end, then STOP)
1. Summary. 2. File-by-file change list with line counts. 3. Test output summary. 4. Deviations flagged. 5. Open questions.
Do not start follow-up work after the report.
```

## Review checklist (planner fills after Codex run)

- ☑ Engine additive: skipDraftAction/resolveSkippableDraftAction/skipResolvedAction parallel to lock path; lockHero untouched (verified by read)
- ☑ pick-skip + out-of-phase rejected without state mutation, error `draft-skip-not-ban` (tested)
- ☑ multi-count ban phase double-skip tested; undo/redo round-trip tested
- ☑ overlay skipped ban renders empty, zero text (isSkippedBan short-circuits label AND sublabel)
- ☑ endpoint mirrors existing per-action route shape (approved deviation); DRAFT_ACTION_SKIPPED audit; inherits T-001 snapshot scheduling via shared commit helper
- ☑ operator button gated (canSkipBan) + confirm dialog + busy disable
- ☑ Codex verify suite green per report
- ☐ user manual UI check passed → then commit
