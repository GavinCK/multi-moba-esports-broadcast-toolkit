# Temporary Archival Handoff

Last updated: **2026-09-04**
Status: **Archived development snapshot; not an MVP or live-event sign-off**

This is the authoritative archival and resume record for the repository. `docs/PROJECT_STATE.md` is the concise planning index; task specs and older handoffs remain supporting history. If any older status statement conflicts with this file, use this file together with the accepted ADRs.

## 1. Git provenance

- Canonical branch: `main`.
- Pre-archive base HEAD: `b9204a316ee95035a82d5cc9a26f8442f982d52b` (`docs: add Fable5-to-Opus4.8 succession handoff; update state to T-003 in flight`).
- Canonical archived HEAD: the `origin/main` commit containing this file. Resolve the immutable SHA with `git rev-parse origin/main`; the coordinating archival report also records it. A commit cannot embed its own SHA.
- Remote: `origin` -> `https://github.com/GavinCK/multi-moba-esports-broadcast-toolkit.git`.
- Remote state observed before archival push: `origin/main` at `1d3bde88fb2ce2198c087c581cc0d469cc737416`, eight commits behind the pre-archive local base. `origin/main` was an ancestor of local HEAD, so no merge or rebase was required.
- Worktree topology observed during preparation:
  - Primary checkout: `D:\GitHub\multi-moba-esports-broadcast-toolkit`, branch `main`.
  - Codex archival checkout: `C:\Users\Gavin\.codex\worktrees\193b\multi-moba-esports-broadcast-toolkit`, detached at the same base because `main` was already checked out in the primary checkout.
- The four T-003 dirty files were byte-identical in both worktrees before consolidation. They were intentionally reviewed and preserved; no unrelated user work was discarded.

## 2. Purpose and architecture

The Multi-MOBA Esports Broadcast Toolkit is a local-first, manual-first control and browser-overlay system for live esports production. The active product mission is a narrowed **LoL-first MVP**, while the underlying multi-MOBA architecture remains intact and non-LoL expansion is frozen until the MVP rehearsal passes.

Architecture boundaries:

- `packages/core-draft`: game-agnostic, serializable manual draft lifecycle, action, timer, undo/redo, skip, reset, and final-lineup logic.
- `packages/core-match`: event, match, team, player, score, sponsor, and presentation contracts/validation.
- `packages/core-production`: production state, Preview/Program, Take/Clear, graphics, and emergency behavior above the game/draft layers.
- `packages/shared-types`: shared API, Socket.IO, health, match, draft, production, adapter, and theme contracts.
- `packages/game-adapters` plus `games/*`: adapter registry and game-specific static/manual data. LoL-specific data stays under `games/lol`.
- `apps/server`: local event-package loading, REST APIs, Socket.IO state sync, local asset serving, append-only JSONL audit logging, health, and crash-recovery snapshots.
- `apps/admin-dashboard`: Admin, Draft Operator, Producer, Caster/read-only, match/presentation, and health views.
- `apps/overlay`: read-only OBS/vMix browser-source routes for Draft, Score Bug, Preview, Program, and Emergency.
- `event-packages/sample-event`: portable JSON setup data and local assets. Runtime logs and snapshots are ignored and are not the database.

Hard boundaries remain: no player-side automation, auto-pick/auto-ban, LCU, runtime Riot/Data Dragon dependency, cloud/database requirement, OBS WebSocket, or vMix API. Overlay routes must remain read-only. ADR-003's shared timer for double-pick turns is correct and must not be changed without new primary evidence.

## 3. Completed implementation

The repository contains and tests the following implementation:

- pnpm/TypeScript monorepo tooling with lint, typecheck, test, and build scripts.
- Shared generic contracts; core match validation; universal draft lifecycle/actions/timer/undo/redo; final-lineup reorder/reset/confirm; core production state; a basic but currently frozen theme engine; and an intentionally skeletal/frozen `core-overlay` package.
- Generic MOBA, LoL, AOV, and HoK static/manual adapters. The server smoke check loaded all four. The LoL adapter exposes 172 local champions and one ruleset.
- A sample local event package with four matches/rulesets, fictional teams/players/sponsor, local fallbacks, and 172 checked-in LoL champion square PNGs.
- Server event-package validation, adapter loading, local asset serving, health endpoints, draft and production REST mutations, structured errors, Socket.IO full-state/update broadcasting and reconnect behavior, and append-only JSONL audit logging.
- T-001 crash recovery: debounced atomic state snapshots, safe stale/corrupt handling, RUNNING-to-PAUSED restore, audit entry, and health flag. Automated tests pass; the user/manual kill-restart rehearsal remains unsigned.
- T-002 No-Ban: BAN-only manual skip through engine, REST, audit, operator confirmation, overlay state, undo/redo, and validation. Automated tests pass; the user/manual UI check remains unsigned.
- Admin Dashboard, Draft Operator, Producer presentation controls, Caster/read-only panel, and System Health view.
- Draft, Score Bug, Preview, Program, and Emergency overlay routes with read-only guardrail tests and debug diagnostics behind `?debug=1`.
- T-003 in-flight overlay redesign preserved in the archive commit: approved lower-third structure, ban/pick states, timer bar, center match block, local-asset fallbacks, and updated component tests. This code is **not visually accepted** yet; see Known issues.

The old `docs/ACCEPTANCE_CRITERIA.md` and `docs/OPERATOR_REHEARSAL_CHECKLIST.md` contain unchecked harness templates. Their unchecked boxes are not a reliable implementation inventory. The narrower six-item MVP checklist and the validation/rehearsal evidence in this handoff are the current status sources.

## 4. Prerequisites and setup

Tested preparation environment:

- Node.js `v24.16.0`; repository requirement is Node `>=20`.
- pnpm `9.15.0`; the root `packageManager` field pins `pnpm@9.15.0`.
- Windows PowerShell was used for the archival verification.

Fresh checkout bootstrap:

```powershell
git clone https://github.com/GavinCK/multi-moba-esports-broadcast-toolkit.git
Set-Location multi-moba-esports-broadcast-toolkit
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm install --frozen-lockfile
pnpm build
pnpm verify
```

Run `pnpm build` before the first `pnpm verify` in a clean checkout. Several workspace packages resolve generated `dist` declarations; the current one-shot `pnpm verify` order starts with typecheck and fails before those declarations exist. Once built, `pnpm verify` passes.

## 5. Local run commands

Run these in separate terminals from the repository root:

```powershell
pnpm --filter @mmbt/server dev
pnpm --filter @mmbt/admin-dashboard dev
pnpm --filter @mmbt/overlay dev
```

Defaults:

- Server/API/Socket.IO: `http://127.0.0.1:3000`
- Admin/Draft/Producer/Caster: `http://127.0.0.1:5173`
- Overlay browser sources: `http://127.0.0.1:5174`
- Default event package: `event-packages/sample-event`

Useful routes:

```text
http://127.0.0.1:5173/admin/system-health
http://127.0.0.1:5173/draft/match_lol-showmatch
http://127.0.0.1:5173/producer/match_lol-showmatch
http://127.0.0.1:5173/caster/match_lol-showmatch
http://127.0.0.1:5174/overlay/draft/match_lol-showmatch
http://127.0.0.1:5174/overlay/scorebug/match_lol-showmatch
http://127.0.0.1:5174/overlay/preview
http://127.0.0.1:5174/overlay/program
http://127.0.0.1:5174/overlay/emergency
```

Use `?debug=1` only for rehearsal/troubleshooting. Standard on-air URLs must not expose debug diagnostics.

Environment variables:

- Server: `HOST`, `PORT`, `MMBT_EVENT_PACKAGE_PATH`.
- Dashboard/overlay Vite proxy target: `MMBT_SERVER_URL`.

Example LAN-reachable development run in PowerShell (replace the IP and verify firewall policy):

```powershell
$env:HOST = '0.0.0.0'
$env:PORT = '3000'
$env:MMBT_EVENT_PACKAGE_PATH = 'event-packages/sample-event'
pnpm --filter @mmbt/server dev
```

Then, in each Vite terminal:

```powershell
$env:MMBT_SERVER_URL = 'http://192.168.0.50:3000'
pnpm --filter @mmbt/admin-dashboard dev -- --host 0.0.0.0
```

```powershell
$env:MMBT_SERVER_URL = 'http://192.168.0.50:3000'
pnpm --filter @mmbt/overlay dev -- --host 0.0.0.0
```

There is no signed-off production hosting/reverse-proxy recipe. Current operational documentation uses the Node server plus Vite development hosts. `pnpm build` produces `dist` output, but the preview/static deployment path and cross-origin/proxy behavior have not passed a live rehearsal; do not assume `vite preview` is show-ready.

## 6. Validation status on 2026-09-04

Commands and outcomes:

- `pnpm install --frozen-lockfile`: passed; 230 packages installed.
- First clean `pnpm verify`: lint passed, then typecheck failed because `@mmbt/shared-types` declarations had not been built for `core-match`.
- `pnpm build`: passed for all 15 runnable workspace projects; admin and overlay Vite bundles built.
- Second `pnpm verify` after the build bootstrap: passed lint, typecheck, **320 tests**, and build.
- Server smoke on default port 3000: not run because another local process already owned the port (`EADDRINUSE`).
- Server smoke on port 3100: passed; `GET /api/health` returned `ok: true`, status `OK`, package `sample-event`, production state `PRE_SHOW`, audit path writable, emergency ready, and all adapters loaded (AOV 20 heroes, Generic 10, HoK 20, LoL 172).
- `git diff --check`: passed before consolidation.
- High-confidence secret-pattern scan across tracked files: no matches. No sensitive filenames or untracked files were found.

Not performed and therefore not claimed:

- Browser screenshot comparison against Figma F1/F2/F3.
- 1920x1080 visual QA, scrollbar/transparency inspection, OBS/vMix browser-source rehearsal, two-device LAN rehearsal, offline rehearsal, full operator-to-producer workflow, or user acceptance.
- T-001 manual crash/kill/restart rehearsal and T-002 manual UI confirmation.

## 7. Known issues and risks

1. **T-003 is code-complete only at the automated-test level.** It is not approved for air until a human compares live 1920x1080 states with the locked Figma frames and runs the full draft/OBS rehearsal.
2. **Review the preserved T-003 design mismatches before visual sign-off.** The locked spec requires `{matchLabel} · GAME {gameNumber}` and `◀ 1ST PICK` / `1ST PICK ▶`; the preserved implementation renders `/` and `←` / `→`. The spec also says each side's left-to-right slots follow `playerDisplayOrderBySide`, with TOP flanking the center, while the current CSS reverses the red pick zone and the sample LoL player arrays are TOP-to-SUPPORT on both sides. Resolve against the approved Figma artifact rather than improvising.
3. **Overlay asset routing needs rehearsal/fix.** `apps/admin-dashboard/vite.config.ts` proxies `/assets` to the server, but `apps/overlay/vite.config.ts` currently does not. The overlay references `/assets/...`; on the overlay Vite host those requests may 404 and fall back. Confirm and add the correct dev/production asset route or reverse proxy before relying on local logos/champion art.
4. **Fresh-checkout verification ordering is fragile.** `pnpm verify` fails before a first build because cross-package declaration output is absent. Use `pnpm build` first or fix the workspace TypeScript/build orchestration in a scoped tooling task.
5. **T-004 is not implemented.** The sample event has 172 champion square PNGs but zero champion splashes and zero role-icon files. The overlay therefore operates on fallbacks for those classes. T-004 must remain a pre-event/manual downloader; runtime must stay offline.
6. **LAN/deployment is unproven.** Vite and server defaults bind to loopback. Firewall, host binding, Socket.IO proxying, asset routes, browser refresh/reconnect, and WAN-disconnected operation still need rehearsal.
7. **No browser E2E or visual-regression suite exists.** The passing overlay tests render React markup and validate state/guardrails, but they do not prove pixel geometry or browser image loading.
8. **Snapshot and audit files are operational state.** `event-packages/*/runtime/`, build output, dependencies, Vite caches, and production JSONL logs are intentionally not committed. Before an event, decide whether to archive or clear old logs/snapshots; do not reuse stale state accidentally.
9. **The theme engine and non-LoL expansion are frozen, not deleted.** Program/Preview/Emergency/Score Bug/Caster and multi-game adapters exist from v0.1 work, but the LoL-first MVP queue takes precedence until rehearsal sign-off.
10. **Git write safety:** ADR-006 documents an earlier AI-mounted-worktree index corruption. The archival task explicitly authorized Git writes, which were performed with scoped staging, index/status checks, no reset, and no force-push. Resume with the same caution.

## 8. Dependencies and external services

Required at development/build time:

- Node.js, pnpm, the packages pinned in `pnpm-lock.yaml`, a modern browser, and local filesystem access.
- Git/GitHub only for source synchronization; the live runtime does not need GitHub.

Live runtime dependencies:

- A trusted local LAN, the local Node server, dashboard/overlay browser apps, the chosen local event package, and local browser sources. OBS or vMix may consume the overlay URLs, but there is no OBS/vMix API integration.
- No database, cloud sync, login provider, Riot API, LCU, or internet connection is required or allowed as a show-time dependency.

Pre-event/manual external references:

- Existing LoL metadata/icon preparation scripts may contact Riot Data Dragon before an event. T-004 is planned to add champion splash and CommunityDragon position-icon preparation. Review licensing and resulting asset size before committing downloaded binaries.
- Approved design source: Figma file `BanPick-UI`, key `7mlbl2myYHrTrHj7c4HYhJ`, page `02_Design`, node `41:2`. `docs/design/LOL_DRAFT_OVERLAY_APPROVED_DESIGN_SPEC.md` is the locked textual implementation source.

No credentials are stored in the repository, and no secrets are required for the local sample workflow.

## 9. Unfinished work, in order

1. Perform a focused T-003 review against the approved design, including the exact issues in section 7. Make only spec-backed corrections.
2. Run 1920x1080 browser screenshot QA for ban, pick/hover, skipped ban, shared double-pick timer, missing assets, and confirmed lineup. Then run OBS/vMix transparency/no-scrollbar QA and record human approval in `docs/tasks/T-003-overlay-visual-implementation.md`.
3. Implement T-004 exactly as scoped in `docs/tasks/T-004-pre-event-asset-prep-script.md`; run it on an internet-connected user machine; inspect licensing, totals, failures, and repository size before deciding whether to commit binaries.
4. Run T-001 kill/restart and T-002 No-Ban manual checks.
5. Run the full operator -> producer -> overlay -> OBS/vMix rehearsal, including reconnect, emergency, Take/Clear, audit log, two-device LAN, and WAN-disconnected operation.
6. Only after all six LoL-first MVP acceptance items pass, update `docs/PROJECT_STATE.md` to sign off the MVP and discuss post-MVP Fearless Draft, red-first rulesets, hotkeys, theme-engine wiring/deletion, or renewed multi-MOBA expansion.

## 10. Next-event checklist

Before event data preparation:

- Confirm the exact Git SHA, clean status, Node/pnpm versions, and successful build-first `pnpm verify`.
- Duplicate `event-packages/sample-event` to a clearly named event package; replace fictional event/match/team/player/sponsor data without changing schemas casually.
- Validate team IDs, player IDs/roles/order, BO format, game number, patch label, score, first-pick side, ruleset, theme, and local-only asset paths.
- Prepare approved local champion squares/splashes, role icons, team logos, sponsor art, and fallbacks. Test with assets present and deliberately missing.

Technical rehearsal:

- Record the control-machine IP; bind the server and Vite hosts intentionally; configure firewall ports; verify dashboard, `/api/health`, Socket.IO, `/assets`, and every overlay route from the graphics machine.
- Run a complete LoL draft including No-Ban, hover, locks, shared double-pick timer, pause/resume, undo/redo, final-lineup reorder/reset/confirm, and draft completion.
- Verify Producer presentation changes, Preview, deliberate Take, Program, Clear, emergency trigger/clear, and read-only Caster/overlay behavior.
- Restart the server mid-draft and confirm snapshot restore is PAUSED with correct state and audit evidence.
- Refresh/reconnect all clients and confirm they receive the latest full state.
- Inspect the JSONL audit log for parseability, chronology, and important actions; confirm health reports it writable.
- In OBS/vMix at 1920x1080, confirm transparent background, no scrollbars/debug text/broken images, correct role/order geometry, and readable fallbacks.
- Disconnect WAN while keeping the LAN active and repeat the required workflow.

Show-day preflight:

- Archive or intentionally clear old runtime snapshots/logs; never delete them casually while their recovery value is unknown.
- Re-run build-first `pnpm verify`; start services; check health/adapters/assets/audit/emergency; open all standard non-debug browser sources.
- Keep manual fallback procedures and the emergency overlay ready. Never enable player-side automation or make internet/game-client integration required.

## 11. Exact resume steps

```powershell
Set-Location D:\GitHub\multi-moba-esports-broadcast-toolkit
git fetch --prune origin
git switch main
git pull --ff-only origin main
git status --short --branch
git log --oneline --decorate -10
pnpm install --frozen-lockfile
pnpm build
pnpm verify
```

The status should be clean before starting a new task. Then read, in order:

1. `AGENTS.md`
2. `CLAUDE.md`
3. this `HANDOFF.md`
4. `docs/PROJECT_STATE.md`
5. `docs/decisions/ADR-001` through `ADR-006`
6. `docs/tasks/T-003-overlay-visual-implementation.md`
7. `docs/design/LOL_DRAFT_OVERLAY_APPROVED_DESIGN_SPEC.md`
8. `docs/tasks/T-004-pre-event-asset-prep-script.md` only after T-003 is accepted

Do one queued task at a time, preserve the game-agnostic/manual-first/local-first boundaries, and stop for human visual/workflow approval before declaring the MVP ready.
