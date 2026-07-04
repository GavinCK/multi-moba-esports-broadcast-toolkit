# Working Handoff: ADD-MATCH-PRESENTATION-METADATA-D - Teams / Players Preview

## 1. Summary

- Added read-only Teams tab presentation previews for team identity, local logo asset path, safe local logo preview/fallback, country, and primary/secondary colors.
- Added read-only Players tab preview fields for player ID, display name, handle, role, team short name/team ID, country, and existing metadata-driven status where present.
- Added a read-only Broadcast Player Order section to the Players tab with a local match selector and BLUE/RED side order previews from `match.presentation.playerDisplayOrderBySide`.
- Added focused Admin Dashboard tests for Teams, Players, broadcast player order, missing order fallback, unresolved player IDs, safe logo fallback, and no mutation calls.
- Did not modify server, overlay, draft core, match core, event setup JSON, LoL roster/localization/icons, timer behavior, ban/pick rules, final lineup logic, Producer Panel save behavior, or runtime logs.

## 2. Files Changed

- `apps/admin-dashboard/src/App.tsx`
- `apps/admin-dashboard/src/App.test.tsx`
- `apps/admin-dashboard/src/styles.css`
- `WORKING_HANDOFF_AFTER_ADD_MATCH_PRESENTATION_METADATA_D_TEAMS_PLAYERS_PREVIEW.md`

## 3. Teams Tab Preview Behavior

- Shows team full name, team ID, short name, player count, country code, logo asset path, and primary/secondary color values.
- Uses `team.logoAssetPath` first, then `team.logoUrl`, as the displayed local logo asset path.
- Converts safe local package-relative asset paths such as `assets/team-logos/blue-meteors.svg` to browser paths such as `/assets/team-logos/blue-meteors.svg`.
- Uses `SafeLocalImage` for the logo preview and never fetches external URLs.
- Leaves the asset path visible even when the preview image fails.

## 4. Players Tab Preview Behavior

- Shows player display name, player ID, handle, team short name, team ID, role, country/nationality, and metadata status when present.
- Resolves team short names from the loaded dashboard state.
- Falls back to team name/team ID when a team short name is unavailable.
- Does not add Save, edit, create, update, or delete controls.

## 5. Broadcast Player Order Preview Behavior

- Added a Players-tab `Broadcast Player Order` section.
- Includes a local-only match selector so operators can inspect any loaded match without mutating runtime state.
- Displays BLUE and RED order from:

```text
match.presentation.playerDisplayOrderBySide.BLUE
match.presentation.playerDisplayOrderBySide.RED
```

- Each ordered player row shows order number, handle/display name, role, team short name, and player ID.
- The selector only changes local dashboard view state and does not call a REST mutation endpoint.

## 6. Fallback Behavior

- Missing `playerDisplayOrderBySide` shows: `No broadcast player order configured for this match.`
- Missing side-specific order shows: `No player order configured for this side.`
- Unresolved player IDs render visibly as unresolved IDs without crashing.
- Missing handle falls back to display name, then player ID.
- Missing team short name falls back to team name, then team ID.
- Unsafe or missing logo preview paths show a text fallback instead of fetching externally.

## 7. Guardrails Checked

- No Teams editor added.
- No Players editor added.
- No mutation endpoints called from Teams/Players previews.
- No Save/edit controls added to Teams/Players previews.
- Timer not changed.
- Ban/pick rules not changed.
- Draft phase generation not changed.
- Final lineup reorder/reset/confirm logic not changed.
- Draft Operator controls not changed.
- Producer Panel save behavior not changed.
- Overlay final lineup order logic not changed.
- Overlay timer local ticking logic not changed.
- Overlay redesign not started.
- Server code not changed.
- Event package setup JSON not changed.
- Runtime logs not changed by source edits.

## 8. Commands Run and Results

Pre-edit required checks:

- `git status --short`: passed, clean output.
- `git diff --stat`: passed, clean output.
- `git log --oneline -8`: passed.
  - `30944eb feat(admin): add match presentation producer controls`
  - `61b2899 feat(server): add match presentation update API`
  - `a59b084 feat(match): add presentation metadata foundation`
  - `9c84ebc fix(overlay): tick draft timer locally`
  - `993cd7e feat(overlay): use final lineup pick order`
  - `3ec6963 feat(draft): add final lineup swap phase controls`
  - `5f9d483 feat(lol): add local champion icon package`
  - `8ec5bce feat(lol): add generated roster and zh-TW metadata`

Verification:

- `pnpm.cmd --filter @mmbt/admin-dashboard test`: initial sandbox/Corepack `EPERM`, rerun with approved escalation passed; 8 files / 63 tests.
- `pnpm.cmd --filter @mmbt/admin-dashboard typecheck`: initial sandbox/Corepack `EPERM`, rerun with approved escalation passed.
- `pnpm.cmd --filter @mmbt/server test`: passed; 35 tests.
- `pnpm.cmd --filter @mmbt/server typecheck`: passed.
- `pnpm.cmd test`: passed across workspace.
- `pnpm.cmd lint`: passed across workspace.
- `pnpm.cmd typecheck`: passed across workspace.
- `pnpm.cmd build`: passed across workspace.
- `git diff --check`: passed.
- `git diff --stat`: passed; tracked diff is limited to Admin Dashboard source/test/style files.

Local app smoke:

- First `Start-Process` attempt failed because PowerShell requires separate stdout/stderr redirect paths.
- Restarted server and Admin Dashboard with separate temp logs.
- `http://127.0.0.1:3000/api/health`: HTTP 200.
- `http://127.0.0.1:5173`: HTTP 200.
- In-app Browser verification attempted twice and was blocked by the existing Node/browser runtime issue: `windows sandbox failed: spawn setup refresh`.
- Stopped local listeners for `127.0.0.1:3000` and `127.0.0.1:5173`; final `netstat` showed no local listeners left on those ports.

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

4. Go to Teams tab and confirm:
   - Blue Meteors and Red Titans show full names.
   - Short names are visible.
   - Logo asset paths are visible.
   - Local logo preview works or safe fallback appears.
   - Primary and secondary color values are visible.
   - No edit or save controls are present.

5. Go to Players tab and confirm:
   - Player handles are visible.
   - Roles are visible.
   - Team short names and team IDs are visible.
   - Broadcast Player Order section is visible.
   - Select `match_lol-showmatch`.
   - BLUE order has five players.
   - RED order has five players.
   - Missing/unresolved data would remain readable and would not crash the UI.

6. Confirm no Teams/Players save button or mutation behavior was added.

7. Regression checks:
   - Producer Panel presentation save still works.
   - Draft Operator still works.
   - Overlay timer still ticks locally.
   - Overlay final lineup order still updates after swap/move.
   - No overlay redesign has started.

## 10. git status --short

Expected final status after this handoff:

```text
 M apps/admin-dashboard/src/App.test.tsx
 M apps/admin-dashboard/src/App.tsx
 M apps/admin-dashboard/src/styles.css
?? WORKING_HANDOFF_AFTER_ADD_MATCH_PRESENTATION_METADATA_D_TEAMS_PLAYERS_PREVIEW.md
```

## 11. Notes / Risks

- `WORKING_HANDOFF_AFTER_ADD_MATCH_PRESENTATION_METADATA_A_API.md` was referenced by task context but is not present in the repository. The task proceeded from committed source state plus B/C handoffs.
- Browser UI automation could not complete because the in-app browser runtime failed to start in this Windows sandbox. Automated React DOM tests cover the Teams/Players preview behavior and mutation guardrails.
- `event-packages/sample-event/logs/production-log.jsonl` already exists but is not reported by `git status --short`; it was not modified by the source changes.
- No public reference repositories or third-party assets were used for this task.

## 12. Suggested Next Task

- Project owner manual UI review of Teams and Players tabs with local server/dashboard running, then commit/push if accepted.
