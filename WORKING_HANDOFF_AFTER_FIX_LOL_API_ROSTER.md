# Working Handoff After Fix LoL API Roster

## Summary

- Fixed the LoL adapter API/runtime path so the server can expose the generated local static LoL roster instead of the old 20-entry sample.
- The stale layer was `games/lol/dist/data.js`, which is ignored by git but is still used by Node runtime package resolution through `@mmbt/game-lol-sample` package `main`.
- Source `games/lol/src/data.ts` was already mostly converted to `LOL_GENERATED_CHAMPION_RECORDS`; this task changed the public display name to `LoL Local Static Roster`, tightened regression tests, and rebuilt ignored local `dist` output so the server runtime resolves the generated roster.
- Current local `games/lol/src/generated-champions.ts` contains 172 generated champion records by direct source count. The API now exposes all 172 records. This differs from the task note saying 174; I did not invent missing records or download anything.

## Initial Repo State Recorded

`git status --short` before editing:

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

`git diff --stat` before editing:

```text
 apps/admin-dashboard/src/App.test.tsx              | 471 ++++++++++++++++++++-
 .../src/draft/DraftOperatorPanel.tsx               | 103 ++++-
 apps/admin-dashboard/src/styles.css                |  53 ++-
 apps/overlay/src/guardrails.test.ts                |   8 +
 apps/overlay/src/overlays/DraftOverlay.test.tsx    |  10 +
 apps/overlay/src/overlays/DraftOverlay.tsx         |   7 +-
 apps/overlay/src/overlays/ScoreBugOverlay.test.tsx |   1 +
 apps/overlay/src/overlays/ScoreBugOverlay.tsx      |   5 +-
 apps/server/src/index.test.ts                      |  56 +++
 docs/API_SOCKET_CONTRACT.md                        |   2 +-
 event-packages/sample-event/README.md              |   1 +
 games/lol/package.json                             |   4 +-
 games/lol/src/adapter.ts                           | 102 ++++-
 games/lol/src/data.ts                              | 117 +++--
 games/lol/src/index.test.ts                        | 131 +++++-
 games/lol/src/index.ts                             |   1 +
 games/lol/src/validation.ts                        |   6 +-
 17 files changed, 989 insertions(+), 89 deletions(-)
```

`git log --oneline -5` before editing:

```text
7a27559 docs: add reference-driven implementation policy
acefe1e docs: research LoL draft overlay design
e073b5c docs: update README local run and v0.1 scope
ff906b1 docs: add game adapter developer guide
9a8998e docs: add operator guide
```

## Files Changed In This Task

- `games/lol/src/data.ts`
  - Renamed adapter display name to `LoL Local Static Roster`.
- `games/lol/src/index.test.ts`
  - Added/strengthened generated roster regression coverage for `loadHeroes()`, `>160` count, and difficult champion names.
- `apps/server/src/index.test.ts`
  - Added/strengthened `/api/adapters/lol` regression coverage for `>160`, display name, local icon paths, and required difficult names.
- `apps/admin-dashboard/src/App.test.tsx`
  - Updated existing test fixture display-name strings to match the new adapter display name.
- `WORKING_HANDOFF_AFTER_FIX_LOL_API_ROSTER.md`
  - Added this handoff.

Ignored local build output refreshed by commands:

- `games/lol/dist/*`
- other workspace `dist/*` outputs from `pnpm.cmd build`

## Exact Old-20 Source

- The old 20-entry API response was coming from ignored build artifact `games/lol/dist/data.js`.
- `apps/server` resolves `@mmbt/game-lol-sample` through package `main`, which points at `dist/index.js`; that old dist file imported the old 20-entry data.
- Before rebuilding, `pnpm.cmd --filter @mmbt/server test` failed and showed `LoL Static Manual Sample` plus the 20 old sample champions from `dist`.
- After `pnpm.cmd --filter @mmbt/game-lol-sample build`, `games/lol/dist/data.js` imports `./generated-champions.js` and server tests passed.

## API Verification

Temporary built server check against `http://127.0.0.1:3000/api/adapters/lol` returned:

```text
displayName: LoL Local Static Roster
heroes.Count: 172
```

Required difficult names verified from the API:

```text
Kai'Sa          True lol-kaisa            assets/hero-icons/lol/Kaisa.png
Kha'Zix         True lol-khazix           assets/hero-icons/lol/Khazix.png
Cho'Gath        True lol-chogath          assets/hero-icons/lol/Chogath.png
Dr. Mundo       True lol-dr-mundo         assets/hero-icons/lol/DrMundo.png
Nunu & Willump  True lol-nunu-and-willump assets/hero-icons/lol/Nunu.png
Miss Fortune    True lol-miss-fortune     assets/hero-icons/lol/MissFortune.png
Twisted Fate    True lol-twisted-fate     assets/hero-icons/lol/TwistedFate.png
Jarvan IV       True lol-jarvan-iv        assets/hero-icons/lol/JarvanIV.png
Aurelion Sol    True lol-aurelion-sol     assets/hero-icons/lol/AurelionSol.png
Wukong          True lol-wukong           assets/hero-icons/lol/MonkeyKing.png
Renata Glasc    True lol-renata-glasc     assets/hero-icons/lol/Renata.png
```

The temporary server process was stopped after verification. If a user has an existing long-running server process, it must be restarted so Node reloads rebuilt `@mmbt/game-lol-sample` dist output.

## Commands Run

- `git status --short`: succeeded, output recorded above.
- `git diff --stat`: succeeded, output recorded above.
- `git log --oneline -5`: succeeded, output recorded above.
- `pnpm --filter @mmbt/game-lol-sample test`: failed on Windows PowerShell execution policy for `pnpm.ps1`; reran with `pnpm.cmd`.
- `pnpm.cmd --filter @mmbt/game-lol-sample test`: passed, 1 file / 16 tests.
- `pnpm.cmd --filter @mmbt/game-lol-sample typecheck`: passed.
- `pnpm.cmd --filter @mmbt/server test`: first run failed because stale `games/lol/dist/data.js` still served the old 20-entry sample.
- `pnpm.cmd --filter @mmbt/game-lol-sample build`: passed, refreshed ignored LoL dist.
- `pnpm.cmd --filter @mmbt/server test`: passed, 1 file / 26 tests.
- `pnpm.cmd --filter @mmbt/server typecheck`: passed.
- `pnpm.cmd test`: passed, full workspace tests.
- `pnpm.cmd typecheck`: passed, full workspace typecheck.
- `pnpm.cmd build`: passed, full workspace build.
- Temporary built server API check with `Invoke-RestMethod`: passed, `/api/adapters/lol` returned 172 heroes and all required difficult names.

## Verification

Passed:

- LoL adapter tests.
- LoL adapter typecheck.
- Server API tests after rebuilding LoL adapter dist.
- Server typecheck.
- Full workspace test.
- Full workspace typecheck.
- Full workspace build.
- Manual API check against a temporary built server.

Failed then resolved:

- Initial `pnpm.cmd --filter @mmbt/server test` failed because the server package loaded stale ignored `games/lol/dist` output. Rebuilding `@mmbt/game-lol-sample` resolved it.

Not run:

- `pnpm lint`, because this recovery task requested test/typecheck/build commands only.
- `pnpm install`, because dependencies were already available and this task did not require dependency changes.

## Scope Confirmations

- Did not modify `packages/core-draft`.
- Did not redesign overlays.
- Did not change timer behavior.
- Did not change ban/pick slot labels.
- Did not download champion images.
- Did not add runtime Data Dragon CDN, Riot API, LCU, or internet dependency.
- Data Dragon remains represented only as pre-event/static generated metadata in `/games/lol`.
- No commit was made.

## Final Git Status

`git status --short` after this task:

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

## Notes / Risks

- Current generated source count is 172 in this worktree, not the 174 stated in the task note. The API now exposes the full generated source count available locally.
- `games/lol/dist` is ignored but still required for Node runtime package resolution. Developers starting only `apps/server` without rebuilding dependencies can serve stale adapter output again. Prefer root `pnpm.cmd build` or `pnpm.cmd --filter @mmbt/game-lol-sample build` before `pnpm.cmd --filter @mmbt/server start`.
- There was substantial pre-existing WIP in dashboard, overlay, LoL data pipeline, docs, and assets before this task. I preserved it and only made narrow roster/API verification changes.

## Suggested Next Task

- Decide whether the generated LoL metadata source should be refreshed to reconcile the 172 vs 174 count expectation, then document the required build/start workflow so `apps/server` cannot accidentally run stale adapter `dist` output.
