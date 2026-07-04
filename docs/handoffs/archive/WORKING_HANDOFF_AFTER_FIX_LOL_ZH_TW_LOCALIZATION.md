# Working Handoff After Fix LoL zh-TW Localization

## Summary

- Added Traditional Chinese Taiwan (`zh-TW`) champion names to the generated local LoL metadata while keeping English `displayName` stable.
- Updated the LoL Data Dragon import script to merge `en_US` and `zh_TW` `champion.json` files by stable Data Dragon champion ID/key.
- Updated LoL adapter and Draft Operator search so mixed English/Chinese search works alongside existing punctuation-normalized English aliases.
- Updated Draft Operator champion cards to show zh-TW as the primary name and English as the secondary name when localization exists.
- Added adapter, API, and dashboard regression tests for generated roster count, zh-TW coverage, localized API output, localized dashboard search/rendering, English aliases, and the old 20-entry sample not returning.

## Data Generation

- zh_TW metadata was generated, not just script support.
- Generation command used Riot Data Dragon static metadata as a pre-event import source:

```text
pnpm.cmd --filter @mmbt/game-lol-sample champions:import -- --version 16.11.1
```

- Generated source: `games/lol/src/generated-champions.ts`
- Data Dragon version: `16.11.1`
- Primary language: `en_US`
- Localized language: `zh_TW`
- Shared locale key: `zh-TW`
- Hero count: `172`
- Localized name coverage: `172/172`
- Champion artwork was not downloaded.
- Runtime remains local-first and imports only generated local TypeScript metadata.

## Search Behavior Proof

- `lolSampleAdapter.searchHeroes()` now includes `localizedNames["zh-TW"]` in searchable values.
- The LoL adapter test selects a representative generated localized name from loaded heroes and asserts searching that name returns the same hero.
- Existing English behavior is covered for:
  - `Kai'Sa` / `kaisa`
  - `Kha Zix`
  - `ChoGath`
  - `Dr Mundo` / `Mundo`
  - `Nunu and Willump`
  - `Miss Fortune` / `MF`
  - `Twisted Fate` / `TF`
  - `Jarvan 4`
  - `aurelionsol`
  - `monkey king`
  - `Renata`
- Draft Operator test uses the generated LoL roster and asserts:
  - More than 160 heroes.
  - Not the old 20-entry sample.
  - `Showing 172 of 172 local entities from LoL Local Static Roster.`
  - Search by generated Kai'Sa zh-TW localized name finds `lol-kaisa`.
  - The card primary text is the generated zh-TW name and the card still contains English `Kai'Sa`.

## API Behavior Proof

- Server `/api/adapters/lol` test asserts:
  - `displayName: "LoL Local Static Roster"`.
  - `heroCount` equals `LOL_GENERATED_CHAMPION_RECORDS.length`.
  - `heroCount > 160`.
  - `heroCount !== 20`.
  - All returned LoL heroes include non-empty `localizedNames["zh-TW"]`.
  - Representative heroes such as `lol-kaisa` and `lol-wukong` include localized names.
  - Required difficult English champion names remain present.
  - No remote URLs are exposed.

## Files Changed

- `games/lol/scripts/import-data-dragon-champions.mjs`
  - Added paired en_US/zh_TW import support and localized metadata merge.
- `games/lol/src/generated-champions.ts`
  - Regenerated 172 records with `localizedNames: { "zh-TW": ... }`.
- `games/lol/src/data.ts`
  - Carries generated `localizedNames` into shared `Hero` records and adds required aliases.
- `games/lol/src/adapter.ts`
  - Preserves literal non-ASCII search variants while keeping English normalization.
- `games/lol/src/index.test.ts`
  - Added generated count, coverage, zh-TW search, English alias, and old-20 regression coverage.
- `games/lol/README.md`
  - Documented the en_US + zh_TW pre-event import workflow.
- `apps/server/src/index.test.ts`
  - Added `/api/adapters/lol` localized name and generated count assertions.
- `apps/admin-dashboard/src/draft/heroSearch.ts`
  - Added literal non-ASCII search variants for dashboard-side filtering.
- `apps/admin-dashboard/src/draft/DraftOperatorPanel.tsx`
  - Displays zh-TW primary and English secondary names for localized heroes.
- `apps/admin-dashboard/src/styles.css`
  - Added secondary champion-name styling.
- `apps/admin-dashboard/src/App.test.tsx`
  - Uses generated LoL roster data in Draft Operator tests and covers zh-TW search/rendering.
- `WORKING_HANDOFF_AFTER_FIX_LOL_ZH_TW_LOCALIZATION.md`
  - Added this handoff.

Ignored local build outputs refreshed:

- `games/lol/dist/*`
- Other workspace `dist/*` outputs from `pnpm.cmd build`

## Commands Run

- `git status --short`: succeeded; initial state had substantial existing WIP in dashboard, overlay, server, LoL adapter, docs, assets, and handoffs.
- `git diff --stat`: succeeded; initial diff recorded existing WIP.
- `git log --oneline -5`: succeeded; latest commit was `7a27559 docs: add reference-driven implementation policy`.
- `pnpm.cmd --filter @mmbt/game-lol-sample champions:import -- --version 16.11.1`: first sandbox run failed with Corepack `EPERM`; approved rerun passed and generated 172 champions with 172/172 zh-TW coverage.
- `pnpm.cmd --filter @mmbt/game-lol-sample test`: first sandbox run failed with Corepack `EPERM`; approved rerun passed, 1 file / 17 tests.
- `pnpm.cmd --filter @mmbt/game-lol-sample typecheck`: first sandbox run failed with Corepack `EPERM`; approved rerun passed.
- `pnpm.cmd --filter @mmbt/game-lol-sample build`: first sandbox run failed with Corepack `EPERM`; approved rerun passed and refreshed ignored LoL dist output.
- `pnpm.cmd --filter @mmbt/server test`: first sandbox run failed with Corepack `EPERM`; approved rerun passed, 1 file / 26 tests.
- `pnpm.cmd --filter @mmbt/server typecheck`: first sandbox run failed with Corepack `EPERM`; approved rerun passed.
- `pnpm.cmd --filter @mmbt/admin-dashboard test`: first sandbox run failed with Corepack `EPERM`; approved rerun passed, 6 files / 44 tests.
- `pnpm.cmd --filter @mmbt/admin-dashboard typecheck`: first sandbox run failed with Corepack `EPERM`; approved rerun passed.
- `pnpm.cmd test`: first sandbox run failed with Corepack `EPERM`; approved rerun passed.
- `pnpm.cmd typecheck`: first sandbox run failed with Corepack `EPERM`; approved rerun passed.
- `pnpm.cmd build`: first sandbox run failed with Corepack `EPERM`; approved rerun passed.
- Unicode sanity check: read generated Ahri localized name as UTF-8 and confirmed code points `38463 29827` (`阿璃`).

## Verification

Passed:

- LoL adapter tests.
- LoL adapter typecheck.
- Server tests.
- Server typecheck.
- Admin dashboard tests.
- Admin dashboard typecheck.
- Root workspace tests.
- Root workspace typecheck.
- Root workspace build.

Failed then resolved:

- All `pnpm.cmd` commands initially failed inside the sandbox with Windows/Corepack `EPERM` against `C:\Users\Gavin\AppData\Local\node\corepack\v1\pnpm`; each requested command passed on approved rerun.

Not run:

- `pnpm.cmd lint`, because this task requested specific test/typecheck/build commands and did not request lint.
- `pnpm.cmd install`, because dependencies were already present and no dependency changes were made.
- Manual browser/server rehearsal, because the task expectation is for the user to restart server/admin dashboard after this change. Automated API and dashboard tests covered the requested behavior.

## Scope Guardrails Checked

- Did not modify `packages/core-draft`.
- Did not redesign overlays.
- Did not change timer behavior.
- Did not change ban/pick slot labels.
- Did not download local champion icons.
- Did not add Riot API, LCU, or runtime Data Dragon sync.
- Did not add player-side automation, auto-pick, or auto-ban.
- LoL-specific Data Dragon import work stayed under `games/lol`.
- Shared type extension was not needed because `Hero.localizedNames` already existed.
- Runtime remains local-first: server/dashboard consume local generated metadata and API payloads only.

## References Used

- Riot Data Dragon static `champion.json` metadata for `en_US` and `zh_TW`, version `16.11.1`, used only through the pre-event/static import script.
- No third-party source code, assets, branding, screenshots, trade dress, or champion artwork were copied.

## Final Git Status

Run after implementation and verification:

```text
M apps/admin-dashboard/src/App.test.tsx
M apps/admin-dashboard/src/draft/DraftOperatorPanel.tsx
M apps/admin-dashboard/src/styles.css
M apps/overlay/src/guardrails.test.ts
M apps/overlay/src/overlays/DraftOverlay.test.tsx
M apps/overlay/src/overlays/DraftOverlay.tsx
M apps/overlay/src/overlays/ScoreBugOverlay.test.tsx
M apps/overlay/src/overlays/ScoreBugOverlay.tsx
M apps/server/src/index.test.ts
M docs/API_SOCKET_CONTRACT.md
M event-packages/sample-event/README.md
M games/lol/package.json
M games/lol/src/adapter.ts
M games/lol/src/data.ts
M games/lol/src/index.test.ts
M games/lol/src/index.ts
M games/lol/src/validation.ts
?? WIP_BEFORE_FIX_LOL_API_ROSTER.patch
?? WORKING_HANDOFF_AFTER_FIX_LOL_API_ROSTER.md
?? WORKING_HANDOFF_AFTER_FIX_LOL_ZH_TW_LOCALIZATION.md
?? WORKING_HANDOFF_AFTER_LOL_CHAMPION_DATA_IMAGE_PIPELINE.md
?? ZIP/
?? apps/admin-dashboard/src/components/
?? apps/admin-dashboard/src/draft/heroSearch.ts
?? apps/overlay/src/components/SafeLocalImage.tsx
?? docs/ZIP.zip
?? docs/ZIP/
?? event-packages/sample-event/assets/hero-icons/lol/
?? event-packages/sample-event/logs/production-log.jsonl
?? games/lol/README.md
?? games/lol/scripts/
?? games/lol/src/generated-champions.ts
```

Note: Several modified/untracked files above were pre-existing WIP from earlier tasks. This task worked within the existing WIP and did not revert unrelated changes.

## Suggested Next Task

- Restart the server/admin dashboard and manually confirm `/api/adapters/lol` returns 172 heroes with `localizedNames["zh-TW"]`, then rehearse Draft Operator searches using Chinese names, `MF`, `TF`, `Mundo`, `Jarvan 4`, and `MonkeyKing`.
