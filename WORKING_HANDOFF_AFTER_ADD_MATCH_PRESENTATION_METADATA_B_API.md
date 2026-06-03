# Working Handoff After Add Match Presentation Metadata B API

## 1. Summary

- Added a runtime-only server API path for match presentation metadata updates:
  `PATCH /api/matches/:matchId/presentation`.
- The endpoint supports safe partial updates for production-facing presentation metadata:
  `matchLabel`, `patchLabel`, `seriesFormat`, `gameNumber`, `scoreBySide`, `firstPickSide`, and `sideStatusLabel`.
- The update path merges accepted fields into existing match presentation metadata, increments runtime state revision, appends a JSONL audit entry, and broadcasts through the existing `state:patch` / `log:entry` / `health:update` socket mechanism.
- No Admin UI, Producer Panel UI, Overlay UI, draft timer, ban/pick, final lineup, LoL roster, localization, icon, sample-event setup JSON, or runtime log file was intentionally changed.

## 2. Files Changed

- `apps/server/src/api.ts`
  - Added presentation patch validation, merge, commit, audit, and state-patch broadcast logic.
  - Added `PATCH /api/matches/:matchId/presentation`.
- `apps/server/src/index.test.ts`
  - Added REST tests for valid partial update, merge behavior, `/api/state`, `/api/matches`, and `/api/matches/:matchId`.
  - Added invalid payload tests for missing match, non-object payload, unknown fields, invalid `seriesFormat`, invalid `gameNumber`, invalid scores, invalid `firstPickSide`, and empty string values.
  - Added preservation assertions for draft status, phase, timer, actions, picks, bans, locked heroes, and final lineup.
  - Added Socket.IO broadcast test for `state:patch`, `log:entry`, and no `draft:updated`.
- `WORKING_HANDOFF_AFTER_ADD_MATCH_PRESENTATION_METADATA_B_API.md`
  - This handoff.

## 3. API Route Added

```text
PATCH /api/matches/:matchId/presentation
```

Example:

```json
{
  "matchLabel": "Grand Final",
  "patchLabel": "Patch 26.10",
  "seriesFormat": "BO5",
  "gameNumber": 2,
  "scoreBySide": {
    "BLUE": 1,
    "RED": 0
  },
  "firstPickSide": "BLUE"
}
```

## 4. Request / Response Behavior

- Request body must be a JSON object.
- Supports partial top-level updates.
- `scoreBySide` supports nested partial updates, so `{"scoreBySide":{"BLUE":1}}` preserves the current RED score.
- `operatorId` is accepted as request metadata for audit logging.
- `now` is accepted only for the existing test-time timestamp convention.
- Unknown fields are rejected.
- Empty update payloads are rejected.
- Successful response uses existing `ApiResponse<T>` shape:

```json
{
  "ok": true,
  "data": {
    "revision": 2,
    "match": {}
  }
}
```

## 5. Validation Behavior

- Missing `matchId` returns `MATCH_NOT_FOUND`.
- Non-object payload returns `MATCH_PRESENTATION_INVALID_PAYLOAD`.
- Unknown fields return `MATCH_PRESENTATION_INVALID_PAYLOAD`.
- `seriesFormat` must be `BO1`, `BO3`, or `BO5`.
- `gameNumber` must be a positive integer.
- `scoreBySide.BLUE` and `scoreBySide.RED`, when provided, must be non-negative integers.
- `firstPickSide` must be `BLUE` or `RED`.
- `matchLabel`, `patchLabel`, and `sideStatusLabel` must be non-empty safe strings within sensible length limits.
- `playerDisplayOrderBySide` is intentionally preserved but not mutable through this endpoint.

## 6. Runtime / State Update Behavior

- Updates only the selected match's `presentation` object in loaded runtime state.
- Does not write back to event package setup JSON.
- Does not mutate match score, match current game number, game instances, draft runtime state, production runtime state, or overlay state.
- `/api/state` reflects updated presentation metadata after PATCH.
- `/api/matches` reflects updated presentation metadata after PATCH.
- `/api/matches/:matchId` reflects updated presentation metadata after PATCH.
- Successful mutations increment `runtimeState.revision` and update `lastStateUpdateAt`.

## 7. Socket / State Broadcast Behavior

- Successful updates append audit event `MATCH_PRESENTATION_UPDATED`.
- Successful updates broadcast:
  - `state:patch`
  - `log:entry`
  - `health:update`
- The `state:patch` payload includes:
  - `reason: "MATCH_PRESENTATION_UPDATED"`
  - `changed: ["matches", "matches.<matchId>.presentation"]`
  - `entityId: <matchId>`
- The endpoint does not broadcast `draft:updated` or `draft:timer`.

## 8. Backward Compatibility Notes

- Existing event packages without explicit presentation metadata still load because load-time defaults remain unchanged.
- Existing `/api/state` consumers continue to receive the same shape with updated match data.
- Existing `/api/matches` consumers continue to receive the same match list shape.
- Existing Admin and Overlay code paths are not changed.
- Existing draft timer local ticking and final lineup behavior are not touched.

## 9. Guardrails Checked

- Timer not changed.
- Ban/pick rules not changed.
- Draft phase generation not changed.
- Final lineup reorder/reset/confirm logic not changed.
- Admin final lineup controls not changed.
- Admin UI not changed.
- Producer Panel UI not changed.
- Overlay UI and overlay visual design not changed.
- LoL roster data not changed.
- zh-TW localization data not changed.
- Local champion icon package not changed.
- Event package setup JSON not changed.
- Runtime sample-event logs not changed by manual verification.
- No commit or push performed.

## 10. Commands Run And Results

Pre-edit required checks:

- `git status --short`: passed, clean output.
- `git diff --stat`: passed, clean output.
- `git log --oneline -8`: passed.
  - `a59b084 feat(match): add presentation metadata foundation`
  - `9c84ebc fix(overlay): tick draft timer locally`
  - `993cd7e feat(overlay): use final lineup pick order`
  - `3ec6963 feat(draft): add final lineup swap phase controls`
  - `5f9d483 feat(lol): add local champion icon package`
  - `8ec5bce feat(lol): add generated roster and zh-TW metadata`
  - `aeed802 feat(admin): add bilingual LoL champion search`
  - `7a27559 docs: add reference-driven implementation policy`

Verification:

- `pnpm.cmd --filter @mmbt/server test`: initial sandbox/Corepack `EPERM`, rerun with approved escalation passed; 35 server tests passed.
- `pnpm.cmd --filter @mmbt/server typecheck`: initial sandbox/Corepack `EPERM`, rerun with approved escalation passed.
- `pnpm.cmd --filter @mmbt/core-match test`: passed; 13 tests passed.
- `pnpm.cmd --filter @mmbt/core-match build`: passed.
- `pnpm.cmd test`: passed on final code.
- `pnpm.cmd lint`: first run failed on `no-control-regex` in new code, fixed; rerun passed.
- `pnpm.cmd typecheck`: passed.
- `pnpm.cmd build`: passed.
- `git diff --check`: passed.
- `git diff --stat`: passed; tracked diff shows API and server test changes. The untracked handoff appears in `git status --short`.
- `git status --short`: expected final output below.

## 11. Manual Verification Instructions

Manual verification was not run against `event-packages/sample-event` because the PATCH endpoint appends runtime JSONL audit logs, and this task explicitly avoided runtime log changes.

Recommended manual verification after review:

1. Start server:

```powershell
pnpm.cmd --filter @mmbt/server dev
```

2. Check current state:

```text
http://127.0.0.1:3000/api/state
```

3. Send PATCH request:

```powershell
Invoke-RestMethod `
  -Method Patch `
  -Uri "http://127.0.0.1:3000/api/matches/match_lol-showmatch/presentation" `
  -ContentType "application/json" `
  -Body '{"gameNumber":2,"scoreBySide":{"BLUE":1,"RED":0},"matchLabel":"Grand Final","patchLabel":"Patch 26.10","seriesFormat":"BO5"}'
```

4. Re-check:

```text
http://127.0.0.1:3000/api/state
http://127.0.0.1:3000/api/matches
http://127.0.0.1:3000/api/matches/match_lol-showmatch
```

5. Confirm metadata updated.

6. Confirm draft data did not change:

- Draft phase unchanged.
- Current pick/ban unchanged.
- Timer state unchanged.
- Picks unchanged.
- Bans unchanged.
- Final lineup unchanged.

## 12. git status --short

Expected final status after this handoff file:

```text
 M apps/server/src/api.ts
 M apps/server/src/index.test.ts
?? WORKING_HANDOFF_AFTER_ADD_MATCH_PRESENTATION_METADATA_B_API.md
```

## 13. Suggested Next Task

- Add Producer Panel controls that call `PATCH /api/matches/:matchId/presentation`, keeping the same validation and runtime-only persistence boundary.
