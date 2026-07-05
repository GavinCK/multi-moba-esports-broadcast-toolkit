# T-004: Pre-event asset prep script (champion splashes + official role icons)

Status: SPEC READY — run AFTER T-003 (overlay works on fallbacks without it) · Owner: Codex · Reviewer: planner + user

## Why

The approved design uses champion splash art in picked slots and official Riot position icons (org is Riot-licensed — see PROJECT_STATE "Licensing"). These are PRE-EVENT static assets (allowed per reference-driven policy); runtime stays offline. The repo already has this pattern: `games/lol/scripts/import-data-dragon-champions.mjs` and `prepare-data-dragon-icons.mjs`. This task adds the missing asset classes. The script runs on the USER'S machine (AI sessions have no network).

## Design decisions (locked)

- New script: `games/lol/scripts/prepare-lol-broadcast-assets.mjs`, same style/conventions as the two existing scripts.
- Downloads (pre-event, one-off):
  1. Champion centered splashes → `event-packages/sample-event/assets/hero-splashes/lol/{ChampionId}.jpg` (Data Dragon/CDragon centered splash endpoints, keyed by the 172 roster champion IDs from `games/lol/src/generated-champions.ts`).
  2. Official position SVGs → `event-packages/sample-event/assets/role-icons/lol/position-{top,jungle,middle,bottom,utility}.svg` (CommunityDragon `rcp-fe-lol-static-assets/global/default/svg/`).
- Idempotent: skips files that already exist; `--force` re-downloads; prints a summary table (downloaded/skipped/failed) and exits non-zero only on total failure.
- Adapter: extend `getAssetUrl("HERO_SPLASH", id)` to resolve the local splash path with existing fallback semantics (fallback icon path when file class missing) — additive, mirroring how HERO_ICON already works.
- Git: splash/icon binaries follow the existing hero-icons precedent (committed local assets). If total size is a concern, user decides at review time; script must print total size.

## Codex prompt (copy verbatim)

```text
TASK: T-004 — Pre-event broadcast asset prep script (splashes + role icons)

READ FIRST
- AGENTS.md; CLAUDE.md
- docs/tasks/T-004-pre-event-asset-prep-script.md ("Design decisions (locked)" is binding)
- games/lol/scripts/import-data-dragon-champions.mjs and prepare-data-dragon-icons.mjs (follow their conventions)
- games/lol/src/adapter.ts (HERO_ICON asset resolution pattern)

GOAL
A user-run, idempotent Node script downloads champion centered splashes and the five official position SVGs into the sample event package, and the LoL adapter resolves HERO_SPLASH locally — so the overlay (T-003) automatically upgrades from fallbacks to full art.

SCOPE — IN
1. games/lol/scripts/prepare-lol-broadcast-assets.mjs per locked decisions (both asset classes, skip-existing, --force, summary output incl. total size).
2. Additive HERO_SPLASH local resolution in the LoL adapter with graceful fallback when files are absent (+ tests).
3. Short usage section appended to games/lol/README.md.

SCOPE — OUT (do not do any of these)
- No runtime downloading: the server/overlay never fetch; only this manually-run script touches the network.
- No changes to overlay/server/core beyond the adapter's additive asset resolution.
- No new dependencies; use Node built-ins (https/fs) like the existing scripts.
- Do not commit downloaded binaries yourself; do not run git add/commit/push.

FILES EXPECTED TO CHANGE
- games/lol/scripts/prepare-lol-broadcast-assets.mjs (new)
- games/lol/src/adapter.ts (+ test file)
- games/lol/README.md

ACCEPTANCE CRITERIA
1. Running the script on a machine with network fills both asset directories for all 172 champions + 5 icons; second run skips everything; --force re-downloads.
2. With assets present, getAssetUrl("HERO_SPLASH", id) returns the local path; with assets absent, existing fallback semantics hold and nothing crashes.
3. pnpm lint, pnpm typecheck, pnpm test pass without network access (script is not executed by tests).

REPORT FORMAT (produce this at the end, then STOP)
1. Summary. 2. File-by-file change list with line counts. 3. Test output summary. 4. Deviations flagged. 5. Open questions.
Do not start follow-up work after the report.
```

## Review checklist (planner fills after Codex run)

- ☐ Script matches existing conventions · ☐ no runtime network paths introduced · ☐ adapter change additive with tests · ☐ user ran script successfully, summary pasted · ☐ verify passes
