# Working Handoff: ADD-MATCH-PRESENTATION-METADATA-C - Producer Panel Controls

## 1. Summary

- Added a minimal Match Presentation section to the existing Producer Panel.
- Added dashboard API client support for `PATCH` requests.
- Wired Producer Panel Save to `PATCH /api/matches/:matchId/presentation`.
- Added focused Producer Panel and API client tests for initialization, safe defaults, payload shape, saving state, API errors, selected-match changes, and guardrails against draft endpoint calls.
- Did not commit or push.

## 2. Files Changed

- `apps/admin-dashboard/src/client/apiClient.ts`
- `apps/admin-dashboard/src/client/apiClient.test.ts`
- `apps/admin-dashboard/src/producer/ProducerPanel.tsx`
- `apps/admin-dashboard/src/producer/ProducerPanel.test.tsx`
- `apps/admin-dashboard/src/App.test.tsx`
- `WORKING_HANDOFF_AFTER_ADD_MATCH_PRESENTATION_METADATA_C_PRODUCER_PANEL.md`

## 3. Producer Panel UI Behavior

- The existing Producer Panel now includes `Match Presentation`.
- Fields shown:
  - Match Label
  - Patch Label
  - Series Format: `BO1`, `BO3`, `BO5`
  - Game Number, minimum `1`
  - BLUE Score, minimum `0`
  - RED Score, minimum `0`
  - First Pick Side: `BLUE`, `RED`
  - Side Status Label
  - Reset Form
  - Save Presentation
- The form uses the existing Producer Panel selected match context.
- When the selected match changes, the form repopulates from `match.presentation`.
- Old snapshots with missing presentation metadata fall back to match title, match format, current game number, score, and safe first-pick defaults.

## 4. API Client Behavior

- `DashboardApiClient` now exposes `patch<TData>(path, body)`.
- `createDashboardApiClient` sends JSON PATCH requests through the existing `ApiResponse<T>` envelope handling.
- Producer Panel Save calls only:

```text
PATCH /api/matches/:matchId/presentation
```

- The payload includes only mutable presentation metadata plus `operatorId`.
- It intentionally does not send `playerDisplayOrderBySide`.

## 5. Form Validation / Error Behavior

- Match Label must not be empty.
- Game Number must be a positive integer.
- BLUE Score and RED Score must be non-negative integers.
- Blank optional Patch Label and Side Status Label are omitted from the PATCH payload, matching the server's empty-string rejection behavior.
- Save is disabled and shows `Saving...` while the PATCH request is in progress.
- Successful save shows `Match presentation metadata updated.`
- API rejections are displayed through the existing Producer Panel structured error banner.

## 6. Runtime State Sync Behavior

- After a successful PATCH, the form updates from the API response immediately.
- The Producer Panel then calls the existing `onRefresh` path so local admin state can refresh even if realtime is disconnected.
- If realtime is connected, the existing server `state:patch` flow remains responsible for eventual full dashboard state refresh.
- No dashboard socket mutation path was added.

## 7. Guardrails Checked

- Timer not changed.
- Ban/pick rules not changed.
- Final lineup logic not changed.
- Draft Operator controls not changed.
- Overlay layout/redesign not started.
- Teams/Players editor not started.
- Event package setup JSON not touched.
- Server implementation not changed.
- Overlay implementation not changed.
- `playerDisplayOrderBySide` is not sent by the Producer Panel presentation save path.
- Producer Panel tests assert the presentation save does not call draft, lineup, timer, hover, lock, undo, reset, or complete endpoints.

## 8. Commands Run and Results

- `git status --short`: clean before editing.
- `git diff --stat`: no output before editing.
- `git log --oneline -8`: latest commits:
  - `61b2899 feat(server): add match presentation update API`
  - `a59b084 feat(match): add presentation metadata foundation`
  - `9c84ebc fix(overlay): tick draft timer locally`
  - `993cd7e feat(overlay): use final lineup pick order`
  - `3ec6963 feat(draft): add final lineup swap phase controls`
  - `5f9d483 feat(lol): add local champion icon package`
  - `8ec5bce feat(lol): add generated roster and zh-TW metadata`
  - `aeed802 feat(admin): add bilingual LoL champion search`
- `pnpm.cmd --filter @mmbt/admin-dashboard test`: first sandboxed run failed with Corepack `EPERM`; rerun with approved escalation passed, 8 files / 59 tests.
- `pnpm.cmd --filter @mmbt/admin-dashboard typecheck`: passed.
- `pnpm.cmd --filter @mmbt/server test`: passed, 1 file / 35 tests.
- `pnpm.cmd --filter @mmbt/server typecheck`: passed.
- `pnpm.cmd test`: passed across workspace.
- `pnpm.cmd lint`: passed across workspace.
- `pnpm.cmd typecheck`: passed across workspace.
- `pnpm.cmd build`: passed across workspace.
- `git diff --check`: passed.
- Local dev server smoke setup:
  - Started server and admin dashboard.
  - Confirmed `http://127.0.0.1:3000/api/health` returned HTTP 200.
  - Confirmed `http://127.0.0.1:5173` returned HTTP 200.
  - In-app browser automation was attempted twice but blocked by `node_repl` kernel startup failure: `windows sandbox failed: spawn setup refresh`.
  - Stopped listener PIDs `29620` and `36012`; final port check showed only `TIME_WAIT` entries for local ports.

## 9. Manual Verification Instructions

1. Start server:

```powershell
pnpm.cmd --filter @mmbt/server dev
```

2. Start Admin Dashboard:

```powershell
pnpm.cmd --filter @mmbt/admin-dashboard dev -- --force
```

3. Open:

```text
http://127.0.0.1:5173
```

4. Go to Producer Panel.
5. Select `match_lol-showmatch` if needed.
6. Update:
   - Match Label: `Grand Final`
   - Patch Label: `Patch 26.10`
   - Series Format: `BO5`
   - Game Number: `2`
   - BLUE Score: `1`
   - RED Score: `0`
   - First Pick Side: `BLUE`
   - Side Status Label: `1st Pick`
7. Save.
8. Confirm success message appears.
9. Check:

```text
http://127.0.0.1:3000/api/state
http://127.0.0.1:3000/api/matches
http://127.0.0.1:3000/api/matches/match_lol-showmatch
```

10. Confirm draft phase, pick/ban state, timer, bans, picks, and final lineup are unchanged.
11. Do not commit `event-packages/sample-event/logs/production-log.jsonl` if manual save creates it.

## 10. git status --short

```text
 M apps/admin-dashboard/src/App.test.tsx
 M apps/admin-dashboard/src/client/apiClient.test.ts
 M apps/admin-dashboard/src/client/apiClient.ts
 M apps/admin-dashboard/src/producer/ProducerPanel.test.tsx
 M apps/admin-dashboard/src/producer/ProducerPanel.tsx
?? WORKING_HANDOFF_AFTER_ADD_MATCH_PRESENTATION_METADATA_C_PRODUCER_PANEL.md
```

## 11. Suggested Next Task

- Manual UI review in the Producer Panel with local server/dashboard running, then owner commit/push if accepted.
