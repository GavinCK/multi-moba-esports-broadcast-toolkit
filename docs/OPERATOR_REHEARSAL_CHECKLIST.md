# Operator Rehearsal Checklist Harness — Multi-MOBA Esports Broadcast Toolkit v0.1

## Document Purpose

This document defines the v0.1 **Operator Rehearsal Checklist** for the **Multi-MOBA Esports Broadcast Toolkit**.

It is written for:

```text
Technical Director
Producer
Draft Operator
Graphics Operator
Caster / Read-only reviewer
Codex / AI coding agent
QA / release validation agent
```

This file is a documentation / rehearsal harness only.

It does **not** implement application code, generate test fixtures, rewrite the Technical Spec, modify existing harness files, or claim that a rehearsal has already been executed.

The purpose of this checklist is to give the next operator or agent a safe, repeatable, live-production-style rehearsal process for validating v0.1 after implementation.

---

## Source Documents

This checklist must be read together with:

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
docs/BAN_PICK_RULES.md
docs/API_SOCKET_CONTRACT.md
docs/EVENT_PACKAGE_SPEC.md
docs/OVERLAY_SPEC.md
WORKING_HANDOFF_AFTER_OVERLAY_SPEC.md
```

If this checklist conflicts with `AGENTS.md`, preserve the safer interpretation that keeps the system:

```text
game-agnostic
manual-first
local-first
production-safe
read-only for overlays
```

If this checklist conflicts with a newer user instruction, follow the newer user instruction and record the decision in the rehearsal handoff.

---

## Non-Negotiable v0.1 Principles

The rehearsal must explicitly protect these release-blocking rules:

- Universal Ban/Pick must be game-agnostic.
- LoL In-game HUD must remain a future plugin.
- Production Control must sit above both Universal Draft and game-specific plugins.
- v0.1 must be local-first, manual-first, and production-safe.
- Overlay routes must be read-only.
- No player-side automation.
- No auto-pick.
- No auto-ban.
- No hidden competitive information exposure.
- System must not require internet or cloud assets.
- System must not require OBS WebSocket or vMix API.
- System must not require LCU, Data Dragon automatic sync, game client reader, player PC software, SQLite, cloud sync, or user login.
- Dangerous live actions must be deliberate and logged.
- Missing optional assets must not crash broadcast output.
- Reconnected clients must recover current state.

---

## Rehearsal Status

This document is a checklist.

It must be marked as:

```text
NOT EXECUTED
```

until a human operator or future AI agent actually runs the implemented system against this checklist.

Do not write:

```text
passed
validated
confirmed in OBS
confirmed in vMix
confirmed offline
```

unless the rehearsal was actually performed.

---

# 1. Rehearsal Purpose and Scope

## 1.1 Purpose

The rehearsal proves whether the v0.1 toolkit behaves like a usable local-first esports broadcast system.

It validates:

```text
local server startup
sample event loading
admin dashboard visibility
draft operator workflow
producer Preview / Program workflow
caster/read-only workflow
OBS/vMix browser-source compatibility
overlay read-only behavior
draft overlay realtime updates
score bug display
emergency overlay display
Socket.IO reconnect
browser-source refresh recovery
missing asset fallback
theme and sponsor rendering
health dashboard
audit log writing
offline/no-internet operation
failure handling and rollback readiness
```

## 1.2 Scope

This checklist covers manual rehearsal of an already implemented v0.1 system.

It may be used for:

```text
TQ-130 — Create Operator Rehearsal Checklist
TQ-131 — Perform Full Local Manual Rehearsal
TQ-140 — Final v0.1 Release Validation and Handoff
```

Task IDs should be verified against the latest `docs/TASK_QUEUE.md` before use.

## 1.3 Out of Scope for This Rehearsal

Do not add or require:

```text
application code changes during rehearsal
test fixtures
LoL LCU reader
LoL champion select auto-sync
LoL Data Dragon automatic sync
LoL in-game HUD
OBS WebSocket control
vMix API control
Companion / Stream Deck integration
SQLite / Prisma
cloud sync
user login
remote asset CDN
player-side automation
auto-pick
auto-ban
hidden competitive information display
```

If a failure is found, record it. Do not hide it by adding future-scope features.

---

# 2. Roles and Stations

## 2.1 Required Roles

Minimum rehearsal roles:

| Role | Primary Responsibility | Mutation Permission |
|---|---|---|
| Technical Director / Admin | Start server, confirm LAN, health, event package, connected clients | Admin/setup mutations only where implemented |
| Draft Operator | Run manual Ban/Pick workflow | Draft mutations only |
| Producer | Control production state, Preview, Take, Clear, Emergency | Production mutations only |
| Graphics Operator | Monitor overlays, Program/Preview, asset/theme/sponsor display | Prefer read-only unless combined with Producer |
| Caster / Read-only Reviewer | Confirm public-safe read-only match/draft info | No mutation |
| OBS/vMix Operator | Open browser sources, refresh sources, confirm output safety | No app mutation from overlay routes |

One person may combine roles during a small rehearsal, but the handoff must record which roles were combined.

## 2.2 Required Stations

Minimum stations:

```text
Station A — Server / Control Machine
Station B — Admin Dashboard Browser
Station C — Draft Operator Browser
Station D — Producer / Graphics Browser
Station E — Caster / Read-only Browser
Station F — OBS/vMix Machine or Browser-source-style Browser Window
```

For a stronger LAN rehearsal, use at least two physical devices on the same LAN.

## 2.3 Role Guardrails

- Draft Operator must not control Program output.
- Producer must not secretly perform draft actions unless roles are explicitly combined.
- Caster/read-only panel must not expose mutation controls.
- Overlay routes must not expose mutation controls, even in `?debug=1`.
- OBS/vMix source refresh must not mutate draft, production, emergency, score, or audit state.
- Hidden strategy notes, private operator notes, local secrets, and stack traces must not be visible on broadcast output.

---

# 3. Pre-Rehearsal Setup

## 3.1 Repository and Documentation Readiness

Before rehearsal:

- [ ] Current repository is checked out locally.
- [ ] `AGENTS.md` exists.
- [ ] `docs/ACCEPTANCE_CRITERIA.md` exists.
- [ ] `docs/TASK_QUEUE.md` exists.
- [ ] `docs/BAN_PICK_RULES.md` exists.
- [ ] `docs/API_SOCKET_CONTRACT.md` exists.
- [ ] `docs/EVENT_PACKAGE_SPEC.md` exists.
- [ ] `docs/OVERLAY_SPEC.md` exists.
- [ ] `docs/OPERATOR_REHEARSAL_CHECKLIST.md` exists.
- [ ] Any known deployment/run guide exists, or missing guide is recorded.

## 3.2 Event Package Readiness

Verify local event package:

```text
event-packages/sample-event
```

Expected files:

- [ ] `event.json`
- [ ] `matches.json`
- [ ] `teams.json`
- [ ] `players.json`
- [ ] `sponsors.json`
- [ ] `rulesets/generic-standard.json`
- [ ] `rulesets/lol-standard.json`
- [ ] `rulesets/aov-standard.json`
- [ ] `rulesets/hok-standard.json`
- [ ] `themes/default-theme.json`
- [ ] `assets/**`
- [ ] `logs/` directory

Pass condition:

```text
Sample event can be loaded locally without internet, remote image URLs, cloud database, or hidden generated state.
```

Fail condition:

```text
Sample event requires remote assets, cloud APIs, or missing required JSON that blocks rehearsal.
```

## 3.3 Local Asset Readiness

Check that missing assets have safe local fallbacks.

- [ ] Team logo fallback exists or is built into overlay.
- [ ] Hero icon fallback exists or is built into overlay.
- [ ] Sponsor logo fallback exists or is built into overlay.
- [ ] Emergency overlay can render without event assets.
- [ ] No required route depends on CDN fonts, remote CSS, remote JS, or remote images.

## 3.4 Operator Notes

Create a rehearsal notes file before execution.

Recommended path:

```text
WORKING_HANDOFF_AFTER_REHEARSAL.md
```

or equivalent.

Record:

```text
date/time
repo commit or working tree state
machines used
IP addresses used
browser versions
OBS/vMix version if used
routes tested
commands run
pass/fail matrix
known issues
screenshots if useful
```

---

# 4. Local LAN Assumptions

## 4.1 Minimum Network Topology

The system should work with:

```text
server machine
admin/draft/producer/caster browsers
OBS/vMix machine
local LAN switch/router
no internet
```

The server may be opened through:

```text
localhost
127.0.0.1
server LAN IP, e.g. http://192.168.x.x:<port>
```

The exact port depends on implementation and must be recorded.

## 4.2 LAN Checklist

- [ ] All machines are on the same production LAN or intentionally routed VLAN.
- [ ] Server machine IP is known.
- [ ] Admin/Draft/Producer/Caster machines can reach server HTTP port.
- [ ] OBS/vMix machine can reach overlay HTTP route.
- [ ] Firewall allows local server port.
- [ ] Socket.IO path/port is reachable from other machines.
- [ ] No route requires public DNS or cloud tunnel.
- [ ] Internet can be disconnected without breaking local workflow.

## 4.3 Offline Assumption

During the offline/no-internet test:

- [ ] Do not disconnect the local LAN.
- [ ] Disconnect WAN/internet only.
- [ ] Keep local server and local browser machines connected.
- [ ] Confirm local HTTP routes still load.
- [ ] Confirm Socket.IO updates still propagate.
- [ ] Confirm local assets still render.

Fail condition:

```text
A required route, asset, socket update, or control action fails only because internet is disconnected.
```

---

# 5. Required Machines and Browser Windows

## 5.1 Minimum Browser Windows

Open at least:

| Window | Route | Role |
|---|---|---|
| Admin | `/admin` and `/admin/system-health` | TD/Admin |
| Draft Operator | `/draft` or `/draft/:matchId` | Draft Operator |
| Producer | `/producer` | Producer |
| Caster | `/caster` or `/caster/:matchId` | Read-only |
| Draft Overlay | `/overlay/draft/:matchId` | OBS/vMix/browser-source output |
| Score Bug Overlay | `/overlay/scorebug/:matchId` | OBS/vMix/browser-source output |
| Preview Overlay | `/overlay/preview` | Producer/graphics monitor |
| Program Overlay | `/overlay/program` | Program graphics output |
| Emergency Overlay | `/overlay/emergency` | Emergency source |

If the implemented app uses different exact routes, record the actual routes and compare them with the harness route expectations.

## 5.2 Debug Browser Windows

For diagnostics, also open debug versions:

```text
/overlay/draft/:matchId?debug=1
/overlay/scorebug/:matchId?debug=1
/overlay/preview?debug=1
/overlay/program?debug=1
/overlay/emergency?debug=1
```

Debug mode must not expose mutation controls or hidden competitive information.

## 5.3 OBS/vMix Browser-Source Windows

At minimum, test with ordinary Chromium browser windows sized to 1920x1080 if OBS/vMix is unavailable.

Stronger rehearsal:

```text
OBS browser source or vMix browser input
Width: 1920
Height: 1080
Custom CSS: none required
Transparent background: enabled where supported
Refresh source tested
```

Record whether rehearsal was:

```text
browser-only
OBS-tested
vMix-tested
OBS and vMix tested
```

---

# 6. Automated Verification Preconditions

Automated verification is not a replacement for manual rehearsal. It must be run before manual rehearsal where scripts exist.

## 6.1 Standard Commands

Run from repo root:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify
```

If a command does not exist, record:

```text
Unavailable — script not implemented yet.
```

Do not claim pass for unavailable commands.

## 6.2 Optional E2E / Visual Commands

If available:

```bash
pnpm test:e2e
pnpm test:guardrails
pnpm test:visual
```

If unavailable, record as unavailable.

## 6.3 Server Smoke Commands

Use actual port from implementation.

Examples:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/state
curl http://localhost:3000/api/adapters
curl http://localhost:3000/api/production/state
```

Expected:

```text
All API responses use ApiResponse<T>.
Health reports sample event, adapters, clients, asset warnings, emergency readiness, and audit log status where implemented.
State endpoint returns serializable current state.
No HTML error page is returned from API routes.
```

## 6.4 Static Scope Guardrail Checks

Run or adapt these searches where paths exist.

Universal core must not become LoL-first:

```bash
grep -R "LCU\|DataDragon\|champion-select\|summoner\|rune\|observer hud" packages/core-draft packages/core-match packages/core-production packages/shared-types || true
```

Overlay must remain read-only:

```bash
grep -R "fetch(.*POST\|axios.post\|/api/drafts/.*/start\|/api/drafts/.*/lock\|/api/production/take\|emergency:trigger" apps/overlay/src || true
```

No active future-scope dependencies in v0.1 runtime:

```bash
grep -R "obs-websocket\|vmix\|sqlite\|prisma\|cloud sync\|DataDragon sync\|LCU reader" apps packages games || true
```

Any match must be reviewed. Acceptable matches are documentation, comments describing forbidden/future scope, or non-executed tests. Active runtime dependencies are rehearsal blockers.

## 6.5 Audit Log JSONL Parse Check

If `production-log.jsonl` exists after rehearsal:

```bash
node -e "const fs=require('fs'); const p='event-packages/sample-event/logs/production-log.jsonl'; if(fs.existsSync(p)){ for(const line of fs.readFileSync(p,'utf8').split(/\n/).filter(Boolean)) JSON.parse(line); console.log('audit-log-jsonl-ok'); } else { console.log('audit-log-not-found'); }"
```

Pass:

```text
Existing JSONL lines parse as valid JSON.
```

Fail:

```text
Audit log line is malformed, missing for important actions, or impossible to access from health/audit review.
```

---

# 7. Server Startup Checklist

## 7.1 Startup

- [ ] Confirm dependencies installed or install command succeeds.
- [ ] Start server using documented command.
- [ ] Start admin dashboard using documented command if separate.
- [ ] Start overlay app using documented command if separate.
- [ ] Record all actual URLs and ports.
- [ ] Confirm no cloud service, remote database, login provider, or internet service is required.

Example record:

```text
Server URL:
Admin URL:
Overlay URL:
Socket.IO URL/path:
Event package path:
```

## 7.2 Health After Startup

Open:

```text
GET /api/health
/admin/system-health
```

Verify:

- [ ] Server uptime visible.
- [ ] Loaded event package visible.
- [ ] Current production state visible.
- [ ] Adapter status visible.
- [ ] Asset warnings visible.
- [ ] Emergency readiness visible.
- [ ] Audit log path/writable status visible.
- [ ] Connected clients count updates as browser windows connect.
- [ ] No critical health failure before rehearsal starts.

Fail if:

```text
Server starts but cannot load sample event.
Health endpoint is missing or returns inconsistent shape.
Audit log is not writable and important actions cannot be logged.
Adapters fail in a way that blocks sample draft.
```

---

# 8. Admin Dashboard Checklist

Open:

```text
/admin
/admin/system-health
/admin/matches
/admin/teams
/admin/players
/admin/sponsors
/admin/themes
```

If routes differ, record actual routes.

Verify:

- [ ] Active event is visible.
- [ ] Sample match is visible.
- [ ] Blue/red teams are visible.
- [ ] Current score is visible.
- [ ] Current game number is visible.
- [ ] Available game adapters are visible.
- [ ] Selected game code/ruleset is visible.
- [ ] Theme is visible.
- [ ] Sponsors are visible.
- [ ] Production state is visible.
- [ ] Emergency status is visible.
- [ ] Connected clients are visible.
- [ ] Asset warnings are visible.
- [ ] Audit log status is visible.

Admin mutation checks, if implemented:

- [ ] Dangerous active match switch requires confirmation.
- [ ] Dangerous setup changes during live state are blocked or require confirmation.
- [ ] Invalid setup selection gives clear error.
- [ ] No hidden competitive information is exposed on public/read-only views.

Pass:

```text
TD/Admin can confirm event, match, adapters, theme, assets, clients, health, and emergency readiness before live rehearsal.
```

Fail:

```text
Admin cannot identify the active match/game/ruleset or cannot see critical health/audit failures.
```

---

# 9. Draft Operator Checklist

Open:

```text
/draft
/draft/:matchId
/draft/:matchId/game/:gameNumber
```

Use actual implemented route.

Verify visible before starting:

- [ ] Current match.
- [ ] Current game number.
- [ ] Game adapter / game code.
- [ ] Ruleset ID/name.
- [ ] Blue team.
- [ ] Red team.
- [ ] Draft status.
- [ ] Current phase.
- [ ] Current active side/team.
- [ ] Timer.
- [ ] Hero search/list/grid.
- [ ] Ban slots.
- [ ] Pick slots.
- [ ] Start control.
- [ ] Pause control.
- [ ] Resume control.
- [ ] Hover action.
- [ ] Lock action.
- [ ] Undo control.
- [ ] Reset control with confirmation.
- [ ] Complete control with confirmation.
- [ ] Invalid action feedback.

Guardrails:

- [ ] No auto-pick is available.
- [ ] No auto-ban is available.
- [ ] Timer expiry does not auto-lock or auto-advance a pick/ban.
- [ ] Draft operator actions are manual and deliberate.
- [ ] Duplicate hero is blocked when ruleset disallows duplicates.
- [ ] Dangerous actions require confirmation/reason where required.

---

# 10. Producer Panel Checklist

Open:

```text
/producer
```

or actual implementation route.

Verify:

- [ ] Current match is visible.
- [ ] Current production state is visible.
- [ ] Production state controls are visible where implemented.
- [ ] Preview graphic control is visible.
- [ ] Take to Program requires deliberate operator action.
- [ ] Clear Program requires deliberate operator action.
- [ ] Emergency trigger requires confirmation.
- [ ] Emergency clear requires confirmation or deliberate action.
- [ ] Preview payload state is visible.
- [ ] Program payload state is visible.
- [ ] Overlay/health summary or link is available.
- [ ] Producer actions are logged.

Guardrails:

- [ ] Producer panel does not auto-take draft updates to Program.
- [ ] Emergency does not expose internal notes or technical stack traces.
- [ ] Producer controls are not embedded inside overlay routes.
- [ ] No OBS WebSocket/vMix API is required for Take/Clear.
- [ ] Program and Preview remain state-separated.

---

# 11. Caster / Read-only Panel Checklist

Open:

```text
/caster
/caster/:matchId
```

or actual implementation route.

Verify:

- [ ] Match title visible.
- [ ] Team names visible.
- [ ] Score visible.
- [ ] Current game number visible.
- [ ] Public draft status visible where intended.
- [ ] Picks/bans visible where intended.
- [ ] No hidden notes or private competitive data visible.
- [ ] No mutation controls exist.
- [ ] No Take/Clear/Emergency controls exist.
- [ ] Refresh/reconnect recovers current state.

Pass:

```text
Caster/read-only panel gives public-safe context without mutation controls.
```

Fail:

```text
Caster panel can mutate draft/production state or exposes private/hidden information.
```

---

# 12. OBS/vMix Browser-Source Checklist

## 12.1 Browser Source Setup

For each overlay route tested in OBS/vMix or browser-only mode:

- [ ] Use local URL.
- [ ] Set width 1920.
- [ ] Set height 1080.
- [ ] Do not rely on custom CSS to hide scrollbars.
- [ ] Do not require OBS WebSocket.
- [ ] Do not require vMix API.
- [ ] Confirm transparent background where route should be transparent.
- [ ] Confirm no scrollbars.
- [ ] Confirm layout stays within safe margins.
- [ ] Confirm text overflow is safe.
- [ ] Confirm missing image does not show broken image icon on-air.
- [ ] Confirm route can be refreshed without mutating state.

## 12.2 Browser Source Refresh Test

For each required route:

```text
/overlay/draft/:matchId
/overlay/scorebug/:matchId
/overlay/preview
/overlay/program
/overlay/emergency
```

Do:

- [ ] Refresh browser source.
- [ ] Confirm route reconnects to Socket.IO.
- [ ] Confirm latest state is restored.
- [ ] Confirm no duplicate mutation occurs.
- [ ] Confirm no white screen.
- [ ] Confirm no developer stack trace in standard mode.
- [ ] Confirm debug mode only appears with `?debug=1`.

---

# 13. Overlay Route Checklist

## 13.1 `/overlay/draft/:matchId`

Verify:

- [ ] Event/match title shown where layout allows.
- [ ] Blue team name/shortName shown.
- [ ] Red team name/shortName shown.
- [ ] Team logos or fallback shown.
- [ ] Blue bans shown.
- [ ] Red bans shown.
- [ ] Blue picks shown.
- [ ] Red picks shown.
- [ ] Current timer shown.
- [ ] Current phase label shown.
- [ ] Active team/side shown.
- [ ] Hovered hero shown as hover, not locked.
- [ ] Locked hero shown as final lock.
- [ ] Empty/pending slots shown safely.
- [ ] Sponsor slot shown if configured.
- [ ] Theme styling applied.
- [ ] Missing hero icon fallback works.
- [ ] Completed draft remains readable.
- [ ] Unknown matchId gives safe fallback.
- [ ] `?debug=1` shows route, matchId, socket status, revision/timestamp where available.
- [ ] No mutation controls exist.

## 13.2 `/overlay/scorebug/:matchId`

Verify:

- [ ] Blue/left team name or shortName shown.
- [ ] Red/right team name or shortName shown.
- [ ] Team logos or fallback shown.
- [ ] Current match score shown.
- [ ] Current game number shown where available.
- [ ] Event/match context shown where layout allows.
- [ ] Theme colors applied.
- [ ] Missing score uses safe placeholder.
- [ ] No LoL in-game HUD telemetry appears.
- [ ] No live game client dependency exists.
- [ ] No mutation controls exist.

## 13.3 `/overlay/preview`

Verify:

- [ ] Preview payload renders when prepared.
- [ ] Transparent standby when no preview payload exists.
- [ ] Preview does not render Program-only payload.
- [ ] Preview does not Take itself to Program.
- [ ] Emergency active state is visible in debug or documented behavior.
- [ ] Debug mode is useful but read-only.

## 13.4 `/overlay/program`

Verify:

- [ ] Program payload renders only after Take.
- [ ] Transparent standby when Program is clear and emergency inactive.
- [ ] Program does not render Preview payload before Take.
- [ ] Program honors emergency override according to overlay spec.
- [ ] Unsupported graphic type fails safely.
- [ ] Program route does not perform Take/Clear itself.

## 13.5 `/overlay/emergency`

Verify inactive state:

- [ ] Standard mode is transparent standby.
- [ ] Debug mode shows inactive state and socket status.

Verify active state:

- [ ] Full-screen emergency message appears.
- [ ] Message is public-safe.
- [ ] Emergency graphic is readable.
- [ ] Works even if match/draft/team/sponsor/theme assets are missing.
- [ ] Clear emergency restores normal display.
- [ ] No mutation controls exist on emergency overlay route.

---

# 14. Sample Event Loading Checklist

## 14.1 Load Sample Event

From Admin or startup defaults:

- [ ] Load `event-packages/sample-event`.
- [ ] Confirm event name.
- [ ] Confirm default match ID.
- [ ] Confirm BO3 match exists.
- [ ] Confirm two teams exist.
- [ ] Confirm at least five players per team if player panel is expected.
- [ ] Confirm sponsors exist.
- [ ] Confirm default theme exists.
- [ ] Confirm rulesets exist or adapter-provided rulesets are visible.
- [ ] Confirm Generic, LoL sample, AOV, HoK adapters are loaded or documented.
- [ ] Confirm no event package field requires remote URL.
- [ ] Confirm audit log path points inside package logs folder.

## 14.2 Ruleset / Adapter Selection

Test at least:

- [ ] Generic MOBA ruleset.
- [ ] LoL sample ruleset through generic DraftRuleset model.
- [ ] One non-LoL adapter/ruleset if implemented and available.

Pass:

```text
System can run at least one complete manual draft and can show that architecture is not LoL-only.
```

Fail:

```text
Only LoL hardcoded draft path works, or non-LoL adapter cannot be loaded without code changes.
```

---

# 15. Full Manual Draft Rehearsal Steps

Use one sample match and one sample game.

Record:

```text
matchId:
gameId:
draftId:
gameCode:
rulesetId:
blueTeamId:
redTeamId:
operatorId:
```

## 15.1 Draft Start

- [ ] Confirm draft status is `READY` or documented pre-start state.
- [ ] Confirm overlay shows empty slots.
- [ ] Click Start Draft from Draft Operator panel.
- [ ] Confirm draft status becomes `LIVE`.
- [ ] Confirm timer starts if phase time > 0.
- [ ] Confirm current phase index/label shown.
- [ ] Confirm active side shown.
- [ ] Confirm `DRAFT_STARTED` or equivalent audit log exists.
- [ ] Confirm overlay updates without manual refresh.

Fail if:

```text
Draft starts automatically without operator action.
Overlay requires refresh for ordinary start update.
Audit log does not record start.
```

## 15.2 Hover Check

For the first available action slot:

- [ ] Search/select a hero.
- [ ] Hover hero.
- [ ] Confirm Draft Operator panel shows HOVER.
- [ ] Confirm draft overlay shows hover treatment.
- [ ] Confirm hover is not shown as final lock.
- [ ] Confirm hover does not add hero to locked/picked/banned arrays.
- [ ] Confirm Socket.IO update reaches other clients.
- [ ] Confirm audit log behavior matches implementation contract.

Fail if:

```text
Hover locks the hero, advances phase, or is treated as final pick/ban.
```

## 15.3 Lock Ban Check

For a BAN slot:

- [ ] Lock the hovered or selected hero.
- [ ] Confirm slot status becomes LOCKED.
- [ ] Confirm hero appears in correct team ban area.
- [ ] Confirm phase advances only when the phase is complete.
- [ ] Confirm locked hero is visually distinct from hover.
- [ ] Confirm duplicate blocking now prevents selecting same hero if duplicates disabled.
- [ ] Confirm overlay updates in realtime.
- [ ] Confirm audit log records `HERO_LOCKED` or equivalent with BAN type/team/actionId/heroId.

Fail if:

```text
Wrong team receives ban, duplicate blocking fails, or phase advances before count > 1 phase is complete.
```

## 15.4 Lock Pick Check

For a PICK slot:

- [ ] Hover/select hero.
- [ ] Lock hero.
- [ ] Confirm slot status becomes LOCKED.
- [ ] Confirm hero appears in correct team pick area.
- [ ] Confirm picked hero is added to picked/locked state.
- [ ] Confirm overlay updates in realtime.
- [ ] Confirm score bug remains stable.
- [ ] Confirm audit log records lock with PICK type/team/actionId/heroId.

## 15.5 Phase Count > 1 Check

For a phase with `count > 1`, if ruleset includes one:

- [ ] Lock first slot.
- [ ] Confirm phase does not advance while second slot is still pending.
- [ ] Lock second slot.
- [ ] Confirm phase advances only after all slots complete.
- [ ] Undo second slot.
- [ ] Confirm phase returns/remains correct and first slot remains locked.

If no `count > 1` phase exists in the selected ruleset, record:

```text
Not tested — selected ruleset did not include count > 1.
```

## 15.6 Timer Expiry Check

During a live phase:

- [ ] Let timer reach zero or simulate only if implementation supports safe timer control.
- [ ] Confirm remaining time shows 0 / expired / overtime state.
- [ ] Confirm no auto-pick occurs.
- [ ] Confirm no auto-ban occurs.
- [ ] Confirm no phase advances solely because timer reached zero.
- [ ] Confirm operator can still manually resolve next action according to rules.

Fail if:

```text
Timer expiry automatically locks, bans, picks, or advances draft without operator action.
```

## 15.7 Pause Check

- [ ] Click Pause.
- [ ] Confirm draft status becomes `PAUSED`.
- [ ] Confirm timer freezes.
- [ ] Confirm hover/lock are rejected by default while paused, unless explicit manual override is documented.
- [ ] Confirm overlay shows paused/timer state.
- [ ] Confirm audit log records pause.
- [ ] Confirm Socket.IO update reaches clients.

## 15.8 Resume Check

- [ ] Click Resume.
- [ ] Confirm draft status becomes `LIVE`.
- [ ] Confirm same phase remains active.
- [ ] Confirm same incomplete slots remain.
- [ ] Confirm timer resumes from saved remaining time.
- [ ] Confirm overlay updates.
- [ ] Confirm audit log records resume.

Fail if:

```text
Resume resets full draft, changes phase incorrectly, or silently clears slots.
```

## 15.9 Undo Check

After at least one lock:

- [ ] Click Undo.
- [ ] Confirm confirmation/reason appears if required.
- [ ] Confirm latest reversible locked action is undone.
- [ ] Confirm slot returns to PENDING or documented state.
- [ ] Confirm hero removed from locked/picked/banned arrays.
- [ ] Confirm current phase recalculates correctly.
- [ ] Confirm overlay rolls back.
- [ ] Confirm audit log records undo with reason/operator.

Fail if:

```text
Undo corrupts action order, removes wrong action, or does not broadcast update.
```

## 15.10 Reset Check

Reset is dangerous. Perform only after confirming rehearsal sequence permits it.

- [ ] Click Reset.
- [ ] Confirm reset requires deliberate confirmation.
- [ ] Confirm reason/confirmation text required if implemented.
- [ ] Confirm draft returns to READY.
- [ ] Confirm all action slots clear.
- [ ] Confirm locked/picked/banned arrays clear.
- [ ] Confirm timer resets to first phase.
- [ ] Confirm overlay returns to empty draft layout.
- [ ] Confirm audit log records reset.
- [ ] Confirm historical JSONL audit entries are not deleted.

Fail if:

```text
Reset can be triggered accidentally or audit log is erased.
```

## 15.11 Complete Draft Check

Run a draft through all required slots, then:

- [ ] Confirm all required slots are complete.
- [ ] Click Complete.
- [ ] Confirm completion requires deliberate action/confirmation.
- [ ] Confirm draft status becomes `COMPLETE`.
- [ ] Confirm overlay keeps final picks/bans visible.
- [ ] Confirm timer is no longer shown as actively live.
- [ ] Confirm audit log records completion.
- [ ] Confirm no winner is inferred automatically.

If trying to complete an incomplete draft:

- [ ] Confirm incomplete completion is rejected, or explicit override reason/confirmation is required.

Fail if:

```text
Draft completes automatically, completes incomplete draft without explicit override, or hides final picks/bans.
```

---

# 16. Preview / Program Take-Clear Checks

## 16.1 Preview Draft Graphic

From Producer panel:

- [ ] Prepare/Preview draft graphic.
- [ ] Confirm `/overlay/preview` shows preview payload.
- [ ] Confirm `/overlay/program` does not show preview payload yet.
- [ ] Confirm audit log records preview if required.
- [ ] Confirm Preview route is read-only.

## 16.2 Take to Program

- [ ] Click Take.
- [ ] Confirm Take is deliberate and confirmed where required.
- [ ] Confirm `/overlay/program` shows taken graphic.
- [ ] Confirm `/overlay/preview` remains preview or follows documented state.
- [ ] Confirm audit log records `GRAPHICS_TAKEN` or equivalent.
- [ ] Confirm no OBS/vMix API was required.

Fail if:

```text
Preview auto-goes to Program without Take.
Overlay route itself performs Take.
Take is not logged.
```

## 16.3 Clear Program

- [ ] Click Clear Program.
- [ ] Confirm Clear is deliberate.
- [ ] Confirm `/overlay/program` returns to transparent standby.
- [ ] Confirm `/overlay/preview` behavior matches documented workflow.
- [ ] Confirm audit log records clear.
- [ ] Confirm direct draft route still renders draft if opened separately.

Fail if:

```text
Clear erases draft state, resets match state, or requires OBS/vMix API.
```

---

# 17. Emergency Trigger-Clear Checks

## 17.1 Trigger Emergency

From Producer/Admin panel only:

- [ ] Trigger emergency mode.
- [ ] Confirm confirmation is required.
- [ ] Use public-safe message, e.g. `Technical Pause`.
- [ ] Confirm `/overlay/emergency` shows full-screen emergency.
- [ ] Confirm `/overlay/program` honors emergency override if documented.
- [ ] Confirm draft/scorebug behavior matches documented convention.
- [ ] Confirm emergency renders even if draft/match assets are unavailable.
- [ ] Confirm audit log records emergency trigger.
- [ ] Confirm health dashboard shows emergency active.

Fail if:

```text
Emergency can be triggered by overlay, emergency exposes internal notes, or emergency fails because normal draft assets are missing.
```

## 17.2 Clear Emergency

- [ ] Clear emergency from Producer/Admin panel.
- [ ] Confirm deliberate action/confirmation where required.
- [ ] Confirm `/overlay/emergency` returns to standby.
- [ ] Confirm `/overlay/program` returns to previous/cleared documented state.
- [ ] Confirm health dashboard shows emergency inactive.
- [ ] Confirm audit log records emergency clear.

---

# 18. Socket.IO Reconnect Checks

## 18.1 Overlay Reconnect

For each overlay route:

- [ ] Open route.
- [ ] Confirm connected state in debug mode.
- [ ] Perform draft/production action.
- [ ] Confirm route updates.
- [ ] Refresh browser.
- [ ] Confirm route receives latest `state:full` or equivalent.
- [ ] Confirm no stale state remains.
- [ ] Confirm no mutation occurs on reconnect.

## 18.2 Dashboard Reconnect

- [ ] Open admin/draft/producer/caster panels.
- [ ] Temporarily stop server or disconnect network only if safe in rehearsal.
- [ ] Confirm clients show disconnected state.
- [ ] Restart/reconnect server.
- [ ] Confirm clients recover latest full state.
- [ ] Confirm clients do not pretend stale state is live.

Record if server restart recovery is not supported:

```text
Server restart persistence not supported in v0.1; clients should still show disconnected/reconnected state honestly.
```

Fail if:

```text
Client reconnects with stale state and no warning, or overlay needs manual full reset after normal reconnect.
```

---

# 19. Browser-Source Refresh Checks

For OBS/vMix/browser-source route:

- [ ] Refresh `/overlay/draft/:matchId`.
- [ ] Refresh `/overlay/scorebug/:matchId`.
- [ ] Refresh `/overlay/preview`.
- [ ] Refresh `/overlay/program`.
- [ ] Refresh `/overlay/emergency`.

Verify each:

- [ ] No white screen.
- [ ] No stack trace in standard mode.
- [ ] Latest state returns.
- [ ] No duplicate audit log entry from refresh.
- [ ] No mutation API/socket event emitted.
- [ ] Debug mode shows route/connection/timestamp only when requested.

---

# 20. Missing Asset Fallback Checks

Perform controlled missing-asset rehearsal only if safe and reversible.

Options:

```text
Use preconfigured sample missing asset.
Temporarily point a sample team/sponsor/hero to a missing local path.
Use a test package variant if one exists.
```

Do not permanently damage real event package data.

Verify:

- [ ] Missing team logo uses fallback.
- [ ] Missing hero icon uses fallback.
- [ ] Missing sponsor logo uses fallback.
- [ ] Missing theme background/frame uses fallback.
- [ ] Emergency overlay still renders.
- [ ] Health/assets endpoint or dashboard reports warning.
- [ ] Standard overlay does not show broken image icon.
- [ ] Standard overlay does not crash.
- [ ] Debug mode shows useful missing asset warning.

Fail if:

```text
Missing optional asset crashes route, creates white screen, or fetches remote fallback.
```

---

# 21. Theme and Sponsor Checks

## 21.1 Theme

- [ ] Default theme loads.
- [ ] Safe margins applied.
- [ ] 1920x1080 layout stable.
- [ ] Transparent background used where appropriate.
- [ ] No scrollbars.
- [ ] Long team names fail gracefully.
- [ ] Theme does not require remote font/CSS/image.

## 21.2 Sponsor

- [ ] Sponsor data loads from local `sponsors.json`.
- [ ] Sponsor logo path is local/relative.
- [ ] Draft sponsor slot renders when configured.
- [ ] Score bug sponsor slot renders only if supported/configured.
- [ ] Missing sponsor logo uses fallback.
- [ ] No time-based sponsor rotation is required.
- [ ] No cloud ad serving or analytics beacon exists.

Fail if:

```text
Sponsor rendering depends on remote ad service or hidden scheduling automation.
```

---

# 22. Health Dashboard Checks

Open:

```text
/admin/system-health
GET /api/health
GET /api/health/assets
GET /api/health/clients
```

Where implemented.

Verify:

- [ ] Server status visible.
- [ ] Loaded event package visible.
- [ ] Adapter status visible.
- [ ] Socket client list visible.
- [ ] Admin/Draft/Producer/Caster/Overlay clients identify roles/routes where supported.
- [ ] Asset warnings visible.
- [ ] Audit log writable status visible.
- [ ] Emergency ready/active status visible.
- [ ] Offline/no-internet state does not produce false cloud failure.
- [ ] Health warnings are readable to TD.

Fail if:

```text
TD cannot detect disconnected overlays, missing assets, audit failure, or emergency state.
```

---

# 23. Audit Log Checks

Review:

```text
event-packages/sample-event/logs/production-log.jsonl
```

or actual configured audit path.

Important actions to confirm:

- [ ] Draft created/loaded if logged.
- [ ] Draft started.
- [ ] Draft paused.
- [ ] Draft resumed.
- [ ] Hero hovered if logging hover is enabled.
- [ ] Hero locked.
- [ ] Undo.
- [ ] Reset.
- [ ] Complete.
- [ ] Production state change.
- [ ] Graphics preview.
- [ ] Graphics take.
- [ ] Graphics clear.
- [ ] Emergency trigger.
- [ ] Emergency clear.
- [ ] Invalid dangerous action rejection where logged.

Verify log entries:

- [ ] Append-only behavior.
- [ ] JSONL lines parse.
- [ ] ISO timestamps.
- [ ] Operator ID or local-operator fallback.
- [ ] Action type.
- [ ] Draft ID / match ID / action ID where relevant.
- [ ] Reason/confirmation for dangerous actions where relevant.
- [ ] No secrets.
- [ ] No hidden competitive information.
- [ ] No stack traces in normal audit output.

Fail if:

```text
Important live actions are not logged, log lines are invalid JSON, or reset deletes logs.
```

---

# 24. Offline / No-Internet Checks

## 24.1 Before Disconnecting Internet

- [ ] Confirm LAN clients are connected.
- [ ] Confirm current draft state is known.
- [ ] Confirm overlay routes load.
- [ ] Confirm local server IP is reachable.
- [ ] Confirm no rehearsal step depends on public URL.

## 24.2 Disconnect Internet, Keep LAN

- [ ] Disconnect WAN/internet.
- [ ] Keep local LAN active.
- [ ] Keep server running.

Verify:

- [ ] Admin dashboard still loads.
- [ ] Draft operator panel still loads.
- [ ] Producer panel still loads.
- [ ] Caster/read-only panel still loads.
- [ ] Overlay routes still load.
- [ ] Socket.IO updates still work.
- [ ] Local assets still render.
- [ ] Draft hover/lock still works.
- [ ] Preview/Take/Clear still works.
- [ ] Emergency trigger/clear still works.
- [ ] Audit log still writes.
- [ ] No route blocks because of cloud auth/CDN/remote asset.

Fail if:

```text
A required v0.1 workflow fails solely because internet is disconnected.
```

---

# 25. Failure Handling and Rollback Notes

## 25.1 During Rehearsal

When a failure occurs:

- [ ] Record exact step.
- [ ] Record expected behavior.
- [ ] Record actual behavior.
- [ ] Record route/URL.
- [ ] Record browser/OBS/vMix used.
- [ ] Record server console error if visible.
- [ ] Record API response if relevant.
- [ ] Record socket/client disconnected state if relevant.
- [ ] Record audit log status.
- [ ] Do not hide or bypass failure with out-of-scope feature.
- [ ] Do not mark the item passed.

## 25.2 Safe Rollback Actions

Allowed rollback/recovery actions in rehearsal:

```text
Refresh browser source.
Reconnect Socket.IO by page refresh.
Clear Program from Producer panel.
Clear Emergency from Producer/Admin panel.
Undo last draft action with confirmation/reason.
Reset draft with confirmation/reason.
Restart dev server if rehearsal scope allows, then record recovery behavior.
Restore original sample event file from version control if missing-asset test changed it.
```

Disallowed recovery actions:

```text
Manually editing runtime state to fake a pass.
Deleting audit log to hide failure.
Adding remote CDN assets to fix local fallback.
Using OBS WebSocket/vMix API to bypass missing Program/Clear state.
Using LoL client data to bypass manual draft.
```

## 25.3 Rollback Handoff

For every rollback:

```text
Rollback action:
Reason:
Who approved:
State before:
State after:
Audit entry created:
Issue remains:
Follow-up task:
```

---

# 26. Pass / Fail Criteria

## 26.1 Global Pass Criteria

The full rehearsal passes only if all of these are true:

- [ ] Automated verification commands pass, or unavailable commands are honestly documented.
- [ ] Server starts locally.
- [ ] Sample event package loads.
- [ ] Admin dashboard can inspect event/match/health.
- [ ] Draft Operator can complete a full manual draft.
- [ ] Hover is distinct from lock.
- [ ] Ban and pick locks update the correct slots.
- [ ] Timer can pause/resume.
- [ ] Timer expiry does not auto-pick or auto-ban.
- [ ] Undo works and broadcasts state.
- [ ] Reset requires confirmation.
- [ ] Complete requires deliberate action and final draft remains visible.
- [ ] Producer Preview/Take/Clear works without OBS WebSocket/vMix API.
- [ ] Emergency trigger/clear works and is public-safe.
- [ ] Draft overlay updates in realtime.
- [ ] Score bug displays team and score.
- [ ] Program/Preview overlays remain separated.
- [ ] Overlay routes are read-only.
- [ ] Browser-source refresh recovers latest state.
- [ ] Socket.IO reconnect recovers latest state.
- [ ] Missing assets show local fallbacks.
- [ ] Theme and sponsor display work locally.
- [ ] Health dashboard shows useful state/client/asset/audit information.
- [ ] Important actions are written to append-only JSONL.
- [ ] Workflow works on local LAN with internet disconnected.
- [ ] No hidden competitive information is exposed.
- [ ] No v0.1 out-of-scope feature is required for a pass.

## 26.2 Blocker Fail Criteria

Any one of these blocks v0.1 acceptance:

```text
System requires internet/cloud to run required workflow.
System requires OBS WebSocket/vMix API for Preview/Program.
System requires player-side software.
System performs auto-pick or auto-ban.
Timer expiry auto-locks a hero.
Universal draft core is LoL-first.
Overlay route can mutate live state.
Overlay exposes hidden competitive information.
Full manual draft cannot complete.
Emergency overlay cannot display.
Socket reconnect cannot recover current state.
Browser-source refresh causes mutation or stale on-air state.
Important live actions are not logged.
Audit log is not append-only or not parseable.
Missing optional asset crashes overlay.
Health dashboard cannot show critical failures.
```

## 26.3 Conditional Pass

A conditional pass may be recorded only if:

```text
The issue is not a v0.1 release blocker.
The issue has a documented workaround.
The workaround does not use out-of-scope features.
The issue is logged as a follow-up task.
TD/Producer accepts the limitation.
```

Example conditional pass:

```text
vMix was not available; OBS and Chromium browser-source-style test passed. vMix-specific test remains pending.
```

Not acceptable conditional pass:

```text
Emergency overlay failed, but OBS WebSocket scene switch can cover output.
```

---

# 27. Handoff Format After Rehearsal

After executing this checklist, create a rehearsal handoff.

Recommended filename:

```text
WORKING_HANDOFF_AFTER_REHEARSAL.md
```

Minimum format:

```text
# Working Handoff — After Manual Operator Rehearsal

## Rehearsal Status
PASS / FAIL / CONDITIONAL PASS / NOT EXECUTED

## Date / Environment
Date:
Repo commit:
Machine(s):
Operating system:
Browsers:
OBS/vMix version:
Server URL:
Admin URL:
Overlay URL:
Internet connected during main test:
Offline test performed:

## Source Documents Used
- AGENTS.md
- docs/ACCEPTANCE_CRITERIA.md
- docs/TASK_QUEUE.md
- docs/BAN_PICK_RULES.md
- docs/API_SOCKET_CONTRACT.md
- docs/EVENT_PACKAGE_SPEC.md
- docs/OVERLAY_SPEC.md
- docs/OPERATOR_REHEARSAL_CHECKLIST.md

## Commands Run
| Command | Result | Notes |
|---|---|---|

## Routes Tested
| Route | Result | Notes |
|---|---|---|

## Manual Rehearsal Result
| Area | PASS/FAIL/NA | Notes |
|---|---|---|
| Server startup | | |
| Admin dashboard | | |
| Draft operator | | |
| Producer panel | | |
| Caster/read-only | | |
| Draft overlay | | |
| Score bug overlay | | |
| Preview/Program | | |
| Emergency | | |
| Socket reconnect | | |
| Browser refresh | | |
| Missing asset fallback | | |
| Theme/sponsor | | |
| Health dashboard | | |
| Audit log | | |
| Offline LAN | | |
| Scope guardrails | | |

## Issues Found
| ID | Severity | Area | Expected | Actual | Repro Steps | Suggested Fix Task |
|---|---|---|---|---|---|---|

## Blockers
- ...

## Non-Blocking Limitations
- ...

## Scope Guardrails Checked
- No auto-pick:
- No auto-ban:
- No player-side automation:
- No OBS WebSocket/vMix API required:
- No cloud/internet required:
- Overlay routes read-only:
- No LoL in-game HUD:
- No LCU/Data Dragon sync:

## Final Decision
v0.1 accepted / not accepted / conditional.

## Suggested Next Task
- ...
```

---

# 28. Out-of-Scope Guardrails for Rehearsal Agents

Rehearsal agents must not:

```text
write application code as part of this checklist task
generate fixtures unless explicitly requested
modify AGENTS.md
modify Technical Spec
modify ACCEPTANCE_CRITERIA.md
modify TASK_QUEUE.md
modify BAN_PICK_RULES.md
modify API_SOCKET_CONTRACT.md
modify EVENT_PACKAGE_SPEC.md
modify OVERLAY_SPEC.md
claim rehearsal was executed if it was only documented
mark failures as passed
add cloud fallback
add remote asset fallback
add OBS WebSocket/vMix API dependency
add LCU reader
add Data Dragon automatic sync
add LoL in-game HUD
add player-side automation
add auto-pick
add auto-ban
add hidden competitive information channels
add user login as required runtime dependency
add SQLite/Prisma database dependency
```

If a coding agent believes one of these is necessary, it must stop, record the conflict, and request explicit user scope change.

---

# 29. Final Operator Checklist Summary

Before calling the rehearsal complete, confirm:

- [ ] All required roles/stations were represented or combinations recorded.
- [ ] Automated commands were run or unavailable items documented.
- [ ] Server and panels started locally.
- [ ] Sample event loaded.
- [ ] Full manual draft completed.
- [ ] Hover/lock/pause/resume/undo/reset/complete were tested.
- [ ] Preview/Program Take/Clear were tested.
- [ ] Emergency trigger/clear were tested.
- [ ] Overlay routes were tested.
- [ ] OBS/vMix/browser-source behavior was tested.
- [ ] Socket reconnect was tested.
- [ ] Browser-source refresh was tested.
- [ ] Missing asset fallback was tested.
- [ ] Theme/sponsor rendering was tested.
- [ ] Health dashboard was reviewed.
- [ ] Audit log was reviewed.
- [ ] Offline/no-internet workflow was tested.
- [ ] Pass/fail decision was recorded honestly.
- [ ] Follow-up tasks were listed.
- [ ] No out-of-scope v0.1 feature was introduced or required.
