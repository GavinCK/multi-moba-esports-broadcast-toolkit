# Acceptance Criteria — Multi-MOBA Esports Broadcast Toolkit v0.1

## Document Purpose

This document defines the acceptance criteria for **Multi-MOBA Esports Broadcast Toolkit v0.1**.

It is a harness document for AI coding agents, human developers, TDs, producers, and live-production operators. It explains how to prove that the v0.1 implementation is correct, production-safe, and still inside scope.

This file must be read together with:

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
```

## Non-Negotiable Product Principles

The following principles are release blockers. If any one of them is violated, v0.1 must not be accepted.

- [ ] Universal Ban/Pick is game-agnostic.
- [ ] LoL In-game HUD remains a future plugin and is not part of v0.1 universal core.
- [ ] Production Control sits above Universal Draft and game-specific adapters/plugins.
- [ ] v0.1 is local-first, manual-first, and production-safe.
- [ ] No player-side automation exists.
- [ ] No auto-pick or auto-ban exists.
- [ ] No hidden competitive information is exposed.
- [ ] Manual operation works without game APIs, internet access, OBS WebSocket, vMix API, or player-PC software.

## Reference-Driven Implementation Acceptance

Reference-driven implementation is part of v0.1 quality control.

- [ ] `docs/REFERENCE_DRIVEN_IMPLEMENTATION_POLICY.md` exists and is treated as the central policy for reference-driven work.
- [ ] Public tools and official docs may be used for feature completeness, operator UX, asset pipeline shape, broadcast overlay hierarchy, and manual QA expectations.
- [ ] Reference usage is summarized in the handoff when used.
- [ ] No third-party source code, assets, exact proprietary layouts, branding, sponsor treatments, or trade dress are copied into this repo without explicit approval.
- [ ] Data Dragon policy distinguishes allowed pre-event/static metadata or approved local icon preparation from forbidden show-time runtime dependency.
- [ ] Fallback rendering is treated as a safety net, not the primary production UX.
- [ ] Universal draft core remains game-agnostic even when LoL adapter data becomes richer.

## Verification Type Definitions

Use these labels throughout this document.

### Automated Check

An automated check is verified by repeatable commands, tests, static inspection, or scripted checks.

Examples:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm verify
```

Automated checks may also include source searches such as checking that LoL-specific APIs do not appear inside universal core packages.

### Manual Rehearsal Check

A manual rehearsal check is verified by operating the system like a real live show.

Examples:

```text
Open admin dashboard.
Open draft operator panel.
Open OBS/vMix browser-source overlay route.
Run a full manual draft.
Trigger emergency mode.
Reload overlay browser source.
Confirm state recovery.
```

### Documentation Review Check

A documentation review check is verified by reading README, operator guide, deployment guide, game adapter guide, or this acceptance file.

### Release Rule

A section may be marked complete only when:

- [ ] All relevant automated checks pass or are explicitly marked unavailable with a reason.
- [ ] All required manual rehearsal checks pass.
- [ ] No failure condition is present.
- [ ] Any known limitation is documented and does not break v0.1 scope.

---

# 1. General v0.1 Definition of Complete

## Purpose

Define the minimum bar for calling the project v0.1 complete.

## Acceptance Criteria

- [ ] `pnpm install` succeeds from a clean checkout.
- [ ] `pnpm lint` succeeds where lint scripts exist.
- [ ] `pnpm typecheck` succeeds.
- [ ] `pnpm test` succeeds.
- [ ] `pnpm build` succeeds.
- [ ] `pnpm dev` starts the server, admin dashboard, and overlay apps.
- [ ] Server runs locally without external cloud services.
- [ ] Admin dashboard runs locally.
- [ ] Overlay app runs locally.
- [ ] Sample event package loads successfully.
- [ ] User can select or view a sample match.
- [ ] User can configure or confirm teams, match, game, and ruleset.
- [ ] Draft Operator can run a full manual draft.
- [ ] Draft overlay updates in real time.
- [ ] Score bug overlay displays basic team and score information.
- [ ] Emergency overlay can be triggered.
- [ ] Health dashboard shows connected clients and current state.
- [ ] Important actions are written to append-only JSONL audit log.
- [ ] Generic MOBA, LoL sample, AOV sample, and HoK sample adapters exist.
- [ ] LoL-specific logic is not hardcoded into universal draft core.
- [ ] Documentation explains how to operate the system locally.
- [ ] The system can run on a private production LAN without internet.
- [ ] No player-side automation is implemented.

## Verification Method

### Automated Check

- [ ] Run `pnpm install`.
- [ ] Run `pnpm lint` if available.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.
- [ ] Run `pnpm dev` or documented equivalent.
- [ ] Confirm server exposes `/api/health`.
- [ ] Confirm test coverage includes core draft, game adapters, production state, Socket.IO sync, and audit log entries.

### Manual Rehearsal Check

- [ ] Start the server on the control machine.
- [ ] Open admin dashboard.
- [ ] Open draft operator panel.
- [ ] Open overlay draft route in a browser-source-style window.
- [ ] Load sample event and sample match.
- [ ] Run one full draft from start to completion.
- [ ] Confirm overlay updates with every hover/lock/timer state change.
- [ ] Trigger emergency mode.
- [ ] Reload overlay browser route and confirm state recovery.
- [ ] Disconnect internet and confirm the local workflow still works.

## Failure Conditions

- Any required root command fails without a documented, accepted reason.
- Universal draft core contains LoL-only assumptions.
- System requires cloud, internet, game client reader, OBS WebSocket, or vMix API to run.
- Draft cannot be completed manually.
- Important live actions are not logged.
- Emergency overlay cannot be displayed.

---

# 2. Repository / Monorepo Setup

## Purpose

Verify that the repository is structured as a maintainable pnpm TypeScript monorepo.

## Acceptance Criteria

- [ ] Root `package.json` exists.
- [ ] `pnpm-workspace.yaml` exists.
- [ ] `tsconfig.base.json` exists.
- [ ] Root scripts exist for `dev`, `build`, `test`, `lint`, `typecheck`, and preferably `verify`.
- [ ] `apps/server` exists.
- [ ] `apps/admin-dashboard` exists.
- [ ] `apps/overlay` exists.
- [ ] `packages/shared-types` exists.
- [ ] `packages/core-match` exists.
- [ ] `packages/core-draft` exists.
- [ ] `packages/core-production` exists.
- [ ] `packages/core-overlay` exists or is intentionally deferred with a documented reason.
- [ ] `packages/theme-engine` exists.
- [ ] `games/generic-moba` exists.
- [ ] `games/lol` exists.
- [ ] `games/aov` exists.
- [ ] `games/hok` exists.
- [ ] `event-packages/sample-event` exists.
- [ ] `docs` exists.
- [ ] Apps and packages build through workspace references or documented package exports.
- [ ] Shared packages are imported rather than copy-pasted into apps.

## Verification Method

### Automated Check

- [ ] Run `pnpm install`.
- [ ] Run `pnpm -r build`.
- [ ] Run `pnpm -r typecheck`.
- [ ] Confirm workspace package discovery with `pnpm -r list` or equivalent.
- [ ] Confirm no package has unresolved local imports.

### Manual Rehearsal Check

- [ ] Open repository tree and confirm the expected directories exist.
- [ ] Open root README and confirm local setup instructions match actual scripts.
- [ ] Confirm a developer can identify where server, dashboard, overlay, shared types, draft core, production core, theme engine, and game adapters live.

## Failure Conditions

- Apps or packages are not part of the pnpm workspace.
- Shared code is duplicated across apps instead of imported.
- Repository shape suggests a LoL-only tool rather than a multi-MOBA broadcast toolkit.
- Root scripts are missing or misleading.

---

# 3. Shared Types

## Purpose

Verify that all core data contracts are centralized and reused across server, dashboard, overlay, and game adapters.

## Acceptance Criteria

- [ ] `packages/shared-types` exports all required types from a single public index.
- [ ] Required core types exist:
  - [ ] `GameCode`
  - [ ] `MatchFormat`
  - [ ] `TeamSide`
  - [ ] `EventInfo`
  - [ ] `Team`
  - [ ] `Player`
  - [ ] `Sponsor`
  - [ ] `SponsorSlot`
  - [ ] `Match`
  - [ ] `MatchStatus`
  - [ ] `GameInstance`
  - [ ] `GameStatus`
  - [ ] `Hero`
  - [ ] `DraftRuleset`
  - [ ] `DraftPhaseDefinition`
  - [ ] `DraftState`
  - [ ] `DraftStatus`
  - [ ] `DraftAction`
  - [ ] `DraftActionType`
  - [ ] `DraftActionStatus`
  - [ ] `DraftTimerState`
  - [ ] `DraftHistoryEntry`
  - [ ] `ProductionState`
  - [ ] `GraphicType`
  - [ ] `GraphicTakeState`
  - [ ] `ThemeConfig`
  - [ ] `SystemHealth`
  - [ ] `SocketEnvelope`
  - [ ] `ApiResponse`
  - [ ] `GameAdapter`
  - [ ] `GameAdapterCapabilities`
  - [ ] `DraftValidationResult`
- [ ] Server imports shared types from `packages/shared-types`.
- [ ] Admin dashboard imports shared types from `packages/shared-types`.
- [ ] Overlay imports shared types from `packages/shared-types`.
- [ ] Game adapters import shared generic types instead of redefining them.
- [ ] No LoL-only type is placed in shared core unless it is genuinely generic.
- [ ] Runtime state types are serializable as JSON.

## Verification Method

### Automated Check

- [ ] Run `pnpm typecheck`.
- [ ] Run unit tests for draft ruleset parsing and type-compatible sample payloads.
- [ ] Search for duplicated interface names across apps.
- [ ] Search shared-types for forbidden LoL-specific concepts such as `Riot`, `LCU`, `DataDragon`, `SummonerSpell`, or LoL-only champion-select assumptions.

### Manual Rehearsal Check

- [ ] Review shared type exports.
- [ ] Confirm sample event JSON aligns with shared type expectations.
- [ ] Confirm API response and Socket.IO envelope use shared contracts.

## Failure Conditions

- Server and frontend define separate incompatible versions of the same model.
- Shared types hardcode LoL-only concepts into universal models.
- Core state includes functions, classes, non-serializable references, or hidden runtime-only values.

---

# 4. Core Match System

## Purpose

Verify that event, match, game, team, player, sponsor, score, and scene-related data are represented consistently.

## Acceptance Criteria

- [ ] Core match models represent `Event -> Match -> Game`.
- [ ] Match supports format such as BO1, BO3, BO5, or BO7.
- [ ] Match stores blue/red teams and current score.
- [ ] Game instance stores game number, game code, teams, draft ID, winner, and status.
- [ ] Team model supports name, short name, logo, and optional colors.
- [ ] Player model supports team ID, display name, role, and optional metadata.
- [ ] Sponsor model supports sponsor slots.
- [ ] Match and game status values are explicit.
- [ ] Core match package contains no UI-only logic.
- [ ] Core match package contains no LoL-only logic.
- [ ] Match state can be loaded from sample event package.
- [ ] Match state can be shown in admin, caster, score bug, and draft panel.

## Verification Method

### Automated Check

- [ ] Run unit tests for loading and validating sample match data.
- [ ] Run typecheck for server/dashboard/overlay imports of match models.
- [ ] Run integration test that server loads event package and exposes match state.

### Manual Rehearsal Check

- [ ] Open admin dashboard and view sample event.
- [ ] Select sample match.
- [ ] Confirm blue/red teams display correctly.
- [ ] Confirm current game number and score display correctly.
- [ ] Open score bug overlay and confirm team/score information displays.

## Failure Conditions

- Match data is duplicated inconsistently between server and client.
- Core match state assumes League of Legends only.
- Score bug cannot read match state.
- Sample event cannot produce a valid match.

---

# 5. Universal Draft Engine

## Purpose

Verify that the draft engine controls game-agnostic manual Ban/Pick logic.

## Acceptance Criteria

- [ ] Draft engine lives in `packages/core-draft`.
- [ ] Draft engine accepts generic `DraftRuleset`, `Hero`, and `DraftState`.
- [ ] Draft engine does not know specific hero/champion names.
- [ ] Draft engine does not import from `/games/lol`.
- [ ] Draft engine does not reference Riot, LCU, Data Dragon, or LoL client behavior.
- [ ] Draft can be created from a valid ruleset.
- [ ] Draft can start.
- [ ] Draft can pause and resume.
- [ ] Draft supports hover state.
- [ ] Draft supports lock state.
- [ ] Draft supports ban and pick actions.
- [ ] Draft supports phases with `count > 1`.
- [ ] Draft advances phase correctly.
- [ ] Draft supports timer state.
- [ ] Draft supports undo of locked actions.
- [ ] Draft supports reset.
- [ ] Draft supports complete.
- [ ] Draft blocks duplicate hero selection when `allowDuplicateHeroes` is `false`.
- [ ] Draft supports manual override without corrupting state.
- [ ] Invalid actions return explicit errors and do not mutate state.
- [ ] Draft history records meaningful changes.
- [ ] Draft result can be exported or serialized as JSON.

## Verification Method

### Automated Check

- [ ] Run unit tests for draft creation.
- [ ] Run unit tests for draft start.
- [ ] Run unit tests for phase advancement.
- [ ] Run unit tests for hover.
- [ ] Run unit tests for pick/ban lock.
- [ ] Run unit tests for duplicate hero blocking.
- [ ] Run unit tests for timer pause/resume.
- [ ] Run unit tests for undo.
- [ ] Run unit tests for reset.
- [ ] Run unit tests for complete.
- [ ] Run unit tests proving invalid actions do not mutate previous state.
- [ ] Search `packages/core-draft` for forbidden LoL terms:
  - [ ] `Riot`
  - [ ] `LCU`
  - [ ] `DataDragon`
  - [ ] `champion-select`
  - [ ] hardcoded champion names
  - [ ] `/games/lol`

### Manual Rehearsal Check

- [ ] Use draft operator panel to start a draft.
- [ ] Hover at least one hero.
- [ ] Lock at least one ban and one pick.
- [ ] Complete all phases of a sample draft.
- [ ] Try selecting a duplicate hero when duplicates are disabled and confirm it is blocked.
- [ ] Pause and resume timer.
- [ ] Undo a locked action and confirm state, overlay, and log update correctly.
- [ ] Reset draft with confirmation.
- [ ] Complete draft with confirmation.

## Failure Conditions

- Any LoL-specific champion, Riot API, LCU assumption, or Data Dragon assumption appears inside universal draft core.
- Invalid draft action mutates state.
- Full manual draft cannot be completed.
- Duplicate hero blocking fails when required.
- Undo corrupts phase order or locked hero lists.
- Timer cannot be paused or resumed manually.

---

# 6. Game Adapter Layer

## Purpose

Verify that game-specific data and rules live in adapters while universal core remains generic.

## Acceptance Criteria

- [ ] `GameAdapter` interface is implemented consistently.
- [ ] Generic MOBA adapter exists.
- [ ] LoL sample adapter exists.
- [ ] AOV sample adapter exists.
- [ ] HoK sample adapter exists.
- [ ] Each adapter exposes game metadata.
- [ ] Each adapter loads a hero/champion list.
- [ ] Each adapter loads at least one draft ruleset.
- [ ] Each adapter provides asset URL lookup or safe fallback.
- [ ] Each adapter declares capabilities.
- [ ] Generic adapter has no API dependency.
- [ ] LoL adapter exposes a full practical local LoL champion roster, not a 20-entry sample.
- [ ] LoL adapter does not show Generic MOBA placeholder names in the LoL selector.
- [ ] LoL adapter may use pre-event/static Data Dragon import tooling for generated local metadata and approved local icon preparation.
- [ ] LoL adapter stores local icon path conventions, including `assets/hero-icons/lol/<ChampionDataId>.png`.
- [ ] LoL adapter does not implement LCU reader in v0.1.
- [ ] LoL adapter does not implement active runtime Data Dragon sync in v0.1 show operation.
- [ ] LoL adapter does not implement in-game HUD in v0.1.
- [ ] AOV adapter has manually maintained sample hero data.
- [ ] HoK adapter has manually maintained sample hero data.
- [ ] Admin dashboard can list available adapters.
- [ ] Draft panel changes hero pool based on selected game.
- [ ] Missing assets are handled gracefully.

## Verification Method

### Automated Check

- [ ] Run adapter-loading unit tests.
- [ ] Run tests that every adapter returns at least one hero and one ruleset.
- [ ] Run typecheck to ensure adapters conform to `GameAdapter`.
- [ ] Run tests proving LoL roster includes difficult champion names and aliases such as `Kai'Sa`, `Kha'Zix`, `Cho'Gath`, `Dr. Mundo`, `Nunu & Willump`, `Miss Fortune`, `Twisted Fate`, `Jarvan IV`, `Aurelion Sol`, `Wukong`, and `Renata Glasc`.
- [ ] Search `/games/lol` to confirm any future-only files are stubbed/TODO only, not active LCU/Data Dragon/HUD implementation.
- [ ] Search `packages/core-draft` and `packages/core-match` to confirm they do not import any game adapter directly.

### Manual Rehearsal Check

- [ ] Open admin dashboard.
- [ ] Select Generic MOBA game adapter.
- [ ] Confirm hero pool changes.
- [ ] Select LoL sample adapter.
- [ ] Confirm full practical local LoL champion roster appears manually.
- [ ] Confirm LoL search finds `Kai'Sa`, `Kha'Zix`, `Cho'Gath`, `Dr. Mundo`, `Nunu & Willump`, `Miss Fortune`, `Twisted Fate`, `Jarvan IV`, `Aurelion Sol`, `Wukong`, and `Renata Glasc`.
- [ ] Select AOV sample adapter.
- [ ] Confirm sample hero pool appears.
- [ ] Select HoK sample adapter.
- [ ] Confirm sample hero pool appears.
- [ ] Run a short draft using at least one non-LoL adapter.

## Failure Conditions

- Core draft depends on a specific game adapter.
- LoL adapter becomes the default architecture for all games.
- LoL LCU reader, active runtime Data Dragon sync, or in-game HUD is implemented as v0.1 runtime feature.
- Adapter failure crashes the whole server instead of reporting health/error state.

---

# 7. Server Runtime State

## Purpose

Verify that the server manages local runtime state, event package loading, adapters, drafts, production state, Socket.IO broadcast, and audit logs.

## Acceptance Criteria

- [ ] Server starts locally.
- [ ] Server requires no cloud service.
- [ ] Server loads `event-packages/sample-event`.
- [ ] Server loads all game adapters.
- [ ] Server manages current event state.
- [ ] Server manages current match state.
- [ ] Server manages current game state.
- [ ] Server can create or load a draft.
- [ ] Server can update draft state.
- [ ] Server can update production state.
- [ ] Server appends audit log entries.
- [ ] Server broadcasts state updates by Socket.IO.
- [ ] Server exposes health status.
- [ ] Runtime state is serializable.
- [ ] Server can recover reasonable current state from loaded package plus in-memory state during a single run.
- [ ] Server uses explicit errors for invalid actions.

## Verification Method

### Automated Check

- [ ] Run server integration tests.
- [ ] Confirm server loads sample event.
- [ ] Confirm server exposes `/api/health`.
- [ ] Confirm Socket.IO client receives `state:full` on connect.
- [ ] Confirm draft action updates server state and broadcasts to clients.
- [ ] Confirm audit log writes JSONL entries.
- [ ] Confirm server can start with internet disabled.

### Manual Rehearsal Check

- [ ] Start server on a local machine.
- [ ] Open admin dashboard and confirm event package loaded.
- [ ] Open two clients and confirm both receive same current state.
- [ ] Perform draft action from operator panel.
- [ ] Confirm server, overlay, and health dashboard reflect update.
- [ ] Stop and restart server if supported by current implementation and confirm documented recovery behavior.

## Failure Conditions

- Server requires internet access.
- Server cannot load sample event.
- Server state cannot be displayed by clients.
- Draft actions update one client but not others.
- Audit logging is missing for important live actions.
- Invalid actions cause crash or silent failure.

---

# 8. REST API

## Purpose

Verify that setup, health, event, match, draft, adapter, and production operations are exposed through consistent REST APIs.

## Acceptance Criteria

- [ ] REST API base path is `/api`.
- [ ] API responses use a consistent `ApiResponse<T>` shape.
- [ ] Errors include machine-readable code and human-readable message.
- [ ] `GET /api/health` exists.
- [ ] `GET /api/state` exists or equivalent full-state endpoint is documented.
- [ ] `GET /api/events` exists.
- [ ] `GET /api/matches` exists.
- [ ] `GET /api/teams` exists.
- [ ] `GET /api/players` exists.
- [ ] `GET /api/adapters` exists.
- [ ] `GET /api/drafts/:draftId` exists.
- [ ] `POST /api/drafts` exists.
- [ ] `POST /api/drafts/:draftId/start` exists.
- [ ] `POST /api/drafts/:draftId/pause` exists.
- [ ] `POST /api/drafts/:draftId/resume` exists.
- [ ] `POST /api/drafts/:draftId/reset` exists.
- [ ] `POST /api/drafts/:draftId/complete` exists.
- [ ] `POST /api/drafts/:draftId/actions/:actionId/hover` exists.
- [ ] `POST /api/drafts/:draftId/actions/:actionId/lock` exists.
- [ ] `POST /api/drafts/:draftId/undo` exists.
- [ ] `GET /api/production/state` exists.
- [ ] `POST /api/production/state` exists.
- [ ] `POST /api/production/preview` exists.
- [ ] `POST /api/production/take` exists.
- [ ] `POST /api/production/clear` exists.
- [ ] `POST /api/production/emergency` exists.
- [ ] Dangerous API actions require confirmation token, explicit flag, or documented deliberate UI mediation.
- [ ] API actions that mutate live state are logged.

## Verification Method

### Automated Check

- [ ] Run API integration tests for required endpoints.
- [ ] Test valid request returns `ok: true`.
- [ ] Test invalid request returns `ok: false` with explicit error.
- [ ] Test dangerous mutation without confirmation is rejected where applicable.
- [ ] Test mutation writes audit log entry.
- [ ] Test production state API broadcasts relevant Socket.IO update.

### Manual Rehearsal Check

- [ ] Use dashboard UI to perform API-backed actions.
- [ ] Confirm dashboard error messages are understandable.
- [ ] Confirm invalid action does not silently mutate live state.
- [ ] Confirm dangerous actions show confirmation before API call or before mutation.

## Failure Conditions

- APIs return inconsistent payload shapes.
- Invalid actions mutate state.
- Dangerous actions can be triggered accidentally.
- Live mutations are not logged.
- API design requires internet or external service.

---

# 9. Socket.IO Realtime Sync

## Purpose

Verify that all live clients receive current and updated state reliably.

## Acceptance Criteria

- [ ] Server accepts Socket.IO connections locally.
- [ ] Client sends `client:hello` or equivalent handshake.
- [ ] Server emits `state:full` on new connection.
- [ ] Server emits state updates after draft actions.
- [ ] Server emits state updates after production state changes.
- [ ] Server emits graphics preview/program/clear updates.
- [ ] Server emits health updates.
- [ ] Server emits log entries or exposes latest log event.
- [ ] Socket payloads use `SocketEnvelope<T>` or documented equivalent.
- [ ] Socket errors are explicit and machine-readable.
- [ ] Draft overlay reconnects automatically.
- [ ] Admin dashboard reconnects automatically.
- [ ] Draft operator panel reconnects automatically.
- [ ] Reconnected client receives latest full state.
- [ ] Socket updates do not require internet.

## Verification Method

### Automated Check

- [ ] Run integration test that client receives `state:full` on connect.
- [ ] Run integration test that draft lock broadcasts `draft:updated`.
- [ ] Run integration test that production state change broadcasts `production:state`.
- [ ] Run integration test that reconnect receives latest full state.
- [ ] Run integration test for explicit socket error on invalid action.

### Manual Rehearsal Check

- [ ] Open admin dashboard, draft panel, and overlay simultaneously.
- [ ] Lock a hero from draft panel.
- [ ] Confirm overlay and dashboard update without manual refresh.
- [ ] Refresh overlay browser source.
- [ ] Confirm overlay receives latest current state.
- [ ] Restart server if supported and confirm clients show disconnected/reconnected state rather than stale success.

## Failure Conditions

- New clients do not receive full current state.
- Overlay requires manual page reload after normal state update.
- Reconnect shows stale state.
- Socket errors are silent or unclear.
- Socket.IO requires cloud service or internet.

---

# 10. Sample Event Package

## Purpose

Verify that v0.1 has a portable local sample event that works without external APIs.

## Acceptance Criteria

- [ ] `event-packages/sample-event` exists.
- [ ] `event.json` exists.
- [ ] `matches.json` exists.
- [ ] `teams.json` exists.
- [ ] `players.json` exists.
- [ ] `sponsors.json` exists.
- [ ] `rulesets` directory exists.
- [ ] `rulesets/generic-standard.json` or equivalent exists.
- [ ] `rulesets/lol-standard.json` or equivalent exists.
- [ ] AOV and HoK ruleset examples exist or are documented as adapter-provided defaults.
- [ ] `themes/default-theme.json` exists.
- [ ] `assets` directory exists.
- [ ] `logs` directory exists.
- [ ] Package includes one event.
- [ ] Package includes at least one BO3 match.
- [ ] Package includes two teams.
- [ ] Package includes at least five players per team where player display is expected.
- [ ] Package includes at least one sponsor.
- [ ] Package includes a default theme.
- [ ] Package can be loaded without internet.
- [ ] Package uses relative/local asset paths or safe fallbacks.
- [ ] Package does not require real copyrighted production assets to pass tests.

## Verification Method

### Automated Check

- [ ] Run sample package validation test.
- [ ] Run server-load integration test.
- [ ] Validate JSON syntax for all package files.
- [ ] Validate rulesets against `DraftRuleset`.
- [ ] Validate default theme against `ThemeConfig`.
- [ ] Confirm server starts with sample event selected.

### Manual Rehearsal Check

- [ ] Open admin dashboard and view sample event.
- [ ] Confirm sample match displays.
- [ ] Confirm teams and player list display.
- [ ] Select sample ruleset.
- [ ] Run draft using sample event.
- [ ] Confirm overlay displays sponsor slot and fallback assets where assets are missing.

## Failure Conditions

- Sample event cannot load.
- JSON is invalid.
- Ruleset does not produce a runnable draft.
- Sample package requires internet assets to operate.
- Sample package hardcodes one game in a way that prevents adapter switching.

---

# 11. Admin Dashboard

## Purpose

Verify that TD/admin users can inspect and configure the local event, match, teams, players, sponsors, ruleset, theme, and health state.

## Acceptance Criteria

- [ ] Admin dashboard app starts locally.
- [ ] `/admin` route exists.
- [ ] Admin can view current event.
- [ ] Admin can view or select current match.
- [ ] Admin can view or assign blue/red teams.
- [ ] Admin can view players.
- [ ] Admin can view sponsors.
- [ ] Admin can view available game adapters.
- [ ] Admin can select or confirm game code for match/game.
- [ ] Admin can select or confirm draft ruleset.
- [ ] Admin can view selected theme.
- [ ] Admin can view system health.
- [ ] Admin can see connected client count.
- [ ] Admin can see current production state.
- [ ] Admin can see emergency readiness/status.
- [ ] Admin dashboard shows clear error state when server is disconnected.
- [ ] Admin dashboard does not hide live-critical state in tiny or ambiguous UI.

## Verification Method

### Automated Check

- [ ] Run dashboard build.
- [ ] Run dashboard typecheck.
- [ ] Run UI tests if present for admin route rendering.
- [ ] Run integration test or mocked API test for loading current event/match.
- [ ] Run accessibility/basic DOM test for key labels if available.

### Manual Rehearsal Check

- [ ] Open `/admin`.
- [ ] Confirm current event, match, teams, game code, ruleset, and production state are visible.
- [ ] Change or confirm active match where supported.
- [ ] Switch game adapter where supported.
- [ ] Open system health page.
- [ ] Disconnect server and confirm dashboard reports disconnection.

## Failure Conditions

- Admin cannot identify the active match/game.
- Admin cannot verify selected game adapter or ruleset.
- Dashboard silently fails when server is unavailable.
- UI makes dangerous live changes without confirmation.

---

# 12. Draft Operator Panel

## Purpose

Verify that a draft operator can run a complete manual Ban/Pick workflow under live-show pressure.

## Acceptance Criteria

- [ ] Draft operator route exists, such as `/draft` and/or `/draft/:matchId`.
- [ ] Current match is visible.
- [ ] Current game number is visible.
- [ ] Blue/red teams are visible.
- [ ] Current draft status is visible.
- [ ] Current phase is visible.
- [ ] Current team turn is obvious.
- [ ] Timer is visible.
- [ ] Hero search exists.
- [ ] LoL draft operator uses the full practical local LoL roster, not a 20-item sample.
- [ ] LoL search handles apostrophes, periods, ampersands, spaces, roman numerals, punctuation, case, and aliases.
- [ ] LoL search finds `Kai'Sa`, `Kha'Zix`, `Cho'Gath`, `Dr. Mundo`, `Nunu & Willump`, `Miss Fortune`, `Twisted Fate`, `Jarvan IV`, `Aurelion Sol`, `Wukong`, and `Renata Glasc`.
- [ ] Hero grid/list exists.
- [ ] Champion cards show a local icon when local asset exists.
- [ ] Full champion name is always visible.
- [ ] Missing icons do not show browser broken-image icons.
- [ ] Pick slots are visible.
- [ ] Ban slots are visible.
- [ ] Hover action is supported.
- [ ] Lock action is supported.
- [ ] Start draft control exists.
- [ ] Pause draft control exists.
- [ ] Resume draft control exists.
- [ ] Undo control exists.
- [ ] Reset draft control exists and requires confirmation.
- [ ] Complete draft control exists and requires confirmation.
- [ ] Manual override exists where implemented and is clearly marked.
- [ ] Invalid actions show explicit feedback.
- [ ] Draft actions update overlay through Socket.IO.
- [ ] Draft actions are logged.

## Verification Method

### Automated Check

- [ ] Run UI build/typecheck.
- [ ] Run component tests if present.
- [ ] Run integration test that draft operator action updates server state.
- [ ] Run integration test that draft operator action broadcasts to overlay.
- [ ] Run test that reset/complete require confirmation or deliberate confirmation payload.

### Manual Rehearsal Check

- [ ] Open draft operator panel.
- [ ] Start sample draft.
- [ ] Search for a hero.
- [ ] Hover hero.
- [ ] Lock ban.
- [ ] Lock pick.
- [ ] Pause timer.
- [ ] Resume timer.
- [ ] Undo locked action.
- [ ] Attempt duplicate hero selection and confirm block.
- [ ] Complete full draft.
- [ ] Confirm overlay mirrors every important change.
- [ ] Confirm audit log records start, hover, lock, pause/resume, undo, reset/complete.

## Failure Conditions

- Operator cannot complete a full draft.
- Current phase/team turn is ambiguous.
- Timer controls fail.
- Reset or complete can be triggered accidentally.
- Overlay does not update after operator action.
- Invalid actions silently fail or corrupt draft state.

---

# 13. Producer Panel

## Purpose

Verify that the producer can control global show state, Preview/Program, graphics take/clear, and emergency mode at a basic v0.1 level.

## Acceptance Criteria

- [ ] Producer route exists, such as `/producer`.
- [ ] Producer can view current match.
- [ ] Producer can view current production state.
- [ ] Producer can change production state.
- [ ] Producer can prepare/preview supported graphics.
- [ ] Producer can take supported graphics to Program.
- [ ] Producer can clear Program graphics.
- [ ] Preview and Program states are visually distinct.
- [ ] Producer can trigger emergency mode with confirmation.
- [ ] Producer can see emergency status.
- [ ] Producer can see overlay connection/health summary or link to health dashboard.
- [ ] Take/Clear actions are deliberate and logged.
- [ ] Production state changes are logged.
- [ ] Producer panel does not contain player-side automation.

## Verification Method

### Automated Check

- [ ] Run production state unit tests.
- [ ] Run integration test for `POST /api/production/state`.
- [ ] Run integration test for graphics preview/take/clear.
- [ ] Run integration test confirming audit log entries for producer actions.
- [ ] Run UI typecheck/build.

### Manual Rehearsal Check

- [ ] Open producer panel.
- [ ] Change production state to `DRAFT_READY`.
- [ ] Preview draft overlay.
- [ ] Take draft overlay to Program.
- [ ] Clear Program graphics.
- [ ] Trigger emergency mode with confirmation.
- [ ] Confirm overlay reacts to production state.
- [ ] Confirm audit log records all actions.

## Failure Conditions

- Producer cannot distinguish Preview from Program.
- Graphics go to Program without deliberate Take action.
- Emergency mode lacks confirmation.
- Production state is buried inside game-specific module or overlay-only code.
- Producer actions are not logged.

---

# 14. Caster / Read-only Panel

## Purpose

Verify that casters or read-only users can view public match and draft information without mutation controls or hidden competitive information.

## Acceptance Criteria

- [ ] Caster route exists, such as `/caster` or `/caster/match/:matchId`.
- [ ] Caster panel shows match info.
- [ ] Caster panel shows team info.
- [ ] Caster panel shows player info where available.
- [ ] Caster panel shows current draft summary.
- [ ] Caster panel shows previous draft summary where available.
- [ ] Caster panel is read-only.
- [ ] Caster panel has no draft mutation controls.
- [ ] Caster panel has no production take/clear controls.
- [ ] Caster panel has no emergency trigger controls.
- [ ] Caster panel does not expose hidden competitive information.
- [ ] Caster panel updates via Socket.IO or documented polling fallback.

## Verification Method

### Automated Check

- [ ] Run UI build/typecheck.
- [ ] Run tests confirming mutation buttons are not rendered in caster panel.
- [ ] Run tests or source review confirming caster route does not call mutation endpoints.
- [ ] Run integration test that caster panel receives draft state updates.

### Manual Rehearsal Check

- [ ] Open caster panel during sample draft.
- [ ] Confirm match, teams, and draft summary are visible.
- [ ] Confirm panel updates after draft lock.
- [ ] Confirm no buttons exist for start, lock, undo, reset, complete, take, clear, or emergency.

## Failure Conditions

- Caster panel can mutate live state.
- Caster panel exposes hidden or non-broadcast-safe information.
- Caster panel shows stale draft state after updates.

---

# 15. Overlay App

## Purpose

Verify that broadcast overlays are browser-source compatible, read-only, and resilient.

## Acceptance Criteria

- [ ] Overlay app starts locally.
- [ ] Overlay routes are browser-source compatible.
- [ ] Required v0.1 routes exist:
  - [ ] `/overlay/draft/:matchId`
  - [ ] `/overlay/scorebug/:matchId`
  - [ ] `/overlay/emergency`
  - [ ] `/overlay/program`
  - [ ] `/overlay/preview`
- [ ] Optional/future routes may exist as placeholders only if documented:
  - [ ] `/overlay/lower-third`
  - [ ] `/overlay/sponsor`
  - [ ] `/overlay/pause`
  - [ ] `/overlay/post-game/:matchId`
  - [ ] `/overlay/mvp/:matchId`
- [ ] Overlay routes are read-only.
- [ ] Overlay routes contain no admin mutation controls.
- [ ] Overlay connects to Socket.IO.
- [ ] Overlay auto-reconnects.
- [ ] Overlay receives latest state after refresh.
- [ ] Overlay supports `?debug=1` where implemented.
- [ ] Debug mode shows connection status, route, match ID, and timestamp.
- [ ] Standard layout targets 1920x1080.
- [ ] Transparent background is supported where appropriate.
- [ ] Safe margins are respected.
- [ ] No scrollbars appear in standard OBS view.
- [ ] Missing assets show fallback graphics.

## Verification Method

### Automated Check

- [ ] Run overlay build/typecheck.
- [ ] Run overlay route rendering tests if available.
- [ ] Run integration test for Socket.IO reconnect/latest state.
- [ ] Run static review to confirm overlay does not call mutation APIs.
- [ ] Run visual/e2e tests if Playwright exists.

### Manual Rehearsal Check

- [ ] Open each required overlay route in browser.
- [ ] Add draft route to OBS/vMix browser source or browser-source-sized preview.
- [ ] Confirm transparent background where expected.
- [ ] Confirm no scrollbars at 1920x1080.
- [ ] Refresh overlay and confirm latest state returns.
- [ ] Use `?debug=1` and confirm debug data appears.
- [ ] Simulate missing asset and confirm fallback displays.

## Failure Conditions

- Overlay includes mutation controls.
- Overlay cannot reconnect.
- Overlay does not recover current state after refresh.
- Overlay is not usable as OBS/vMix browser source.
- Missing asset breaks rendering.

---

# 16. Draft Overlay

## Purpose

Verify that the draft overlay displays Ban/Pick state clearly for broadcast.

## Acceptance Criteria

- [ ] Draft overlay route exists at `/overlay/draft/:matchId`.
- [ ] Blue team name displays.
- [ ] Red team name displays.
- [ ] Team logos display or fall back safely.
- [ ] Blue bans display.
- [ ] Red bans display.
- [ ] Blue picks display.
- [ ] Red picks display.
- [ ] Current timer displays.
- [ ] Current phase displays.
- [ ] Current active team/side is visually clear.
- [ ] Hovered hero can display distinctly where supported.
- [ ] Locked heroes display distinctly from hover/pending.
- [ ] Sponsor slot displays if configured.
- [ ] Theme config affects visual styling.
- [ ] Missing hero icon shows fallback graphic.
- [ ] Draft overlay is broadcast output, not dashboard/operator UI.
- [ ] Full champion names remain visible when champion images are missing.
- [ ] Initials-only fallback is never the sole on-air information for a locked or hovered champion.
- [ ] Browser broken-image icons are not visible on-air.
- [ ] Timer visibly counts down from authoritative state when draft is running.
- [ ] Active side and current phase are visually clear.
- [ ] LoL draft overlay follows reference-driven broadcast standards: transparent 1920x1080 canvas, bottom-anchored broadcast rail, blue side left, red side right, five pick cards per team, compact ban strip, and central timer/phase/active-side module.
- [ ] Overlay updates after hover.
- [ ] Overlay updates after lock.
- [ ] Overlay updates after undo.
- [ ] Overlay updates after reset.
- [ ] Overlay handles completed draft state.
- [ ] Overlay supports debug mode.

## Verification Method

### Automated Check

- [ ] Run component/render tests for draft overlay state variants.
- [ ] Run integration test that draft lock broadcasts and overlay receives update.
- [ ] Run test for missing hero icon fallback if available.
- [ ] Run visual snapshot/e2e test if available.
- [ ] Run static or component checks proving missing image cases still render full champion names.

### Manual Rehearsal Check

- [ ] Open draft overlay.
- [ ] Capture or manually inspect a 1920x1080 OBS/vMix-style view for normal draft state.
- [ ] Capture or manually inspect a 1920x1080 OBS/vMix-style view for missing champion icon state.
- [ ] Start draft from operator panel.
- [ ] Confirm phase/timer appear.
- [ ] Hover hero and confirm overlay update.
- [ ] Lock ban and confirm ban slot update.
- [ ] Lock pick and confirm pick slot update.
- [ ] Undo and confirm overlay rolls back.
- [ ] Complete draft and confirm final state is readable.
- [ ] Enable `?debug=1` and confirm debug info appears.

## Failure Conditions

- Draft overlay cannot show both teams.
- Draft overlay fails to update in real time.
- Timer is missing or misleading.
- Timer does not visibly count down when draft state is running.
- Missing assets break overlay.
- Missing champion art leaves only initials or a broken image as on-air information.
- Draft overlay exposes controls or mutation endpoints.

---

# 17. Score Bug Overlay

## Purpose

Verify that the score bug overlay displays basic match score and team identity.

## Acceptance Criteria

- [ ] Score bug route exists at `/overlay/scorebug/:matchId`.
- [ ] Blue/left team name or short name displays.
- [ ] Red/right team name or short name displays.
- [ ] Team logos display or fall back safely.
- [ ] Current match score displays.
- [ ] Current game number displays where available.
- [ ] Match title or compact event context displays where appropriate.
- [ ] Score bug updates when score changes.
- [ ] Score bug responds to production state where appropriate.
- [ ] Score bug supports theme colors.
- [ ] Score bug is usable in 1920x1080 overlay composition.
- [ ] Score bug has no mutation controls.

## Verification Method

### Automated Check

- [ ] Run overlay build/typecheck.
- [ ] Run render test for score bug with sample match.
- [ ] Run integration test that score update or sample state displays correctly.
- [ ] Run static review that score bug does not call mutation APIs.

### Manual Rehearsal Check

- [ ] Open score bug overlay route.
- [ ] Confirm team names/logos and score display.
- [ ] Change sample score through admin or server-supported action.
- [ ] Confirm score bug updates.
- [ ] Confirm missing logo fallback works.
- [ ] Confirm no scrollbars in browser-source-sized view.

## Failure Conditions

- Score bug cannot display basic team/score info.
- Score bug shows stale score after update.
- Score bug has mutation controls.
- Layout is unusable in broadcast browser source.

---

# 18. Emergency Overlay

## Purpose

Verify that the system has a simple emergency output that can be used when normal workflow fails.

## Acceptance Criteria

- [ ] Emergency route exists at `/overlay/emergency`.
- [ ] Emergency overlay can be triggered from producer/admin control with confirmation.
- [ ] Emergency overlay shows clear emergency/pause/technical-hold content.
- [ ] Emergency overlay can show basic match/team context where available.
- [ ] Emergency overlay can show sponsor-safe fallback if configured.
- [ ] Emergency overlay does not depend on complex draft state to render.
- [ ] Emergency overlay remains readable if hero assets are missing.
- [ ] Emergency state is represented in production state or emergency flag.
- [ ] Emergency trigger is logged.
- [ ] Emergency clear/reset behavior is documented.
- [ ] Emergency overlay is browser-source compatible.
- [ ] Emergency overlay can be opened directly on local LAN.

## Verification Method

### Automated Check

- [ ] Run production/emergency state tests.
- [ ] Run API/socket test for emergency trigger.
- [ ] Run audit log test for emergency trigger.
- [ ] Run overlay render test for emergency route if available.

### Manual Rehearsal Check

- [ ] Open emergency overlay route.
- [ ] Trigger emergency mode from producer/admin panel.
- [ ] Confirm confirmation prompt appears.
- [ ] Confirm emergency overlay changes visibly.
- [ ] Confirm draft overlay/program route responds if intended.
- [ ] Confirm audit log contains emergency event.
- [ ] Reload emergency route and confirm it still displays correct emergency state.

## Failure Conditions

- Emergency cannot be triggered.
- Emergency trigger lacks confirmation.
- Emergency overlay fails if normal draft state is broken.
- Emergency trigger is not logged.
- Emergency overlay is not usable as broadcast fallback.

---

# 19. Production Control Layer

## Purpose

Verify that global show state and graphics workflow are above draft and game-specific modules.

## Acceptance Criteria

- [ ] Production control logic lives in `packages/core-production` and/or server production module.
- [ ] Production control is not buried inside `/games/lol`.
- [ ] Production control is not only inside overlay components.
- [ ] `ProductionState` supports v0.1 show states.
- [ ] Required states include:
  - [ ] `PRE_SHOW`
  - [ ] `OPENING`
  - [ ] `TEAM_INTRO`
  - [ ] `DRAFT_READY`
  - [ ] `DRAFT_LIVE`
  - [ ] `DRAFT_COMPLETE`
  - [ ] `LOADING_SCREEN`
  - [ ] `GAME_LIVE`
  - [ ] `PAUSE`
  - [ ] `TECH_PAUSE`
  - [ ] `POST_GAME`
  - [ ] `MVP`
  - [ ] `BREAK`
  - [ ] `NEXT_GAME`
  - [ ] `MATCH_COMPLETE`
- [ ] Preview/Program concept exists.
- [ ] Take action moves preview graphic to program.
- [ ] Clear action removes program graphic.
- [ ] Production state can affect overlays.
- [ ] Emergency state can override normal overlay state.
- [ ] Dangerous production actions require confirmation.
- [ ] Production state changes are logged.

## Verification Method

### Automated Check

- [ ] Run production state unit tests.
- [ ] Run tests for valid/invalid state transitions where implemented.
- [ ] Run integration test for preview/take/clear.
- [ ] Run integration test for production state broadcast.
- [ ] Search for production control logic inside `/games/lol` and confirm it is absent.

### Manual Rehearsal Check

- [ ] Open producer panel.
- [ ] Move through states: `PRE_SHOW` → `DRAFT_READY` → `DRAFT_LIVE` → `DRAFT_COMPLETE`.
- [ ] Preview draft graphic.
- [ ] Take to Program.
- [ ] Clear Program.
- [ ] Trigger emergency.
- [ ] Confirm overlays respond.
- [ ] Confirm audit log records state and graphics changes.

## Failure Conditions

- Production Control is implemented as LoL-specific.
- Graphics go live without Preview/Take workflow where required.
- Take/Clear actions are not logged.
- Emergency state cannot override normal state.
- State machine is hidden in overlay UI only.

---

# 20. Theme System

## Purpose

Verify that event styling can be configured through local JSON theme config.

## Acceptance Criteria

- [ ] `packages/theme-engine` exists.
- [ ] Theme config supports colors.
- [ ] Theme config supports typography.
- [ ] Theme config supports safe margins.
- [ ] Theme config supports border radius.
- [ ] Theme config supports animation speed.
- [ ] Theme config supports background/frame/sponsor assets.
- [ ] Sample event includes default theme JSON.
- [ ] Overlay reads theme config.
- [ ] Draft overlay uses theme values.
- [ ] Score bug uses theme values where applicable.
- [ ] Missing theme values fall back to safe defaults.
- [ ] Invalid theme config returns explicit warning/error.
- [ ] Manual CSS override is possible or documented as future-safe extension.
- [ ] Theme system does not require internet or cloud asset service.

## Verification Method

### Automated Check

- [ ] Run theme config parsing tests.
- [ ] Run tests for missing optional theme values.
- [ ] Run overlay render tests confirming theme values are applied where practical.
- [ ] Validate sample `default-theme.json`.

### Manual Rehearsal Check

- [ ] Open overlay with default theme.
- [ ] Change a safe theme value in local event package.
- [ ] Restart/reload as documented.
- [ ] Confirm overlay reflects theme change.
- [ ] Remove optional theme value and confirm fallback still renders.

## Failure Conditions

- Overlay styling is hardcoded only and ignores event theme.
- Missing theme value breaks overlay.
- Theme requires remote asset service.
- Theme system introduces game-specific assumptions into universal overlay.

---

# 21. Audit Logging

## Purpose

Verify that important live-production actions are recorded in append-only JSONL.

## Acceptance Criteria

- [ ] Audit log uses append-only JSONL.
- [ ] Log path is inside event package logs, such as `event-packages/sample-event/logs/production-log.jsonl`.
- [ ] Each log entry includes timestamp.
- [ ] Each log entry includes event/action type.
- [ ] Each log entry includes relevant IDs where applicable.
- [ ] Operator ID is included when available.
- [ ] Log entries are valid JSON per line.
- [ ] Match create/update is logged.
- [ ] Game create/update is logged.
- [ ] Draft start is logged.
- [ ] Draft pause/resume is logged.
- [ ] Draft reset is logged.
- [ ] Draft complete is logged.
- [ ] Pick/ban hover is logged.
- [ ] Pick/ban lock is logged.
- [ ] Undo is logged.
- [ ] Manual override is logged.
- [ ] Timer changes are logged.
- [ ] Production state changes are logged.
- [ ] Graphics preview/take/clear are logged.
- [ ] Result confirmation is logged where implemented.
- [ ] Emergency mode trigger is logged.
- [ ] Audit log write failure is visible in health/error state.

## Verification Method

### Automated Check

- [ ] Run audit log unit tests.
- [ ] Run integration test that draft actions append JSONL.
- [ ] Run integration test that production actions append JSONL.
- [ ] Validate every JSONL line can be parsed as JSON.
- [ ] Confirm log file is appended, not overwritten during normal operations.

### Manual Rehearsal Check

- [ ] Start draft.
- [ ] Hover hero.
- [ ] Lock hero.
- [ ] Pause/resume timer.
- [ ] Undo.
- [ ] Take graphic to Program.
- [ ] Trigger emergency.
- [ ] Open log file and confirm entries exist in chronological order.

## Failure Conditions

- Important live actions are not logged.
- Log file is overwritten unexpectedly.
- JSONL is invalid.
- Log write failure is hidden.
- Logs are stored only in browser memory.

---

# 22. System Health Dashboard

## Purpose

Verify that the TD can see system readiness and connection health at a glance.

## Acceptance Criteria

- [ ] Health route exists in dashboard, such as `/admin/system-health`.
- [ ] Server exposes `/api/health`.
- [ ] Health state includes server started time.
- [ ] Health state includes connected Socket.IO clients.
- [ ] Health state includes loaded event package ID.
- [ ] Health state includes current production state.
- [ ] Health state includes adapter status.
- [ ] Health state includes hero count per adapter where available.
- [ ] Health state includes asset warnings or missing assets.
- [ ] Health state includes emergency readiness.
- [ ] Health state includes last state update timestamp.
- [ ] Health dashboard shows dashboard connection status.
- [ ] Health dashboard shows overlay connection status where available.
- [ ] Health dashboard shows draft operator connection status where available.
- [ ] Health dashboard is readable during production.
- [ ] Health problems are shown as warnings/errors, not hidden.

## Verification Method

### Automated Check

- [ ] Run API test for `/api/health`.
- [ ] Run integration test that Socket.IO clients appear in health data.
- [ ] Run adapter health test.
- [ ] Run asset warning test if asset checker exists.
- [ ] Run dashboard render test for health page if available.

### Manual Rehearsal Check

- [ ] Open health dashboard.
- [ ] Open overlay and draft operator panel.
- [ ] Confirm connected clients appear.
- [ ] Disconnect overlay and confirm health updates.
- [ ] Trigger missing asset scenario and confirm warning appears.
- [ ] Confirm emergency status is visible.

## Failure Conditions

- TD cannot see if overlays are connected.
- Health status does not update.
- Adapter or asset failures are hidden.
- Health page requires internet or third-party service.

---

# 23. Local Deployment / LAN Operation

## Purpose

Verify that the system works in a real local production LAN environment.

## Acceptance Criteria

- [ ] Server can run on a local control laptop/mini PC.
- [ ] Admin dashboard can open from same machine.
- [ ] Draft operator panel can open from another machine on same LAN.
- [ ] Producer panel can open from another machine on same LAN.
- [ ] Overlay routes can open from graphics PC / OBS browser source on same LAN.
- [ ] System does not require internet during live show.
- [ ] Local event package and local assets are sufficient for rehearsal.
- [ ] No cloud sync is required.
- [ ] No external database is required.
- [ ] No OBS WebSocket is required.
- [ ] No vMix API is required.
- [ ] No Bitfocus Companion or Stream Deck integration is required.
- [ ] Browser-source URLs are documented with host/port examples.
- [ ] Firewall/port assumptions are documented.
- [ ] Offline failure mode is documented.

## Verification Method

### Automated Check

- [ ] Run all build/test commands with internet disabled after dependencies are installed.
- [ ] Confirm server starts without cloud credentials.
- [ ] Confirm no runtime environment variables are required for external services.
- [ ] Search code/config for mandatory cloud URLs or external API dependencies.

### Manual Rehearsal Check

- [ ] Connect at least two devices to same LAN.
- [ ] Run server on control machine.
- [ ] Open draft panel from another device using LAN IP.
- [ ] Open overlay from graphics/OBS machine using LAN IP.
- [ ] Disconnect WAN/internet.
- [ ] Run a full draft.
- [ ] Trigger emergency overlay.
- [ ] Confirm system continues to function.

## Failure Conditions

- Live workflow breaks without internet.
- Overlay routes work only on localhost and not LAN IP.
- System requires OBS WebSocket/vMix API to display graphics.
- Sample assets require remote loading during show.

---

# 24. Documentation

## Purpose

Verify that operators and developers can run, operate, and extend the system safely.

## Acceptance Criteria

- [ ] Root `README.md` exists.
- [ ] README explains project overview.
- [ ] README explains install commands.
- [ ] README explains how to run server.
- [ ] README explains how to run dashboard.
- [ ] README explains how to run overlay.
- [ ] README lists OBS/vMix browser-source URLs.
- [ ] README explains sample event package.
- [ ] README lists development commands.
- [ ] README states known limitations.
- [ ] README states v0.1 scope.
- [ ] `docs/operator-guide.md` exists.
- [ ] Operator guide explains how to start a draft.
- [ ] Operator guide explains manual Ban/Pick operation.
- [ ] Operator guide explains hover/lock.
- [ ] Operator guide explains undo.
- [ ] Operator guide explains reset.
- [ ] Operator guide explains complete draft.
- [ ] Operator guide explains emergency mode.
- [ ] Operator guide explains OBS overlay URLs.
- [ ] `docs/deployment-guide.md` exists.
- [ ] Deployment guide explains local LAN setup.
- [ ] Deployment guide explains control laptop/server role.
- [ ] Deployment guide explains graphics PC / OBS role.
- [ ] Deployment guide explains draft operator laptop role.
- [ ] Deployment guide states no internet dependency principle.
- [ ] `docs/game-adapter-guide.md` exists.
- [ ] Game adapter guide explains how to add a new game.
- [ ] Game adapter guide explains how to add hero data.
- [ ] Game adapter guide explains how to add rulesets.
- [ ] Game adapter guide warns not to put game-specific logic into core.
- [ ] `docs/ACCEPTANCE_CRITERIA.md` exists.
- [ ] Documentation does not claim v0.2/v0.3 features are implemented in v0.1.

## Verification Method

### Automated Check

- [ ] Run markdown lint if available.
- [ ] Check required doc files exist.
- [ ] Check README contains required command names and overlay routes.
- [ ] Check docs do not advertise forbidden v0.1 scope as completed.

### Manual Rehearsal Check

- [ ] Give README/operator guide to a new operator.
- [ ] Operator follows docs to start server/dashboard/overlay.
- [ ] Operator follows docs to run sample draft.
- [ ] Operator follows docs to trigger emergency mode.
- [ ] Developer reads game adapter guide and can identify where new game logic belongs.

## Failure Conditions

- New operator cannot run the system from docs.
- Docs imply LoL HUD/LCU/Data Dragon/OBS WebSocket is required for v0.1.
- OBS URLs are missing.
- Emergency instructions are missing.
- Adapter guide encourages putting game-specific logic in core.

---

# 25. Testing and Verification Commands

## Purpose

Define the expected automated verification commands and what they prove.

## Acceptance Criteria

- [ ] Root `pnpm install` works.
- [ ] Root `pnpm lint` works where lint is configured.
- [ ] Root `pnpm typecheck` works.
- [ ] Root `pnpm test` works.
- [ ] Root `pnpm build` works.
- [ ] Root `pnpm verify` exists or documentation states the equivalent command sequence.
- [ ] Unit tests cover draft ruleset parsing.
- [ ] Unit tests cover draft creation.
- [ ] Unit tests cover draft start.
- [ ] Unit tests cover draft phase advancement.
- [ ] Unit tests cover pick/ban lock.
- [ ] Unit tests cover duplicate hero blocking.
- [ ] Unit tests cover timer calculation.
- [ ] Unit tests cover pause/resume.
- [ ] Unit tests cover undo.
- [ ] Unit tests cover reset.
- [ ] Unit tests cover complete.
- [ ] Unit tests cover production state transitions.
- [ ] Unit tests cover game adapter loading.
- [ ] Integration tests cover server loads sample event.
- [ ] Integration tests cover server exposes health state.
- [ ] Integration tests cover Socket.IO `state:full` on connect.
- [ ] Integration tests cover draft action updates server state.
- [ ] Integration tests cover draft state broadcasts to connected clients.
- [ ] Integration tests cover socket reconnect receiving latest state.
- [ ] Integration tests cover audit log entries.
- [ ] Manual rehearsal checklist exists.
- [ ] Test results are reported honestly in handoff summaries.

## Verification Method

### Automated Check

Run:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

If available, also run:

```bash
pnpm test:e2e
pnpm verify
```

For missing commands:

- [ ] Do not claim success.
- [ ] Record command as unavailable.
- [ ] Explain whether this is acceptable for current milestone.

### Manual Rehearsal Check

- [ ] Perform full rehearsal checklist:
  - [ ] Start server.
  - [ ] Open admin dashboard.
  - [ ] Open draft operator panel.
  - [ ] Open OBS overlay route.
  - [ ] Load sample match.
  - [ ] Start draft.
  - [ ] Complete draft.
  - [ ] Trigger emergency mode.
  - [ ] Reset system.
  - [ ] Reload browser sources.
  - [ ] Confirm state recovery.

## Failure Conditions

- Tests are missing for core draft behavior.
- Agents claim tests passed without running them.
- Root commands are broken and not reported.
- Manual rehearsal has never been performed for release.
- A failing test is ignored.

---

# 26. Out-of-Scope Guardrails

## Purpose

Prevent v0.1 from accidentally expanding into future roadmap items or unsafe production behavior.

## Acceptance Criteria

The following must not be implemented as active v0.1 features:

- [ ] No LoL LCU reader.
- [ ] No LoL champion select auto-sync.
- [ ] No LoL in-game HUD.
- [ ] No active runtime Data Dragon sync or mandatory show-time Data Dragon dependency.
- [ ] No OBS WebSocket integration.
- [ ] No vMix API integration.
- [ ] No Bitfocus Companion integration.
- [ ] No Stream Deck integration.
- [ ] No SQLite database.
- [ ] No cloud sync.
- [ ] No user login system as required runtime dependency.
- [ ] No advanced animation editor.
- [ ] No PNG export as required v0.1 feature.
- [ ] No AI match report generation.
- [ ] No real sponsor scheduling automation.
- [ ] No player-side automation.
- [ ] No auto-pick.
- [ ] No auto-ban.
- [ ] No player client control.
- [ ] No software required on player PCs.
- [ ] No hidden competitive information shown to unauthorized panels.
- [ ] No dependency on unsupported game-client behavior as the only production workflow.

Clean placeholder interfaces or TODO notes are acceptable only when:

- [ ] They are clearly marked as future v0.2/v0.3/v0.4 scope.
- [ ] They do not run as active v0.1 features.
- [ ] They do not introduce runtime dependencies.
- [ ] They do not contaminate universal core modules.

Allowed static/reference work must not be blocked by over-broad wording:

- [ ] Documentation may mention `Data Dragon`, `DataDragon`, and `Riot` when describing reference policy, forbidden runtime boundaries, or future scope.
- [ ] `/games/lol` may contain pre-event/static Data Dragon import scripts and generated local champion metadata when runtime remains local-first.
- [ ] Static guardrails distinguish docs/scripts/generated local data from forbidden runtime integrations.
- [ ] Guardrails still fail Riot/LCU/DataDragon dependencies in universal core packages and active show-runtime paths where forbidden.

## Verification Method

### Automated Check

- [ ] Search repository for `LCU`, `DataDragon`, `Data Dragon`, `Riot`, `champion-select-reader`, `ingame-hud`, `OBSWebSocket`, `vMix`, `Companion`, `StreamDeck`, `sqlite`, `prisma`, and cloud provider SDKs.
- [ ] Confirm matches are allowed docs, pre-event/static LoL adapter scripts, generated local metadata, tests for guardrails, future TODOs, or isolated non-runtime placeholders.
- [ ] Search core packages for game-specific imports.
- [ ] Run tests proving manual workflow works without future integrations.

### Manual Rehearsal Check

- [ ] Run full sample show without internet.
- [ ] Run draft without any game client reader.
- [ ] Run overlay without OBS WebSocket/vMix API.
- [ ] Confirm no user is asked to install software on player PCs.
- [ ] Confirm no feature performs player-side actions.

## Failure Conditions

- Any forbidden item is required for v0.1 workflow.
- Universal draft core imports future LoL plugin logic.
- System auto-picks or auto-bans.
- System controls player clients.
- System fails without internet or external API.

---

# 27. Final Release Checklist

## Purpose

Provide a single final sign-off checklist for v0.1.

## Acceptance Criteria

### Architecture Sign-off

- [ ] Universal Ban/Pick is game-agnostic.
- [ ] LoL In-game HUD is future plugin only.
- [ ] Production Control sits above draft and game adapters.
- [ ] Core packages contain no LoL-only runtime assumptions.
- [ ] Game-specific logic lives under `/games`.
- [ ] Manual-first workflow works.
- [ ] Local-first workflow works.
- [ ] No player-side automation exists.

### Automated Verification Sign-off

- [ ] `pnpm install` passed.
- [ ] `pnpm lint` passed or unavailable with reason.
- [ ] `pnpm typecheck` passed.
- [ ] `pnpm test` passed.
- [ ] `pnpm build` passed.
- [ ] `pnpm verify` passed or equivalent command sequence passed.
- [ ] Unit tests passed.
- [ ] Integration tests passed.
- [ ] Static scope guardrail checks passed.

### Manual Rehearsal Sign-off

- [ ] Server started locally.
- [ ] Admin dashboard opened locally.
- [ ] Draft operator panel opened locally.
- [ ] Producer panel opened locally.
- [ ] Caster/read-only panel opened locally.
- [ ] Overlay app opened locally.
- [ ] Sample event loaded.
- [ ] Active sample match selected.
- [ ] Game adapter selected.
- [ ] Draft ruleset selected.
- [ ] Full manual draft completed.
- [ ] Draft overlay updated in real time.
- [ ] Score bug displayed team and score.
- [ ] Preview/Program workflow tested.
- [ ] Take/Clear workflow tested.
- [ ] Emergency overlay triggered.
- [ ] Browser source reloaded and recovered state.
- [ ] Audit log reviewed.
- [ ] Health dashboard reviewed.
- [ ] LAN/offline operation tested.

### Documentation Sign-off

- [ ] README reviewed.
- [ ] Operator guide reviewed.
- [ ] Deployment guide reviewed.
- [ ] Game adapter guide reviewed.
- [ ] Acceptance criteria reviewed.
- [ ] Known limitations documented.
- [ ] v0.1 scope documented.
- [ ] Future scope not misrepresented as v0.1.

## Verification Method

### Automated Check

- [ ] Attach or record command output summary in release handoff.
- [ ] Record commit hash or repository state identifier if available.
- [ ] Record all failed/unavailable commands honestly.

### Manual Rehearsal Check

- [ ] Perform final rehearsal with at least:
  - [ ] One control/admin browser.
  - [ ] One draft operator browser.
  - [ ] One producer browser.
  - [ ] One overlay browser-source-style view.
- [ ] Record rehearsal result in release handoff.

## Failure Conditions

- Any non-negotiable product principle fails.
- Any required v0.1 must-have feature is absent.
- Full manual draft cannot be completed.
- Overlay does not update in real time.
- Emergency mode fails.
- Audit logging fails.
- System requires internet for live show.
- No clear operator documentation exists.

---

# Next Handoff Target

The next harness file should be:

```text
docs/TASK_QUEUE.md
```

The next AI agent should generate `docs/TASK_QUEUE.md` based on:

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
docs/ACCEPTANCE_CRITERIA.md
```

The next task should convert this acceptance criteria document into a practical, ordered task queue for Codex / AI implementation agents.

The task queue should:

- [ ] Break v0.1 into ordered implementation tasks.
- [ ] Keep tasks small enough for AI agents to complete safely.
- [ ] Map each task to relevant acceptance criteria sections.
- [ ] Define dependencies between tasks.
- [ ] Mark which tasks are documentation-only, setup, core logic, server, UI, overlay, integration, tests, or rehearsal.
- [ ] Keep LoL In-game HUD, LCU reader, active runtime Data Dragon sync, OBS WebSocket, vMix, Companion, Stream Deck, SQLite, cloud sync, and player-side automation out of v0.1.
- [ ] Preserve local-first, manual-first, production-safe direction.
- [ ] End with the next recommended handoff target after `docs/TASK_QUEUE.md`.
