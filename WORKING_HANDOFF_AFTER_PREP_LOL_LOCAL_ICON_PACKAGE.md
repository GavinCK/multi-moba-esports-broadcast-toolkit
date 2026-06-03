# Working Handoff After Prep LoL Local Icon Package

## Summary

- Prepared the sample-event local League of Legends champion icon package from Riot Data Dragon static champion square images.
- Added a pre-event-only icon preparation script under `games/lol/scripts`.
- Added a `champions:icons` package script and documented the workflow in `games/lol/README.md`.
- Added a narrow server `/assets/*` route that serves files only from the loaded event package `assets` folder and rejects unsafe path segments.
- Added focused tests for LoL difficult champion icon paths and server asset serving.
- Confirmed the Draft Operator already renders a local image when present, keeps zh-TW primary names and English secondary names visible, and hides failed image loads without showing a browser broken-image icon.

## Files Changed

- `apps/admin-dashboard/vite.config.ts`
  - Proxies `/assets` to the local server during dashboard dev, so `/assets/hero-icons/lol/*.png` resolves when using `http://127.0.0.1:5173`.
- `apps/server/src/api.ts`
  - Added local event-package asset serving for `GET /assets/*`.
  - Serves only inside `<event-package-root>/assets`.
  - Rejects unsafe decoded path parts before resolving the filesystem path.
- `apps/server/src/index.test.ts`
  - Added server tests for serving an existing local asset, safe 404 for missing assets, and unsafe path rejection.
- `games/lol/package.json`
  - Added `champions:icons`.
- `games/lol/README.md`
  - Documented the pre-event local icon package workflow.
- `games/lol/scripts/prepare-data-dragon-icons.mjs`
  - Added Data Dragon static icon preparation script.
- `games/lol/src/index.test.ts`
  - Added difficult champion local icon path regression coverage.
- `event-packages/sample-event/assets/hero-icons/lol/*.png`
  - Added 172 local champion square PNGs.
- `WORKING_HANDOFF_AFTER_PREP_LOL_LOCAL_ICON_PACKAGE.md`
  - Added this handoff.

Pre-existing unrelated WIP remained untouched, including overlay files, `docs/API_SOCKET_CONTRACT.md`, `event-packages/sample-event/README.md`, ZIP folders, and `event-packages/sample-event/logs/production-log.jsonl`.

## Icon Source / Version Used

- Source: Riot Data Dragon static champion square image paths.
- Version: `16.11.1`, read from the current generated LoL champion metadata.
- URL shape used by the pre-event script: `https://ddragon.leagueoflegends.com/cdn/16.11.1/img/champion/<ChampionDataId>.png`.
- Runtime does not fetch Data Dragon, Riot API, LCU, or remote CDN URLs.
- No third-party source code, branding, screenshots, layouts, or trade dress were copied.

## Icon Folder Path

```text
event-packages/sample-event/assets/hero-icons/lol/
```

Runtime icon URL convention remains:

```text
assets/hero-icons/lol/<ChampionDataId>.png
```

## Expected / Actual Icon Counts

- Expected icon count from `games/lol/src/generated-champions.ts`: `172`.
- Actual PNG count in `event-packages/sample-event/assets/hero-icons/lol`: `172`.
- Missing icons: none.
- Extra icons: none.

Representative generated path checks:

```text
Kai'Sa -> assets/hero-icons/lol/Kaisa.png
Kha'Zix -> assets/hero-icons/lol/Khazix.png
Cho'Gath -> assets/hero-icons/lol/Chogath.png
Dr. Mundo -> assets/hero-icons/lol/DrMundo.png
Nunu & Willump -> assets/hero-icons/lol/Nunu.png
Jarvan IV -> assets/hero-icons/lol/JarvanIV.png
Aurelion Sol -> assets/hero-icons/lol/AurelionSol.png
Wukong -> assets/hero-icons/lol/MonkeyKing.png
Renata Glasc -> assets/hero-icons/lol/Renata.png
K'Sante -> assets/hero-icons/lol/KSante.png
```

## Server Asset Serving

- Changed: yes.
- Route: `GET /assets/*`.
- Scope: only files under the loaded event package `assets` directory.
- Missing asset behavior: safe JSON `404` with `ASSET_NOT_FOUND`.
- Unsafe path behavior: JSON `400` with `ASSET_PATH_UNSAFE`.
- Static serving does not expose arbitrary filesystem paths.

Built-server smoke check:

```text
/api/adapters/lol heroCount: 172
/api/adapters/lol displayName: LoL Local Static Roster
/assets/hero-icons/lol/Kaisa.png: 200 image/png
```

## Draft Operator Rendering Behavior

- Uses local `hero.squareUrl ?? hero.iconUrl` values such as `/assets/hero-icons/lol/Kaisa.png`.
- Renders an `<img>` for heroes with local icon paths.
- Uses zh-TW as primary champion name when available.
- Keeps English display name as secondary text.
- Keeps full champion names visible even if image loading fails.
- `SafeLocalImage` removes failed images, preventing browser broken-image icons.

Automated dashboard coverage confirms Kaisa renders an image candidate with `/assets/hero-icons/lol/Kaisa.png`, then still keeps `Kai'Sa` visible after an image error.

## Commands Run

- `git status --short`: succeeded before editing; pre-existing WIP included overlay files, docs, logs, ZIP folders, and the empty/untracked LoL icon folder.
- `git diff --stat`: succeeded before editing.
- `git log --oneline -5`: succeeded before editing; latest commit was `8ec5bce feat(lol): add generated roster and zh-TW metadata`.
- `pnpm.cmd --filter @mmbt/game-lol-sample champions:icons`: first sandbox run failed with Corepack `EPERM`; approved rerun passed.
- `pnpm.cmd --filter @mmbt/game-lol-sample test`: first sandbox run failed with Corepack `EPERM`; approved rerun passed, 1 file / 18 tests.
- `pnpm.cmd --filter @mmbt/game-lol-sample typecheck`: approved run passed.
- `pnpm.cmd --filter @mmbt/server test`: approved run passed, 1 file / 27 tests.
- `pnpm.cmd --filter @mmbt/server typecheck`: approved run passed.
- `pnpm.cmd --filter @mmbt/admin-dashboard test`: approved run passed, 6 files / 44 tests.
- `pnpm.cmd --filter @mmbt/admin-dashboard typecheck`: approved run passed.
- `pnpm.cmd test`: approved run passed.
- `pnpm.cmd typecheck`: approved run passed.
- `pnpm.cmd build`: approved run passed.
- Built-server smoke check with Node/fetch: passed; LoL API returned 172 heroes and Kaisa asset served as `image/png`.
- Generated-roster vs PNG-folder comparison: passed; `172` expected, `172` actual, no missing or extra PNGs.

## Verification

Passed:

- LoL icon preparation script.
- LoL adapter tests.
- LoL adapter typecheck.
- Server tests.
- Server typecheck.
- Admin dashboard tests.
- Admin dashboard typecheck.
- Root workspace tests.
- Root workspace typecheck.
- Root workspace build.
- Built-server API and asset smoke check.
- Generated metadata to icon-folder completeness check.

Failed then resolved:

- Initial sandbox pnpm runs failed with Windows/Corepack `EPERM` against `C:\Users\Gavin\AppData\Local\node\corepack\v1\pnpm`; approved reruns passed.

Not run:

- `pnpm.cmd lint`, because this task requested test/typecheck/build verification only.
- Browser manual rehearsal, because the user-side expected manual check requires restarting server/admin dashboard. Automated dashboard tests and the built-server smoke check covered the requested path and rendering behavior.

## Scope Guardrails Checked

- Did not modify `packages/core-draft`.
- Did not change timer behavior.
- Did not change ban/pick slot labels.
- Did not redesign overlays.
- Did not add Riot API runtime calls.
- Did not add LCU.
- Did not add runtime Data Dragon sync.
- Did not add player-side automation.
- Did not add auto-pick or auto-ban.
- Did not modify ZIP folders.
- Did not modify runtime logs.
- Did not use `git add .`.
- Did not commit.

## Final Git Status

Captured after implementation, verification, and this handoff file:

```text
 M apps/admin-dashboard/vite.config.ts
 M apps/overlay/src/guardrails.test.ts
 M apps/overlay/src/overlays/DraftOverlay.test.tsx
 M apps/overlay/src/overlays/DraftOverlay.tsx
 M apps/overlay/src/overlays/ScoreBugOverlay.test.tsx
 M apps/overlay/src/overlays/ScoreBugOverlay.tsx
 M apps/server/src/api.ts
 M apps/server/src/index.test.ts
 M docs/API_SOCKET_CONTRACT.md
 M event-packages/sample-event/README.md
 M games/lol/README.md
 M games/lol/package.json
 M games/lol/src/index.test.ts
?? WIP_BEFORE_FIX_LOL_API_ROSTER.patch
?? WORKING_HANDOFF_AFTER_LOL_CHAMPION_DATA_IMAGE_PIPELINE.md
?? WORKING_HANDOFF_AFTER_PREP_LOL_LOCAL_ICON_PACKAGE.md
?? ZIP/
?? apps/admin-dashboard/src/components/
?? apps/overlay/src/components/SafeLocalImage.tsx
?? docs/ZIP.zip
?? docs/ZIP/
?? event-packages/sample-event/assets/hero-icons/lol/
?? event-packages/sample-event/logs/production-log.jsonl
?? games/lol/scripts/prepare-data-dragon-icons.mjs
```

## Notes / Risks

- The local icon package contains Riot Data Dragon-derived champion square images. The workflow treats them as approved pre-event/static event-package assets and keeps show runtime local-first.
- Existing generated metadata still reports `approvedArtworkIncluded: false` because the generated TypeScript metadata file itself does not embed artwork. The actual approved event-package icons now exist separately under `event-packages/sample-event/assets/hero-icons/lol/`.
- For dashboard development on port `5173`, `/assets` is now proxied to the server. In other deployment shapes, the dashboard should be served with access to the same local server asset route or equivalent local asset hosting.

## Suggested Next Task

- Restart the server and admin dashboard, open `http://127.0.0.1:5173/draft/match_lol-showmatch`, and manually confirm champion cards show local icons, zh-TW primary names, English secondary names, and no broken-image icons while searching both Chinese and English names.
