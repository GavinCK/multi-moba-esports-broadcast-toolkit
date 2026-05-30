# Overlay Spec Harness — Multi-MOBA Esports Broadcast Toolkit v0.1

## Document Purpose

This document defines the v0.1 **OBS/vMix browser-source overlay** contract for the **Multi-MOBA Esports Broadcast Toolkit**.

It is written for Codex / AI coding agents before they implement:

```text
apps/overlay/**
packages/core-overlay/**
packages/theme-engine/**
apps/server/src/socket/**
apps/server/src/state/**
```

This is a documentation / harness planning file only.

It does **not** implement application code, generate fixtures, rewrite the Technical Spec, or modify existing harness documents.

The purpose of this file is to remove ambiguity before overlay implementation tasks are executed, especially:

```text
TQ-090 — Create Overlay App Shell, Socket Client, and Debug Mode
TQ-091 — Implement Draft Overlay
TQ-092 — Implement Score Bug Overlay
TQ-093 — Implement Program, Preview, and Emergency Overlays
```

Task IDs should be verified against the current `docs/TASK_QUEUE.md` before execution because numbering may evolve.

---

## Source Documents

This document must be read together with:

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
docs/BAN_PICK_RULES.md
docs/API_SOCKET_CONTRACT.md
docs/EVENT_PACKAGE_SPEC.md
WORKING_HANDOFF_AFTER_EVENT_PACKAGE_SPEC.md
```

If this document conflicts with a newer user instruction, follow the latest user instruction and record the decision in the handoff.

If this document conflicts with `AGENTS.md`, preserve the safer interpretation that keeps the system:

```text
game-agnostic
manual-first
local-first
production-safe
read-only for broadcast outputs
```

---

## Non-Negotiable v0.1 Principles

The overlay layer must preserve these release-blocking rules:

- Universal Ban/Pick must remain game-agnostic.
- LoL In-game HUD must remain a future plugin.
- Production Control must sit above both Universal Draft and game-specific plugins.
- v0.1 must be local-first, manual-first, and production-safe.
- Overlay routes must be read-only.
- No player-side automation.
- No auto-pick.
- No auto-ban.
- No hidden competitive information exposure.
- Overlays must not require internet, CDN assets, cloud services, user login, SQLite, Prisma, OBS WebSocket, vMix API, Companion, Stream Deck, LCU, Data Dragon, or player-PC software.
- Overlays must recover current state after browser refresh or Socket.IO reconnect.
- Missing optional assets must not crash broadcast output.

---

# 1. Overlay Design Principles

## 1.1 Broadcast Output, Not Control Surface

Overlay routes are program/preview/browser-source outputs.

They may:

```text
render current state
render draft information
render score bug information
render emergency state
render preview/program graphics
render local assets
render fallback placeholders
show debug diagnostics when ?debug=1 is present
connect to Socket.IO
read current state through safe read endpoints
```

They must not:

```text
start draft
pause draft
resume draft
hover hero
lock hero
undo draft action
reset draft
complete draft
change score
change match
change production state
take graphic to Program
clear Program
trigger emergency
clear emergency
write event package files
write audit logs directly
emit mutation socket events
call mutation REST endpoints
```

Overlay clients are not trusted as operators.

The server should reject mutation socket events from clients that identify themselves as:

```text
role: "OVERLAY"
panel: "overlay"
clientType: "overlay"
```

This is a local production safety guardrail, not a full v0.1 authentication system.

## 1.2 Local-First and Offline-Safe

Overlay rendering must work on a private production LAN with internet disconnected.

Overlays must not require:

```text
remote image URLs
CDN fonts
remote CSS
remote JavaScript bundles
cloud realtime services
hosted sponsor assets
game API calls
LoL LCU
Data Dragon automatic sync
OBS WebSocket
vMix API
```

All required assets must come from:

```text
event-packages/<package-id>/assets/**
games/<game-code>/assets/**
apps/overlay bundled fallback assets
```

or equivalent local paths exposed by the server.

## 1.3 Game-Agnostic Visual Model

The overlay layer may display LoL sample data, AOV sample data, HoK sample data, or Generic MOBA data.

It must use generic terms in shared code:

```text
hero
draft
pick
ban
team
player
match
game
ruleset
adapter
theme
sponsor
production
graphic
```

Avoid LoL-only universal overlay assumptions:

```text
champion select
summoner
rune
spell
riot
lcu
datadragon
observer hud
objective tracker
dragon/baron
```

Future LoL in-game HUD may be added as a separate game-specific plugin later. It must not be required for v0.1 overlay routes.

## 1.4 Production-Safe Failure Behavior

Broadcast overlays must fail visibly but safely.

If state is missing, malformed, stale, or disconnected:

- Do not crash to a white browser screen.
- Do not show developer stack traces.
- Do not expose hidden data.
- Show neutral fallback or transparent standby.
- Show diagnostics only when `?debug=1` is present.
- Keep the browser source dimensions stable.
- Keep the background transparent unless the route intentionally owns a full-screen graphic.

## 1.5 Pure Rendering

Overlay components should be deterministic renderers of public state.

Given the same:

```text
FullStateResponse
ProductionRuntimeState
DraftState
Match
Teams
Players
Sponsors
ThemeConfig
route params
query params
```

the overlay should render the same output.

Overlays should avoid hidden local-only state except:

```text
socket connection status
last received timestamp
last applied revision
debug panel visibility
temporary render-safe animation state
```

---

# 2. Browser-Source Compatibility

## 2.1 Target Hosts

The overlay app must be compatible with:

```text
OBS browser source
vMix browser input / web browser input
ordinary Chromium-based browser for rehearsal
ordinary browser windows sized to 1920x1080 for testing
```

It must not require:

```text
OBS WebSocket
vMix API
Companion
Stream Deck
NDI
Spout
screen capture
browser extension
```

OBS/vMix should only need the overlay URL.

## 2.2 Browser Feature Assumptions

Use conservative browser features that are stable in modern Chromium runtimes.

Avoid fragile requirements such as:

```text
experimental browser flags
WebGPU
WebXR
cross-origin isolated APIs
remote service workers
filesystem write access
camera/microphone access
browser notifications
```

Animations should be CSS/JS based and optional. If animation fails, content must remain readable.

## 2.3 URL Shape

Overlay URLs are regular HTTP routes served locally.

Examples:

```text
http://localhost:3000/overlay/draft/match_grand-final
http://localhost:3000/overlay/scorebug/match_grand-final
http://localhost:3000/overlay/emergency
http://localhost:3000/overlay/program
http://localhost:3000/overlay/preview
```

If the overlay app and server use separate dev ports, document the actual ports in README/deployment docs when implementation begins.

Do not require remote hosted URLs.

## 2.4 OBS/vMix Setup Assumptions

Default browser-source size:

```text
Width: 1920
Height: 1080
FPS: production-dependent
Custom CSS: not required
Shutdown source when not visible: optional
Refresh browser when scene becomes active: optional
```

The overlay itself must not depend on custom OBS/vMix CSS to hide scrollbars, set background transparency, or scale content.

---

# 3. Read-Only Overlay Constraints

## 3.1 No Mutation Controls

Overlay route DOM must not render controls such as:

```text
Start Draft
Pause
Resume
Hover
Lock
Undo
Reset
Complete
Take
Clear
Trigger Emergency
Clear Emergency
Change Score
Change Match
Change Theme
Upload Asset
Edit Sponsor
```

If a button-like element appears in an overlay, it must be visual-only and must not have mutation behavior.

## 3.2 No Mutation REST Calls

Overlay code must not call:

```text
POST /api/drafts
POST /api/drafts/:draftId/start
POST /api/drafts/:draftId/pause
POST /api/drafts/:draftId/resume
POST /api/drafts/:draftId/reset
POST /api/drafts/:draftId/complete
POST /api/drafts/:draftId/actions/:actionId/hover
POST /api/drafts/:draftId/actions/:actionId/lock
POST /api/drafts/:draftId/undo
POST /api/production/state
POST /api/production/preview
POST /api/production/take
POST /api/production/clear
POST /api/production/emergency
```

Allowed read-only calls, when needed:

```text
GET /api/health
GET /api/health/assets
GET /api/state
GET /api/state?view=overlay
GET /api/drafts/:draftId
GET /api/production/state
GET /api/matches/:matchId
```

Prefer Socket.IO `state:full` and subsequent updates where possible.

## 3.3 No Mutation Socket Events

Overlay clients may emit:

```text
client:hello
client:ping
state:request-full
```

Only if the server contract supports them.

Overlay clients must not emit:

```text
draft:start
draft:pause
draft:resume
draft:hover
draft:lock
draft:undo
draft:reset
production:set-state
graphics:preview
graphics:take
graphics:clear
emergency:trigger
emergency:clear
```

If a future socket command is introduced, it must be explicitly classified as read-only before overlays may use it.

## 3.4 Static Guardrail Expectation

Implementation agents must add or run static checks that investigate overlay source matches for patterns such as:

```bash
grep -R "fetch(.*POST\|axios.post\|/api/drafts/.*/start\|/api/drafts/.*/lock\|/api/production/take\|emergency:trigger" apps/overlay/src || true
```

Any match must be reviewed. A match is acceptable only if it is documentation, test fixture text for guardrail tests, or explicitly non-executed warning content.

---

# 4. Required Overlay Route List

## 4.1 Required v0.1 Routes

v0.1 must define and fully implement these routes:

```text
/overlay/draft/:matchId
/overlay/scorebug/:matchId
/overlay/emergency
/overlay/program
/overlay/preview
```

## 4.2 Optional / Future Routes

The following routes may exist as placeholders only if documented:

```text
/overlay/lower-third
/overlay/sponsor
/overlay/pause
/overlay/post-game/:matchId
/overlay/mvp/:matchId
```

Placeholder routes must:

- Not imply they are complete.
- Not require remote assets.
- Not mutate live state.
- Render a safe transparent or labelled placeholder.
- Be excluded from v0.1 release claims unless implemented and tested.

## 4.3 Route Parameter Rules

`matchId` must be treated as an ID, not as trusted code or a path.

Rules:

- Do not eval route params.
- Do not use route params as filesystem paths directly.
- Resolve `matchId` from loaded state.
- If `matchId` is unknown, render safe missing-match fallback and debug details only in debug mode.
- Do not auto-create a match from the route.

---

# 5. `/overlay/draft/:matchId` Behavior

## 5.1 Purpose

The draft overlay displays public manual Ban/Pick state for one match.

It is intended for OBS/vMix browser source use during draft scenes.

## 5.2 Required Display Content

At minimum, the route must display:

```text
event or match title where layout allows
blue team name or short name
red team name or short name
blue team logo or fallback
red team logo or fallback
blue bans
red bans
blue picks
red picks
current timer
current phase label
active team/side
hovered hero where supported
locked heroes distinct from hover/pending
sponsor slot if configured
theme styling
missing hero icon fallback
debug panel when ?debug=1
```

## 5.3 Draft Resolution

Given `matchId`, the overlay should resolve:

```text
match = state.matches.find(id === matchId)
current game = match.currentGameNumber or state.currentGameId linkage
draft = draft associated with current game, current draftId, or production payload
blue team = match/game blueTeamId
red team = match/game redTeamId
ruleset = draft.rulesetId if available
adapter/gameCode = game.gameCode or match.gameCode
theme = game.themeId -> match.themeId -> event default theme -> fallback default
```

If multiple drafts exist for the same match, use the current game draft unless `production.programPayload` explicitly points to a specific draft.

## 5.4 Draft Slot Rendering

The overlay must derive visual ban/pick groups from `DraftState.actions`.

Do not require duplicated arrays to exist in runtime state.

Recommended derivation:

```text
blueBans = actions where team BLUE and type BAN
redBans  = actions where team RED and type BAN
bluePicks = actions where team BLUE and type PICK
redPicks  = actions where team RED and type PICK
```

Visual status rules:

```text
PENDING: show empty slot / placeholder
HOVER: show hero with hover treatment, not locked treatment
LOCKED: show final hero treatment
SKIPPED: show skipped / manual override marker if available
CANCELLED: show neutral cancelled marker only if public-safe
```

Hover must not be presented as final lock.

## 5.5 Timer Rendering

The timer must show the current draft timer from server state.

Rules:

- Display `remainingSeconds` or formatted `MM:SS`.
- When timer reaches zero, show 0 / overtime / expired state.
- Do not trigger auto-pick or auto-ban.
- Do not advance phase locally based on timer alone.
- If disconnected, keep last known timer visually stale-safe or show disconnected marker in debug mode.
- The server/core remains source of truth.

## 5.6 Completed Draft State

When draft status is `COMPLETE`, the overlay should:

- Stop showing active countdown as live.
- Preserve final picks and bans.
- Show completed/final draft indicator if layout allows.
- Continue respecting Program/Preview and emergency priority.
- Not infer match winner.

## 5.7 Missing Draft / Missing Match Behavior

If no match is found:

```text
standard mode: transparent standby or safe "Match not found" neutral overlay if appropriate
debug mode: show route, matchId, connection status, loaded match IDs, last state timestamp
```

If match exists but draft is missing:

```text
standard mode: show team shell with empty draft slots or standby message
debug mode: show missing draft linkage details
```

Do not create or start a draft from overlay.

---

# 6. `/overlay/scorebug/:matchId` Behavior

## 6.1 Purpose

The score bug overlay displays compact match identity and score information.

It is intended for use during pre-show, draft, loading, or game scenes where a simple score graphic is useful.

It is **not** a LoL in-game HUD.

## 6.2 Required Display Content

At minimum, display:

```text
blue/left team name or short name
red/right team name or short name
team logos or fallback
current match score
current game number where available
compact event or match context where layout allows
theme colors
debug panel when ?debug=1
```

Optional public-safe additions:

```text
series format, e.g. BO3
production state label in debug only
sponsor bug if configured for SCORE_BUG or equivalent documented slot
```

## 6.3 Score Source

Score must come from public match state:

```text
match.score.blue
match.score.red
match.currentGameNumber
match.format
match.status
```

The score bug must not read live in-game score from LoL client, observer API, hidden game telemetry, or player machines in v0.1.

## 6.4 Layout Expectations

The score bug should be compact and stable.

Recommended placement:

```text
top-left, top-center, or top-right depending on theme/layout config
inside safe margins
transparent background outside the bug
no scrollbars
```

Actual placement may be theme-driven, but it must be deterministic and browser-source safe.

## 6.5 Missing Score / Missing Logo Behavior

If score is missing or invalid:

- Use `0 - 0` only if the loaded match explicitly defaults to zero.
- Otherwise show neutral placeholder such as `-`.
- Show debug warning only with `?debug=1`.

If logos are missing:

- Use local team-logo fallback.
- Do not attempt remote downloads.

---

# 7. `/overlay/emergency` Behavior

## 7.1 Purpose

The emergency overlay displays a production-safe fallback graphic when live output must be covered quickly.

It must remain readable even when draft, match, sponsor, or theme data is incomplete.

## 7.2 Required Display Content

When emergency is active, display:

```text
clear emergency message
optional subtitle / reason if public-safe
visual high-priority full-screen design
timestamp if configured and public-safe
event branding or neutral fallback if available
debug panel when ?debug=1
```

When emergency is inactive:

```text
standard mode: transparent standby
debug mode: show emergency inactive, connection status, timestamp, route
```

## 7.3 Emergency State Source

Use production state:

```text
production.emergency.active
production.emergency.message
production.emergency.triggeredAt
production.emergency.triggeredBy
production.state
revision
updatedAt
```

Only public-safe emergency message should be rendered.

Do not expose internal notes, operator names, private incident details, player disputes, or hidden technical diagnostics on-air.

## 7.4 Emergency Priority

Emergency is the highest-priority overlay state.

When emergency is active:

```text
/overlay/emergency: shows emergency graphic
/overlay/program: shows emergency graphic instead of normal program payload
/overlay/preview: should show emergency graphic or clearly indicate emergency active according to production workflow
/overlay/draft/:matchId: may either show emergency override or continue draft route if OBS scene uses separate emergency source; implementation must document chosen behavior
/overlay/scorebug/:matchId: may either show emergency override or remain scorebug if emergency route is layered separately; implementation must document chosen behavior
```

Recommended v0.1 convention:

```text
/overlay/program always honors emergency override.
/overlay/emergency is a dedicated full-screen source.
/overlay/draft and /overlay/scorebug remain normal overlays unless the production payload explicitly routes emergency over them.
```

This keeps source layering predictable while ensuring Program can be covered safely.

## 7.5 Emergency Does Not Mutate State

The emergency overlay route must not trigger or clear emergency state.

Emergency trigger/clear belongs to Producer/Admin controls and server mutation routes.

---

# 8. `/overlay/program` Behavior

## 8.1 Purpose

Program overlay renders the current on-air graphic payload selected through the production Preview/Take workflow.

It is the route most likely to be used as a persistent browser source in OBS/vMix for global graphics output.

## 8.2 Data Source

Program must render from:

```text
production.graphicTakeState.programPayload
production.graphicTakeState.graphicType
production.graphicTakeState.status
production.emergency
production.revision
```

or the equivalent `ProductionRuntimeState` shape defined by the server contract.

## 8.3 Rendering Rules

Program route should:

- Render nothing / transparent standby when `programPayload` is null and emergency is inactive.
- Render the selected graphic when `programPayload` exists.
- Render emergency graphic when emergency is active.
- Apply theme/fallback rules.
- Never render Preview-only payload as Program.
- Never perform Take/Clear action itself.

## 8.4 Supported Program Graphic Types

At minimum, Program should be able to render payloads for:

```text
DRAFT_OVERLAY
SCORE_BUG
EMERGENCY
```

Other graphic types may be placeholders if future routes are not implemented:

```text
LOWER_THIRD
SPONSOR_BUG
PAUSE_SCREEN
POST_GAME_STATS
MVP
```

If an unsupported graphic type is taken to Program:

```text
standard mode: transparent standby or neutral unsupported placeholder
debug mode: show unsupported graphic type and payload summary
health/update: server should report warning where practical
```

## 8.5 Program Is Read-Only

`/overlay/program` must not:

```text
take preview to program
clear program
change production state
trigger emergency
write audit log
```

It only renders the state produced by the server/producer workflow.

---

# 9. `/overlay/preview` Behavior

## 9.1 Purpose

Preview overlay renders the current prepared graphic before it is taken to Program.

It supports production-safe checking inside OBS/vMix, a director monitor, or a browser window.

## 9.2 Data Source

Preview must render from:

```text
production.graphicTakeState.previewPayload
production.graphicTakeState.graphicType
production.graphicTakeState.status
production.emergency
production.revision
```

## 9.3 Rendering Rules

Preview route should:

- Render preview payload when available.
- Render transparent standby when preview payload is null.
- Show clear debug diagnostics with `?debug=1`.
- Show emergency active status in debug mode.
- Never render Preview payload as Program.
- Never call Take/Clear itself.
- Use same theme and fallback rules as Program.

## 9.4 Preview / Program Relationship

Preview and Program must be visually consistent but state-separated.

Required relationship:

```text
Producer Panel prepares graphic → server sets previewPayload → /overlay/preview renders it.
Producer Panel performs Take → server copies/moves approved graphic to programPayload → /overlay/program renders it.
Producer Panel clears Program → server clears programPayload → /overlay/program returns to standby.
```

Overlay routes only observe this relationship.

Do not implement automatic Preview-to-Program take inside overlay.

---

# 10. Default 1920x1080 Layout

## 10.1 Base Canvas

All overlay routes must target a 1920x1080 base design.

Recommended base CSS behavior:

```text
root width: 100vw
root height: 100vh
design coordinate system: 1920x1080
overflow: hidden
background: transparent unless full-screen graphic intentionally fills it
```

Implementation may use CSS scaling, container queries, or transform-based scaling, but the visible result must be stable at 1920x1080.

## 10.2 Future Resolution Scaling

Overlays should be designed so future scaling to:

```text
2560x1440
3840x2160
```

is possible.

v0.1 does not need full UHD layout variants, but avoid hardcoded assumptions that make scaling impossible.

## 10.3 Layout Stability

State changes must not cause browser-source layout jumps.

Avoid:

```text
content-driven page height
document scrolling
unbounded images
unbounded text
layout changing because debug panel appears in standard mode
```

Use fixed-size slots for:

```text
pick cards
ban icons
team logo boxes
score bug container
sponsor slot
timer region
```

## 10.4 Text Overflow

Broadcast text must fail gracefully.

Recommended behavior:

```text
team shortName preferred for compact regions
ellipsis or scale-down for long names
debug warning for too-long names when ?debug=1
never create scrollbars
never push critical elements outside safe area
```

---

# 11. Transparent Background Requirements

## 11.1 Default Transparency

Overlay pages must use transparent background by default where appropriate.

Required routes with transparent background:

```text
/overlay/draft/:matchId
/overlay/scorebug/:matchId
/overlay/program when no full-screen payload
/overlay/preview when no full-screen payload
/overlay/emergency when inactive
```

Emergency active state may use a full-screen background.

A full-screen pause/emergency/break payload may intentionally fill the whole screen.

## 11.2 CSS Requirement

The app must ensure:

```text
html
body
#root
overlay root containers
```

do not accidentally apply an opaque default background unless the route intentionally requires it.

## 11.3 Debug Mode Transparency

`?debug=1` may render an opaque or semi-opaque debug panel, but only in debug mode.

Debug UI must not appear in normal browser sources.

---

# 12. Safe Margin Requirements

## 12.1 Default Safe Margin

Use the active `ThemeConfig.layout.safeMarginPx` when available.

If missing, default to:

```text
safeMarginPx: 64
```

This value aligns with the sample theme convention and gives a safe broadcast margin for 1920x1080.

## 12.2 Safe Area Application

Critical visual information must stay inside safe margins:

```text
team names
logos
scores
timer
current phase
picks/bans
sponsor bugs
emergency message
debug panel where practical
```

Backgrounds, frames, and decorative shapes may extend outside safe margins.

## 12.3 Emergency Safe Margin

Emergency full-screen graphics should still keep text inside safe margins or a larger emergency text area.

Do not place emergency message flush to screen edge.

---

# 13. No-Scrollbar Requirements

## 13.1 Standard View

No overlay route should show scrollbars at a standard 1920x1080 browser-source size.

This applies to:

```text
document body
root container
route containers
debug hidden state
image/video wrappers
```

## 13.2 Overflow Policy

Use:

```text
overflow: hidden
```

on root overlay containers.

Do not rely on OBS custom CSS to hide scrollbars.

## 13.3 Debug Mode

Even in `?debug=1`, avoid scrollbars at 1920x1080.

If debug content exceeds safe space:

- Use compact debug panel.
- Truncate long JSON.
- Show only route, matchId, connection status, revision, timestamp, and key warnings.
- Do not dump full state on-screen.

---

# 14. Socket.IO Connection Lifecycle

## 14.1 Client Startup

On route load, overlay client should:

```text
1. Parse route params and query params.
2. Initialize safe empty state.
3. Connect to local Socket.IO server.
4. Emit client:hello with overlay identity when connected.
5. Wait for state:full.
6. Render route-specific state once available.
7. Render fallback/standby while state is loading.
```

Recommended `client:hello` payload:

```json
{
  "role": "OVERLAY",
  "panel": "overlay",
  "route": "/overlay/draft/:matchId",
  "matchId": "match_grand-final",
  "displayMode": "PROGRAM",
  "debug": false,
  "userAgent": "browser-source"
}
```

`displayMode` may be:

```text
PROGRAM
PREVIEW
DEBUG
STANDALONE
```

Actual values should align with shared types if implemented.

## 14.2 Connection States

Overlay should track:

```text
CONNECTING
CONNECTED
RECONNECTING
DISCONNECTED
ERROR
```

Normal mode may hide connection status unless it is critical.

Debug mode must show connection status.

## 14.3 Reconnect Behavior

On disconnect:

- Keep last good public state visible if safer than blank.
- Show debug disconnected indicator when `?debug=1`.
- Do not clear Program content unless server state says to clear.
- Attempt automatic reconnect.

On reconnect:

```text
1. Re-emit client:hello.
2. Expect state:full from server.
3. Replace local state with state:full.
4. Resume applying updates from latest revision.
```

Do not assume missed patches can be reconstructed locally.

## 14.4 Full-State Authority

`state:full` is authoritative.

When received:

- Replace current overlay runtime snapshot.
- Set `lastFullStateAt`.
- Set `currentRevision`.
- Re-run route selectors.
- Clear stale missing-state warnings that are no longer valid.

## 14.5 Patch Handling

`state:patch` may be used for incremental updates.

Implementation must choose one safe convention:

```text
Option A: patch is a partial state with revision and patch path.
Option B: patch is a domain-level partial update.
Option C: patch is treated as "refresh needed" and client requests/awaits state:full.
```

Whichever convention is chosen, it must be tested.

If patch revision is older than current revision:

```text
ignore it
show debug warning if ?debug=1
```

If patch cannot be safely applied:

```text
request/await state:full
do not corrupt local state
```

## 14.6 Domain Events

Overlay clients should listen to these server-to-client events:

```text
state:full
state:patch
draft:updated
draft:timer
production:state
graphics:preview
graphics:program
graphics:clear
health:update
error
```

Only use events that exist in the server contract.

## 14.7 Error Events

Socket `error` payloads must be handled without crashing.

Display:

```text
normal mode: safe fallback where necessary
debug mode: error code, message, timestamp, correlationId where available
```

Do not expose stack traces on-air.

---

# 15. `state:full` on Reconnect Behavior

## 15.1 Required Behavior

A reconnected overlay must receive the latest state before it claims to be current.

For manual rehearsal:

```text
1. Open draft overlay.
2. Perform draft actions.
3. Refresh overlay browser source.
4. Confirm overlay shows current draft, not initial state.
5. Disconnect/reconnect socket if supported.
6. Confirm overlay receives latest state.
```

## 15.2 Local State Replacement

On reconnect `state:full`, the overlay must replace old state.

It must not:

```text
merge old stale draft actions with new full state
keep old production state after state:full says cleared
retain previous match selection if route params changed
reuse old sponsor/theme objects after package reload without validation
```

## 15.3 Revision Handling

If server provides `revision`, overlay must track it.

Rules:

```text
state:full with revision >= current: accept and replace
state:full with missing revision: accept but show debug warning
state:patch/draft update with revision < current: ignore or request full state
state:patch with revision gap: request full state or wait for server full sync
```

---

# 16. `state:patch`, `draft:updated`, and `production:state` Usage

## 16.1 `state:patch`

Purpose:

```text
General runtime state update after a mutation.
```

Overlay usage:

- Update global selectors if patch is safely understood.
- Otherwise trigger a full-state refresh strategy.
- Do not infer mutation source beyond payload metadata.

## 16.2 `draft:updated`

Purpose:

```text
Draft-specific update after hover, lock, undo, reset, start, pause, resume, timer/phase changes, or complete.
```

Overlay usage:

- Update affected draft in local state.
- Re-render draft overlay if `matchId` or current game maps to that draft.
- Re-render Program/Preview if payload references that draft.
- Preserve status distinction: hover vs locked vs pending.

## 16.3 `draft:timer`

Purpose:

```text
Timer-specific update where implemented.
```

Overlay usage:

- Update timer display only.
- Do not use timer reaching zero to auto-lock or auto-advance.
- If timer event refers to unknown draft, ignore and show debug warning.

## 16.4 `production:state`

Purpose:

```text
Production state and Preview/Program/Emergency update.
```

Overlay usage:

- Update production runtime state.
- Re-render `/overlay/program`.
- Re-render `/overlay/preview`.
- Apply emergency priority rules.
- Optionally update draft/scorebug if production state affects visible overlay mode.

## 16.5 `graphics:*` Events

Use these events if server emits them:

```text
graphics:preview
graphics:program
graphics:clear
```

They must update local production graphic take state only.

They must not call take/clear back to the server.

---

# 17. Debug Mode via `?debug=1`

## 17.1 Purpose

Debug mode helps TDs and coding agents verify route state without opening devtools.

It must not appear in normal production overlay URLs.

## 17.2 Enabling

Debug mode is enabled only by query string:

```text
?debug=1
```

Optional accepted forms:

```text
?debug=true
?debug=yes
```

Only `?debug=1` is required for v0.1.

## 17.3 Required Debug Content

Debug mode should show:

```text
overlay route
route params, especially matchId
display mode
Socket.IO connection status
last state timestamp
last full state timestamp
current revision
server-reported production state
emergency active/inactive
asset warnings count
missing key data warnings
```

For draft route, also show:

```text
resolved match ID
resolved game ID
resolved draft ID
draft status
current phase index
```

For scorebug route, also show:

```text
resolved match ID
score source
team IDs
```

## 17.4 Debug Content Limits

Do not show:

```text
full raw state JSON
hidden competitive notes
private player data
operator private notes
stack traces
file system absolute paths
secret tokens
```

Keep debug panel compact and inside safe margins.

## 17.5 Debug Visual Style

Debug panel may be semi-opaque and clearly labelled.

It should not obscure critical overlay elements more than necessary.

For OBS/vMix rehearsal, users can add `?debug=1` temporarily and remove it before live program output.

---

# 18. Missing Asset Fallback Behavior

## 18.1 Required Fallback Priority

When a visual asset is missing, use this priority:

```text
1. Referenced local asset exists → use it.
2. Entity-specific fallback exists → use it.
3. Event package fallback exists → use it.
4. Overlay bundled fallback exists → use it.
5. Render neutral CSS placeholder.
```

Examples:

```text
team logo missing → assets/fallbacks/team-logo.svg
hero icon missing → assets/fallbacks/hero-icon.svg
sponsor logo missing → assets/fallbacks/sponsor-logo.svg
background missing → assets/fallbacks/background.svg or transparent background
```

## 18.2 Missing Asset Warnings

Missing assets should be reported through:

```text
GET /api/health/assets
health:update
debug panel warnings
server logs where practical
```

A missing optional logo/icon must not crash overlay rendering.

## 18.3 No Remote Recovery

Overlay must not attempt:

```text
download from CDN
fetch Data Dragon
fetch Riot assets
fetch sponsor website logos
search internet
hotlink image URLs
```

## 18.4 Broken Image Handling

If an image path resolves but fails to load:

- Switch to fallback.
- Record debug warning.
- Keep layout size stable.
- Do not show browser broken-image icon on-air if avoidable.

---

# 19. ThemeConfig Usage

## 19.1 Theme Source

Overlay theme should resolve in this priority:

```text
1. Production graphic payload themeId, if present.
2. Current game themeId, if present.
3. Match themeId, if present.
4. Event default themeId.
5. Event package default theme.
6. Built-in overlay default theme.
```

Theme files live in:

```text
event-packages/<package-id>/themes/*.json
```

and must align with `ThemeConfig`.

## 19.2 Theme Fields

Overlay should use:

```text
colors.background
colors.primary
colors.secondary
colors.accent
colors.blueTeam
colors.redTeam
colors.textPrimary
colors.textSecondary
typography.headingFont
typography.bodyFont
typography.numberFont
layout.safeMarginPx
layout.borderRadiusPx
layout.animationSpeedMs
assets.background
assets.frame
assets.sponsorFrame
```

## 19.3 Theme Defaults

If a theme field is missing, use safe defaults.

Recommended fallback defaults:

```text
safeMarginPx: 64
borderRadiusPx: 16
animationSpeedMs: 300
headingFont/bodyFont: local/system sans-serif
numberFont: same as body font
background: transparent unless payload requires full-screen background
```

## 19.4 Theme Safety

Theme validation and overlay rendering must reject or ignore:

```text
remote font URLs
remote CSS URLs
remote image URLs
JavaScript injection fields
HTML injection fields
cloud asset references
absolute filesystem paths
path traversal
```

## 19.5 Font Handling

Local system fonts or bundled/local fonts are acceptable.

Remote web fonts are not required and must not be required for v0.1 operation.

If the specified font is unavailable:

- Use local fallback font stack.
- Show debug warning if `?debug=1`.
- Keep layout readable.

---

# 20. Event Package Asset Linkage

## 20.1 Data Sources

Overlay asset paths are linked from:

```text
teams.json → teams[].logoUrl
players.json → players[].photoUrl
sponsors.json → sponsors[].logoUrl
themes/*.json → assets.background / frame / sponsorFrame
game adapter hero data → hero.iconUrl / splashUrl / squareUrl
event package hero icon overrides if documented
```

## 20.2 Path Rules

All asset paths must be local relative paths.

Allowed:

```text
assets/team-logos/blue-meteors.svg
assets/sponsor-logos/presented-by.svg
assets/fallbacks/hero-icon.svg
```

Disallowed:

```text
https://cdn.example.com/logo.png
http://example.com/logo.png
//cdn.example.com/logo.png
file:///C:/logo.png
C:\logo.png
/Users/td/logo.png
../outside/logo.png
```

## 20.3 Server Asset Serving

Implementation should expose local event package assets through a safe local static route or resolved asset service.

The overlay should receive browser-loadable local URLs that still map to event-package-local files.

Example conceptual mapping:

```text
event package path: assets/team-logos/blue-meteors.svg
served URL: /assets/event-packages/sample-event/team-logos/blue-meteors.svg
```

The exact route may differ, but it must be local, safe, and documented.

## 20.4 No Hidden Asset Mutation

Overlay must not upload, rewrite, rename, cache, or generate event package assets.

Asset management belongs to setup/admin tooling or manual file preparation, not broadcast overlay output.

---

# 21. Sponsor Slot Rendering Expectations

## 21.1 Sponsor Source

Sponsors come from:

```text
sponsors.json
match.sponsorSlotIds
production graphic payload sponsor references
theme assets.sponsorFrame
```

## 21.2 Supported Slots

Use documented sponsor slots such as:

```text
PRESENTED_BY
DRAFT
LOWER_THIRD
REPLAY
OBJECTIVE
MVP
BREAK_SCREEN
SCORE_BUG
```

If `SCORE_BUG` is not yet present in shared types, implementation must either:

```text
1. add it only in a properly scoped shared-types task; or
2. map scorebug sponsor rendering through a documented metadata/future-safe extension.
```

Do not casually expand shared types during overlay work unless the task explicitly allows it.

## 21.3 Draft Overlay Sponsor

`/overlay/draft/:matchId` should render sponsor logos for:

```text
DRAFT
PRESENTED_BY
```

where configured.

Recommended placement:

```text
top center
bottom center
dedicated frame slot
theme-driven sponsor frame
```

Sponsor must not obscure picks, bans, active team, or timer.

## 21.4 Score Bug Sponsor

`/overlay/scorebug/:matchId` may render a compact sponsor logo if configured.

Use only if it remains readable and does not cause score bug layout instability.

## 21.5 No Sponsor Automation

v0.1 must not implement real sponsor scheduling automation.

Allowed:

```text
manual sponsor slot linkage from event package
static selected sponsor in graphic payload
priority-based deterministic first sponsor where multiple are configured
```

Disallowed:

```text
time-based sponsor rotation
cloud ad serving
analytics beacons
impression tracking to internet services
dynamic remote sponsor inventory
```

## 21.6 Sponsor Fallback

If sponsor logo is missing:

- Use local sponsor fallback.
- Keep sponsor slot size stable.
- Show debug warning only in debug mode.
- Do not show broken image icon on-air.

---

# 22. Preview / Program Relationship

## 22.1 Production Control Ownership

Preview/Program state belongs to Production Control.

Overlay routes observe:

```text
production.graphicTakeState.previewPayload
production.graphicTakeState.programPayload
production.graphicTakeState.status
production.graphicTakeState.graphicType
```

They do not own the state machine.

## 22.2 Deliberate Take

Graphics must not go live automatically.

Correct workflow:

```text
Producer/Admin prepares graphic.
Server records preview payload.
Preview overlay shows it.
Producer/Admin confirms Take.
Server records program payload and audit log.
Program overlay shows it.
Producer/Admin clears Program.
Server clears payload and audit log.
Program overlay returns to standby.
```

Incorrect workflow:

```text
Overlay receives draft update.
Overlay automatically takes itself to Program.
Overlay clears Program after animation.
Overlay triggers emergency because socket disconnected.
```

## 22.3 Draft Route vs Program Route

`/overlay/draft/:matchId` is a direct route that always renders the current draft for that match.

`/overlay/program` renders only what Production Control has taken to Program.

Both can exist at the same time.

Recommended OBS/vMix use:

```text
Dedicated draft scene uses /overlay/draft/:matchId.
Global graphics layer uses /overlay/program.
Producer panel controls what /overlay/program displays.
Emergency source uses /overlay/emergency or Program emergency override.
```

## 22.4 Preview Route Use

`/overlay/preview` is useful for:

```text
checking a graphic before take
producer monitor
graphics operator QA
manual rehearsal
debugging payload selection
```

It is still read-only.

---

# 23. Emergency Overlay Priority

## 23.1 Priority Order

When multiple things could render, use this priority:

```text
1. Emergency active and route honors emergency override.
2. Explicit Program payload.
3. Explicit Preview payload for preview route.
4. Direct route content such as draft or scorebug.
5. Standby / transparent fallback.
6. Debug diagnostics if ?debug=1.
```

## 23.2 Emergency Message Safety

Emergency messages must be public-safe.

Do not render:

```text
private network passwords
internal panic notes
legal disputes
medical details
player-client hidden state
technical stack traces
operator blame
```

Recommended public messages:

```text
Technical Pause
Broadcast will resume shortly
Stand by
Match paused
```

## 23.3 Emergency Asset Independence

Emergency overlay must work even if:

```text
match is missing
draft is missing
team logos are missing
sponsor logos are missing
theme background is missing
hero assets are missing
```

Emergency should rely on built-in fallback visual styling if event theme assets fail.

---

# 24. Local-First Operation

## 24.1 Offline Production LAN

The overlay app must work with:

```text
server machine
admin/draft/producer machines
OBS/vMix machine
local LAN switch/router
no internet
```

## 24.2 Allowed Local Dependencies

Allowed:

```text
local HTTP server
local Socket.IO server
local event package files
local asset serving
local browser cache
bundled frontend assets
local fonts
```

## 24.3 Disallowed Runtime Dependencies

Do not require:

```text
cloud database
cloud storage
hosted JavaScript
hosted CSS
Google Fonts
CDN images
Riot Data Dragon runtime sync
OBS WebSocket
vMix API
external auth
analytics services
```

## 24.4 Rehearsal Offline Check

Manual rehearsal should include:

```text
disconnect internet
start local server
open overlays
run draft action from operator panel
confirm overlays update
trigger emergency from producer/admin panel
confirm emergency displays
```

If this cannot be tested during a task, the handoff must honestly mark it as not tested.

---

# 25. Automated Verification Expectations

When overlay implementation begins, the following automated checks should exist or be added as appropriate.

## 25.1 Build and Typecheck

Run:

```bash
pnpm --filter @*/overlay typecheck
pnpm --filter @*/overlay build
pnpm typecheck
pnpm build
```

Where package names differ, use the actual workspace filter.

## 25.2 Unit / Component Tests

Tests should cover:

```text
route param parsing
debug mode detection
draft state selector
scorebug state selector
program payload selector
preview payload selector
emergency priority selector
theme fallback merging
asset fallback resolver
safe text overflow helpers where implemented
no mutation controls rendered
```

## 25.3 Socket Integration Tests

Tests should confirm:

```text
overlay sends client:hello with overlay role/panel
new overlay receives state:full
draft:updated changes draft overlay view model
production:state changes program/preview view model
reconnect receives latest state:full
old revision patches are ignored or handled safely
socket error does not crash route
```

## 25.4 Static Guardrail Tests

Search overlay source for mutation behavior:

```bash
grep -R "fetch(.*POST\|axios.post\|/api/drafts/.*/start\|/api/drafts/.*/pause\|/api/drafts/.*/resume\|/api/drafts/.*/reset\|/api/drafts/.*/complete\|/api/drafts/.*/lock\|/api/drafts/.*/hover\|/api/production/take\|/api/production/clear\|/api/production/emergency\|draft:lock\|graphics:take\|emergency:trigger" apps/overlay/src || true
```

Investigate all matches.

Search for remote dependencies:

```bash
grep -R "https://\|http://\|fonts.googleapis\|cdn\|DataDragon\|LCU\|Riot" apps/overlay/src event-packages/sample-event || true
```

Investigate all matches. Documentation text may be acceptable; runtime dependency is not.

## 25.5 Browser / E2E Tests

If Playwright exists, test at 1920x1080:

```text
/overlay/draft/:matchId
/overlay/scorebug/:matchId
/overlay/emergency
/overlay/program
/overlay/preview
```

Checks:

```text
route loads
no console crash
body scrollHeight <= viewport height
body scrollWidth <= viewport width
transparent background where expected
debug panel appears with ?debug=1
fallback asset appears when asset missing
```

## 25.6 Visual Regression

If visual tests exist, capture snapshots at:

```text
1920x1080
1280x720 optional
2560x1440 optional
```

v0.1 only requires 1920x1080, but avoid obvious breakage at common preview sizes.

## 25.7 Required Command Reporting

Implementation agents must report:

```text
command run
result
any unavailable command
any failing test
whether failures are in scope
```

Do not claim success for commands that were not run.

---

# 26. Manual Rehearsal Verification Expectations

Manual rehearsal is required before accepting overlay implementation.

## 26.1 Basic Route Rehearsal

Open each route in a normal browser:

```text
/overlay/draft/:matchId
/overlay/scorebug/:matchId
/overlay/emergency
/overlay/program
/overlay/preview
```

Verify:

```text
route loads
no scrollbars at 1920x1080
transparent background where expected
debug mode works with ?debug=1
missing route/match state fails safely
```

## 26.2 OBS/vMix Browser-Source Rehearsal

In OBS/vMix or a browser-source-sized test window:

```text
add /overlay/draft/:matchId as browser source
set width 1920 height 1080
confirm transparent background
confirm no scrollbars
confirm picks/bans/timer fit safe area
add /overlay/scorebug/:matchId
confirm score bug is compact and stable
add /overlay/emergency
confirm inactive standby is transparent
```

## 26.3 Draft Update Rehearsal

With server, draft operator panel, and overlay open:

```text
start draft
hover hero
lock ban
lock pick
pause draft
resume draft
undo locked action
reset with confirmation
complete draft
```

Verify overlay updates after:

```text
hover
lock
timer change
pause/resume
undo
reset
complete
```

## 26.4 Reconnect Rehearsal

Test:

```text
refresh overlay browser source
disconnect/reconnect server if supported
reload route after several draft actions
```

Verify:

```text
overlay receives latest state
state is not stale
debug panel shows reconnect and latest timestamp
no manual refresh needed after normal reconnect
```

## 26.5 Program / Preview Rehearsal

With Producer Panel or API-backed controls:

```text
prepare draft graphic to Preview
confirm /overlay/preview shows preview
take to Program
confirm /overlay/program shows program
clear Program
confirm /overlay/program returns to standby
```

Verify:

```text
/overlay/preview and /overlay/program do not mutate state
Program does not show Preview until Take
Take/Clear are logged by server, not overlay
```

## 26.6 Emergency Rehearsal

Trigger emergency from authorized Producer/Admin control.

Verify:

```text
/overlay/emergency displays emergency message
/overlay/program honors emergency override
draft/scorebug behavior matches documented convention
clear emergency restores normal display
debug mode shows emergency state
```

## 26.7 Offline Rehearsal

Disconnect internet.

Verify:

```text
overlay routes still load from local server
local assets still render
Socket.IO updates continue on LAN
fallback assets work
no remote font/image requests are required
```

## 26.8 Manual Rehearsal Report

Handoff must record:

```text
routes tested
browser/source size
OBS/vMix tested or browser-only tested
draft actions tested
reconnect tested or not tested
Program/Preview tested or not tested
emergency tested or not tested
offline tested or not tested
issues found
```

---

# 27. Out-of-Scope Guardrails

Overlay implementation must not add these v0.1 features:

```text
LoL LCU reader
LoL champion select auto-sync
LoL Data Dragon automatic sync
LoL in-game HUD
objective tracker
post-game stats from live game API
player-side software
player-side automation
auto-pick
auto-ban
hidden competitive data display
OBS WebSocket
vMix API
Companion
Stream Deck
cloud sync
cloud asset hosting
user login as required runtime dependency
SQLite / Prisma
sponsor ad-serving automation
advanced animation editor
remote asset downloader
```

## 27.1 LoL-Specific Guardrail

Allowed in v0.1:

```text
LoL sample adapter data displayed through generic Hero model.
LoL-style draft ruleset displayed through generic DraftRuleset.
Local sample champion icons if manually included and locally served.
```

Not allowed in v0.1 overlay:

```text
reading LoL client state
syncing champion select
rendering in-game HUD from live LoL APIs
requiring Data Dragon runtime sync
showing summoner spells/runes/objectives as live data
hardcoding LoL as universal overlay default
```

## 27.2 Hidden Information Guardrail

Overlays must display only broadcast-safe public state.

Do not render:

```text
private strategy notes
hidden draft notes
player client data
internal referee notes not cleared for broadcast
operator private comments
credentials
absolute local filesystem paths
network secrets
```

## 27.3 Mutation Guardrail

Overlay must remain read-only even in debug mode.

Debug mode must not add hidden controls.

---

# 28. Implementation Notes for Future Coding Agents

## 28.1 Suggested Overlay App Structure

A future implementation may use a structure like:

```text
apps/overlay/src
├── main.tsx
├── routes
│   ├── OverlayRouter.tsx
│   ├── DraftOverlayRoute.tsx
│   ├── ScoreBugRoute.tsx
│   ├── EmergencyRoute.tsx
│   ├── ProgramRoute.tsx
│   └── PreviewRoute.tsx
├── overlays
│   ├── DraftOverlay.tsx
│   ├── ScoreBugOverlay.tsx
│   ├── EmergencyOverlay.tsx
│   ├── ProgramOverlay.tsx
│   └── PreviewOverlay.tsx
├── components
│   ├── DebugOverlay.tsx
│   ├── SafeImage.tsx
│   ├── TeamLogo.tsx
│   ├── HeroSlot.tsx
│   └── SponsorSlot.tsx
├── state
│   ├── socketClient.ts
│   ├── overlayStore.ts
│   └── selectors.ts
├── theme
│   ├── resolveTheme.ts
│   └── cssVars.ts
└── assets
    └── fallbacks
```

This is a suggested structure only. Do not reorganize an existing repo casually.

## 28.2 Shared Selector Preference

Keep route selectors pure and testable.

Examples:

```text
selectMatchForOverlay(state, matchId)
selectCurrentDraftForMatch(state, matchId)
selectDraftOverlayViewModel(state, matchId)
selectScoreBugViewModel(state, matchId)
selectProgramViewModel(state)
selectPreviewViewModel(state)
selectEmergencyViewModel(state)
```

These should not mutate state.

## 28.3 Safe Image Component

Use a safe image resolver that supports fallback chains.

It should not:

```text
fetch remote URLs
throw on missing image
change layout size when fallback appears
```

## 28.4 Debug Panel

Debug panel should be a reusable overlay component controlled by query param.

Never ship normal routes with debug panel visible by default.

---

# 29. Final Checklist for Overlay Work

Before marking overlay implementation complete, confirm:

```text
Required routes exist.
Routes are browser-source compatible.
Routes are read-only.
No mutation REST calls exist in overlay runtime.
No mutation socket events are emitted by overlay runtime.
Socket.IO connects locally.
client:hello identifies overlay clients.
state:full is handled on first connect and reconnect.
state:patch / draft:updated / production:state are handled safely.
Draft overlay shows teams, picks, bans, timer, phase, sponsor slot, and fallbacks.
Scorebug shows teams, score, game number, and fallbacks.
Emergency route works without match/draft data.
Program route renders Program payload only.
Preview route renders Preview payload only.
Emergency priority is documented and tested.
1920x1080 layout has no scrollbars.
Transparent backgrounds work.
Safe margins are respected.
Debug mode works via ?debug=1.
ThemeConfig drives colors, typography, safe margin, border radius, animation timing, and assets.
Event package assets resolve locally.
Missing assets fall back locally.
No internet/cloud/remote asset dependency exists.
No LoL LCU/Data Dragon/in-game HUD feature was added.
Manual rehearsal results are recorded.
Automated verification results are recorded.
```
