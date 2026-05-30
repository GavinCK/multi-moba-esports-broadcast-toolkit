# API + Socket Contract Harness — Multi-MOBA Esports Broadcast Toolkit v0.1

## Document Purpose

This document defines the v0.1 local-first server runtime, REST API, Socket.IO realtime sync, and append-only audit logging contract for the **Multi-MOBA Esports Broadcast Toolkit**.

It is written for Codex / AI coding agents before they implement:

```text
apps/server
apps/server/src/api.ts
apps/server/src/socket.ts
apps/server/src/state/**
apps/server/src/health/**
apps/server/src/persistence/audit-log/**
```

This is a documentation / harness planning file only.

It does not implement application code, generate test fixtures, rewrite the Technical Spec, or modify existing harness documents.

The purpose of this file is to remove ambiguity before these task queue items are executed:

```text
TQ-070 — Implement Server App Shell and Health Endpoint
TQ-071 — Implement Event Package and Adapter Loading in Server Runtime
TQ-072 — Implement Draft REST APIs and Audit Logging
TQ-073 — Implement Production REST APIs and Audit Logging
TQ-074 — Implement Socket.IO Realtime Sync
```

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
WORKING_HANDOFF_AFTER_BAN_PICK_RULES.md
```

If this document conflicts with a newer user instruction, follow the latest user instruction and record the decision in the handoff.

If this document conflicts with `AGENTS.md`, preserve the safer interpretation that keeps the system:

```text
game-agnostic
manual-first
local-first
production-safe
```

---

## Non-Negotiable v0.1 Principles

The server contract must preserve these release-blocking rules:

- Universal Ban/Pick must be game-agnostic.
- LoL In-game HUD must remain a future plugin.
- Production Control must sit above both Universal Draft and game-specific plugins.
- v0.1 must be local-first, manual-first, and production-safe.
- No player-side automation.
- No auto-pick.
- No auto-ban.
- No hidden competitive information exposure.
- REST / Socket contract must not become LoL-first.
- Overlay routes must remain read-only and must not mutate live state.
- The server must not require cloud services, internet access, SQLite, Prisma, user login, OBS WebSocket, vMix API, Companion, Stream Deck, LCU, Data Dragon, or player-PC software.

---

# 1. API Design Principles

## 1.1 Local-First Server

The v0.1 server is a local LAN runtime.

It should:

- Run on a local production machine.
- Load local JSON event packages.
- Maintain in-memory runtime state during the process lifetime.
- Append important live actions to local JSONL logs.
- Serve REST APIs under `/api`.
- Serve Socket.IO realtime updates locally.
- Work with internet disconnected.

It must not require:

```text
cloud realtime services
cloud database
remote auth provider
external game API
Riot LCU
Data Dragon automatic sync
OBS WebSocket
vMix API
SQLite / Prisma
user login system
```

## 1.2 Manual-First Mutations

All v0.1 live mutations are operator-driven.

The server may accept manual operator API calls or dashboard socket calls, but it must not:

- Auto-pick when timer reaches zero.
- Auto-ban when timer reaches zero.
- Lock a hero because a player client changed state.
- Read player-side clients.
- Control player-side clients.
- Infer hidden competitive information.

## 1.3 Game-Agnostic Contract

REST routes and Socket.IO events must use generic terms:

```text
hero
draft
ruleset
gameCode
adapter
production
graphic
match
team
player
sponsor
```

They must not become LoL-first terms such as:

```text
champion-select
summoner
riot
lcu
datadragon
rune
spell
observer-hud
```

A LoL sample adapter may expose sample heroes/champions through the generic `Hero` model, but the server contract must not depend on LoL-specific runtime behavior.

## 1.4 Production-Safe Mutations

Any endpoint or socket event that changes live state must be:

- Explicit.
- Validated.
- Rejected on invalid state.
- Logged to append-only JSONL.
- Broadcast to connected clients after success.
- Protected by confirmation when dangerous.

Dangerous actions include:

```text
draft reset
draft complete
draft incomplete complete override
draft manual override
draft undo
production state change during live state
graphics take to Program
graphics clear from Program
emergency trigger
emergency clear
active match switch during live state if implemented
winner/result change if implemented
```

## 1.5 Read-Only Overlay Constraint

Overlay clients are broadcast outputs.

Overlay routes and overlay socket clients must:

- Receive state.
- Receive updates.
- Auto-reconnect.
- Display fallback/error/debug state when needed.

Overlay clients must not:

- Call mutation REST endpoints.
- Emit mutation socket events.
- Start/pause/resume/lock/undo/reset/complete draft.
- Preview/take/clear graphics.
- Trigger emergency mode.
- Change match, team, adapter, ruleset, or production state.

The server must reject mutation events from clients that declare `panel: "overlay"` or `role: "OVERLAY"` in `client:hello`.

This is not a full security system. v0.1 does not require user login. It is a local production safety guardrail.

---

# 2. Shared Envelope Contracts

## 2.1 `ApiResponse<T>`

All REST endpoints must return the same envelope shape:

```ts
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

Successful response:

```json
{
  "ok": true,
  "data": {
    "status": "LIVE"
  }
}
```

Error response:

```json
{
  "ok": false,
  "error": {
    "code": "DRAFT_INVALID_ACTION",
    "message": "Cannot lock a hero while the draft is paused.",
    "details": {
      "draftId": "draft_001",
      "actionId": "ban-1-blue:slot-0",
      "currentStatus": "PAUSED"
    }
  }
}
```

## 2.2 Response Rules

REST handlers must follow these rules:

- `ok: true` responses must include `data`.
- `ok: false` responses must include `error`.
- Do not return raw thrown errors directly.
- Do not return HTML error pages from API routes.
- Do not return inconsistent shapes such as `{ success: true }`, `{ result: ... }`, or raw objects.
- Do not include functions, sockets, class instances, file handles, or non-serializable values.
- Timestamps must be ISO 8601 strings.

## 2.3 HTTP Status Guidance

Use HTTP status codes for transport meaning and `error.code` for machine-readable application meaning.

Recommended mapping:

| Case | HTTP Status | `ApiResponse` |
|---|---:|---|
| Successful read | 200 | `ok: true` |
| Successful mutation | 200 or 201 | `ok: true` |
| Invalid JSON / malformed body | 400 | `ok: false` |
| Missing required field | 400 | `ok: false` |
| Unknown ID | 404 | `ok: false` |
| Invalid state transition | 409 | `ok: false` |
| Missing confirmation for dangerous action | 409 | `ok: false` |
| Unsupported adapter / feature | 422 | `ok: false` |
| Server/audit write failure | 500 | `ok: false` |
| Route not found | 404 | `ok: false` |

## 2.4 `SocketEnvelope<T>`

All Socket.IO server-to-client payloads should use the shared envelope shape:

```ts
export interface SocketEnvelope<T> {
  type: string;
  timestamp: string;
  operatorId?: string;
  payload: T;
}
```

Example:

```json
{
  "type": "draft:updated",
  "timestamp": "2026-05-22T12:00:01.000Z",
  "operatorId": "local-operator",
  "payload": {
    "draftId": "draft_001",
    "reason": "HERO_LOCKED",
    "draft": {}
  }
}
```

For socket errors, use event name `error` and an envelope whose `type` may be specific:

```json
{
  "type": "error:draft-invalid-action",
  "timestamp": "2026-05-22T12:00:02.000Z",
  "payload": {
    "code": "DRAFT_INVALID_ACTION",
    "message": "Cannot lock a hero while the draft is paused.",
    "details": {
      "draftId": "draft_001"
    },
    "correlationId": "req_123"
  }
}
```

---

# 3. Error Response Format

## 3.1 Error Object

Every error must include:

```ts
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
```

Recommended internal shape:

```ts
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  httpStatus?: number;
}
```

Do not expose stack traces to normal API clients.

Stack traces may be logged to local developer console in development mode only.

## 3.2 Error Code Naming Convention

REST `error.code` must use uppercase snake case:

```text
DRAFT_INVALID_ACTION
DRAFT_NOT_FOUND
DRAFT_NOT_LIVE
DRAFT_ACTION_NOT_FOUND
DRAFT_ACTION_ALREADY_LOCKED
DRAFT_DUPLICATE_HERO
DRAFT_UNSUPPORTED_PHASE
DRAFT_CONFIRMATION_REQUIRED
DRAFT_OVERRIDE_REASON_REQUIRED
DRAFT_INCOMPLETE
DRAFT_RULESET_INVALID

PRODUCTION_INVALID_STATE
PRODUCTION_CONFIRMATION_REQUIRED
GRAPHICS_INVALID_TYPE
GRAPHICS_CONFIRMATION_REQUIRED
EMERGENCY_CONFIRMATION_REQUIRED

STATE_NOT_READY
STATE_CONFLICT
EVENT_PACKAGE_NOT_LOADED
ADAPTER_NOT_LOADED
ADAPTER_UNSUPPORTED_GAME
ASSET_MISSING

AUDIT_LOG_WRITE_FAILED
SOCKET_INVALID_PAYLOAD
SOCKET_MUTATION_NOT_ALLOWED
INTERNAL_ERROR
```

Socket error envelope `type` may use lowercase colon form for readability:

```text
error:draft-invalid-action
error:permission-denied
error:state-conflict
error:adapter-not-loaded
error:asset-missing
```

But payload `code` should remain uppercase snake case.

## 3.3 Error Message Rules

Error messages should be human-readable and operator-useful.

Good:

```text
Cannot reset draft without confirmation.
Cannot lock hero because this action slot is already locked.
Cannot take graphic to Program without confirmation.
```

Bad:

```text
bad request
failed
undefined
error
```

## 3.4 Invalid Mutation Rule

Invalid mutations must not mutate state.

This applies to:

- Invalid REST requests.
- Invalid socket mutation events.
- Missing dangerous-action confirmation.
- Draft state conflicts.
- Adapter validation failure.
- Duplicate hero blocking.
- Overlay client mutation attempts.

---

# 4. REST Base Path and Route Rules

## 4.1 Base Path

All REST APIs must live under:

```text
/api
```

Required examples:

```text
GET  /api/health
GET  /api/state
POST /api/drafts/:draftId/start
POST /api/production/take
```

Do not create parallel public API roots such as:

```text
/rest
/server
/backend
/mmobt
```

unless a future version explicitly documents them.

## 4.2 JSON Body Rules

Mutation endpoints must accept JSON request bodies.

Use:

```http
Content-Type: application/json
```

Empty JSON body is allowed only for safe defaults where no payload is needed.

For live mutations, prefer including at least:

```json
{
  "operatorId": "local-operator"
}
```

If operator identity is not implemented yet, the server may default to:

```text
local-operator
```

but the response and audit log should make this visible.

## 4.3 Request Correlation

Where practical, mutation payloads may include:

```ts
correlationId?: string;
```

The server should copy it into:

- Error details.
- Audit log metadata.
- Socket broadcast metadata.

This is optional for v0.1 but useful for debugging live operations.

## 4.4 Read vs Mutation Routes

Use `GET` for reads and `POST` for state-changing operations.

Do not mutate live state from `GET` requests.

Overlays should use only:

```text
GET /api/health
GET /api/state
GET /api/drafts/:draftId
GET /api/production/state
```

or Socket.IO subscriptions.

---

# 5. Health Endpoints

## 5.1 `GET /api/health`

Purpose:

```text
Return current local server health and production-critical status.
```

Required response data should align with `SystemHealth`:

```ts
export interface HealthResponse {
  serverStartedAt: string;
  now: string;
  uptimeSeconds: number;
  loadedEventPackageId?: string;
  currentProductionState?: string;
  socketClients: unknown[];
  adapterStatus: Record<string, unknown>;
  assetStatus: {
    missingAssets: string[];
    warnings: string[];
  };
  emergencyReady: boolean;
  auditLog: {
    path: string;
    writable: boolean;
    lastWriteAt?: string;
    lastError?: string;
  };
}
```

Example:

```json
{
  "ok": true,
  "data": {
    "serverStartedAt": "2026-05-22T11:59:00.000Z",
    "now": "2026-05-22T12:00:00.000Z",
    "uptimeSeconds": 60,
    "loadedEventPackageId": "sample-event",
    "currentProductionState": "DRAFT_READY",
    "socketClients": [],
    "adapterStatus": {
      "generic-moba": { "loaded": true, "heroCount": 10 },
      "lol": { "loaded": true, "heroCount": 20 },
      "aov": { "loaded": true, "heroCount": 10 },
      "hok": { "loaded": true, "heroCount": 10 }
    },
    "assetStatus": {
      "missingAssets": [],
      "warnings": []
    },
    "emergencyReady": true,
    "auditLog": {
      "path": "event-packages/sample-event/logs/production-log.jsonl",
      "writable": true
    }
  }
}
```

## 5.2 `GET /api/health/assets`

Purpose:

```text
Return local asset health and missing/fallback assets.
```

This endpoint is read-only.

It must not download missing assets.

## 5.3 `GET /api/health/clients`

Purpose:

```text
Return connected Socket.IO clients for TD/admin health panel.
```

Client information may include:

```text
socket id
role
panel
connectedAt
lastSeenAt
route
matchId
userAgent where available
```

Do not expose private credentials because v0.1 has no login system.

---

# 6. State Endpoints

## 6.1 `GET /api/state`

Purpose:

```text
Return the full serializable runtime state needed by dashboard, overlay, caster, producer, and operator clients.
```

Recommended response shape:

```ts
export interface FullStateResponse {
  revision: number;
  timestamp: string;
  eventPackageId?: string;
  event?: unknown;
  matches: unknown[];
  teams: unknown[];
  players: unknown[];
  sponsors: unknown[];
  adapters: unknown[];
  currentMatchId?: string;
  currentGameId?: string;
  drafts: Record<string, unknown>;
  production: unknown;
  health: unknown;
}
```

Rules:

- State must be serializable.
- State must not contain sockets, file handles, class instances, timers, or functions.
- State must not expose hidden competitive information.
- State must be usable by a freshly connected client to render current state.

## 6.2 Optional View Filter

If implemented, `GET /api/state?view=overlay` may return a reduced read-only state.

Allowed view values:

```text
admin
operator
producer
caster
overlay
```

For v0.1, a single public-safe full state is acceptable if it contains no hidden information.

Do not implement a complex permission system or login dependency for v0.1.

## 6.3 State Revision

Server runtime state should maintain a monotonically increasing `revision` number.

Increment `revision` after each successful live mutation.

Use `revision` in:

```text
GET /api/state
state:full
state:patch
domain-specific socket events where useful
audit log metadata where useful
```

The exact state store implementation is not defined here, but connected clients need a simple way to detect stale updates.

---

# 7. Event / Match / Team / Player / Sponsor Endpoints

These endpoints expose local event package data.

For TQ-071, read endpoints are required. Mutation endpoints may be implemented later only if clearly scoped and logged.

## 7.1 Event Endpoints

Minimum v0.1:

```text
GET /api/events
GET /api/events/:eventId
```

Optional admin setup routes if implemented:

```text
POST   /api/events
PUT    /api/events/:eventId
DELETE /api/events/:eventId
```

Optional mutation routes must:

- Validate payload.
- Mutate only local runtime/event package state.
- Never require cloud.
- Append audit log if they affect live state.
- Broadcast `state:patch` after success.

## 7.2 Match Endpoints

Minimum v0.1:

```text
GET /api/matches
GET /api/matches/:matchId
```

Optional admin setup routes if implemented:

```text
POST   /api/matches
PUT    /api/matches/:matchId
DELETE /api/matches/:matchId
```

If active match switching is implemented, it is dangerous during live state and must require confirmation.

Recommended active match switch route if needed later:

```text
POST /api/matches/:matchId/activate
```

This route is not required for TQ-071.

## 7.3 Team Endpoints

Minimum v0.1:

```text
GET /api/teams
GET /api/teams/:teamId
```

Optional admin setup routes if implemented:

```text
POST   /api/teams
PUT    /api/teams/:teamId
DELETE /api/teams/:teamId
```

## 7.4 Player Endpoints

Minimum v0.1:

```text
GET /api/players
GET /api/players/:playerId
GET /api/teams/:teamId/players
```

`GET /api/teams/:teamId/players` is optional but useful.

Optional admin setup routes if implemented:

```text
POST   /api/players
PUT    /api/players/:playerId
DELETE /api/players/:playerId
```

## 7.5 Sponsor Endpoints

Minimum v0.1:

```text
GET /api/sponsors
GET /api/sponsors/:sponsorId
```

Optional admin setup routes if implemented:

```text
POST   /api/sponsors
PUT    /api/sponsors/:sponsorId
DELETE /api/sponsors/:sponsorId
```

Sponsor scheduling automation is out of scope for v0.1.

---

# 8. Adapter Endpoints

Adapter endpoints expose game adapter availability and public/manual data.

They must not trigger external asset sync or game-client reading.

## 8.1 `GET /api/adapters`

Purpose:

```text
List loaded adapters and health/capabilities.
```

Recommended response item:

```ts
export interface AdapterSummary {
  gameCode: string;
  displayName: string;
  loaded: boolean;
  heroCount: number;
  rulesetCount: number;
  capabilities: {
    supportsManualDraft: boolean;
    supportsClientReader: boolean;
    supportsIngameHud: boolean;
    supportsPostGameStats: boolean;
    supportsAssetSync: boolean;
  };
  error?: string;
}
```

For v0.1 sample adapters:

```text
supportsManualDraft: true
supportsClientReader: false
supportsIngameHud: false
supportsPostGameStats: false
supportsAssetSync: false
```

If future capabilities are listed as true in documentation, they must not run as active v0.1 runtime features.

## 8.2 `GET /api/adapters/:gameCode`

Purpose:

```text
Return one adapter summary.
```

## 8.3 `GET /api/adapters/:gameCode/heroes`

Purpose:

```text
Return public hero list for manual draft UI.
```

Rules:

- Return generic `Hero[]`.
- Do not return LoL-only champion-select objects.
- Do not fetch internet assets.
- Use local/fallback asset paths.

Optional query:

```text
?q=<search text>
```

## 8.4 `GET /api/adapters/:gameCode/rulesets`

Purpose:

```text
Return default/manual rulesets available for the game.
```

Rules:

- Return generic `DraftRuleset[]`.
- The universal draft engine must interpret them without game-specific logic.
- Do not hardcode LoL rules in server contract.

---

# 9. Draft Endpoints

Draft endpoints expose manual draft operations.

They must follow `docs/BAN_PICK_RULES.md`.

## 9.1 `GET /api/drafts/:draftId`

Purpose:

```text
Return one full draft state.
```

Response:

```ts
ApiResponse<DraftState>
```

If not found:

```text
DRAFT_NOT_FOUND
```

## 9.2 `GET /api/drafts`

Optional but recommended.

Purpose:

```text
List drafts, optionally filtered by matchId or gameId.
```

Example:

```text
GET /api/drafts?matchId=match_001
GET /api/drafts?gameId=game_001
```

## 9.3 `POST /api/drafts`

Purpose:

```text
Create a draft for one game instance using one game-agnostic ruleset.
```

Recommended payload:

```ts
export interface CreateDraftPayload {
  gameId: string;
  matchId?: string;
  gameCode: string;
  rulesetId: string;
  operatorId?: string;
  correlationId?: string;
}
```

Behavior:

- Validate game exists.
- Validate adapter exists.
- Validate ruleset exists.
- Validate ruleset is generic `DraftRuleset`.
- Create draft through `packages/core-draft`.
- Do not start draft automatically unless explicitly documented.
- Append `DRAFT_CREATED` audit log.
- Broadcast after success.

Recommended success events after REST mutation:

```text
state:patch
draft:updated
log:entry
health:update where client/state counts changed
```

## 9.4 `POST /api/drafts/:draftId/start`

Payload:

```ts
export interface DraftStartPayload {
  operatorId?: string;
  correlationId?: string;
}
```

Behavior:

- Call core draft start.
- Append `DRAFT_STARTED`.
- Broadcast `draft:updated`.
- Broadcast `state:patch`.

## 9.5 `POST /api/drafts/:draftId/pause`

Payload:

```ts
export interface DraftPausePayload {
  operatorId?: string;
  reason?: string;
  correlationId?: string;
}
```

Behavior:

- Call core draft pause.
- Append `DRAFT_PAUSED`.
- Broadcast `draft:updated`.
- Broadcast `draft:timer` if timer is implemented.
- Broadcast `state:patch`.

## 9.6 `POST /api/drafts/:draftId/resume`

Payload:

```ts
export interface DraftResumePayload {
  operatorId?: string;
  correlationId?: string;
}
```

Behavior:

- Call core draft resume.
- Append `DRAFT_RESUMED`.
- Broadcast `draft:updated`.
- Broadcast `draft:timer` if timer is implemented.
- Broadcast `state:patch`.

## 9.7 `POST /api/drafts/:draftId/actions/:actionId/hover`

Payload:

```ts
export interface DraftHoverPayload {
  heroId: string | null;
  operatorId?: string;
  correlationId?: string;
}
```

Behavior:

- `heroId: null` may clear hover only if core draft/UI explicitly supports clear-hover.
- Validate draft status is `LIVE`.
- Validate action is current phase and hoverable.
- Validate duplicate hover rules.
- Validate hero exists in adapter hero pool where adapter validation is available.
- Do not advance phase.
- Do not add to locked hero arrays.
- Append `HERO_HOVERED` or `HERO_HOVER_CLEARED`.
- Broadcast `draft:updated`.
- Broadcast `state:patch`.

Hover is a live display change but not a final pick/ban.

## 9.8 `POST /api/drafts/:draftId/actions/:actionId/lock`

Payload:

```ts
export interface DraftLockPayload {
  heroId: string;
  operatorId?: string;
  correlationId?: string;
}
```

Behavior:

- Validate draft status is `LIVE`.
- Validate action belongs to current phase.
- Validate action is not already locked/skipped/cancelled.
- Validate hero exists in adapter hero pool where adapter validation is available.
- Validate duplicate blocking.
- Type and team must come from action slot, not payload.
- Lock through core draft.
- Append one of:

```text
HERO_BANNED
HERO_PICKED
HERO_LOCKED
```

Recommended log event:

```text
HERO_LOCKED
```

with fields:

```text
actionType: BAN or PICK
team: BLUE or RED
heroId
actionId
phaseId
```

This avoids needing separate code branches in audit consumers.

Broadcast:

```text
draft:updated
state:patch
log:entry
draft:timer if timer/phase changed
```

Lock must never be automatic.

## 9.9 `POST /api/drafts/:draftId/undo`

Undo is dangerous because it changes locked live state.

Payload:

```ts
export interface DraftUndoPayload {
  operatorId?: string;
  reason: string;
  confirm: true;
  correlationId?: string;
}
```

Requirements:

- `reason` is required.
- `confirm: true` is required.
- If missing, reject with `DRAFT_CONFIRMATION_REQUIRED`.
- Call `undoLastAction`.
- Append `DRAFT_ACTION_UNDONE`.
- Broadcast `draft:updated`.
- Broadcast `state:patch`.

## 9.10 `POST /api/drafts/:draftId/reset`

Reset is dangerous.

Payload:

```ts
export interface DraftResetPayload {
  operatorId?: string;
  reason: string;
  confirm: true;
  confirmationText?: "RESET_DRAFT";
  correlationId?: string;
}
```

Requirements:

- `reason` is required.
- `confirm: true` is required.
- `confirmationText: "RESET_DRAFT"` is recommended where UI supports typed confirmation.
- Missing confirmation must return `DRAFT_CONFIRMATION_REQUIRED`.
- Reset must not delete append-only audit logs.
- Append `DRAFT_RESET`.
- Broadcast `draft:updated`.
- Broadcast `state:patch`.

## 9.11 `POST /api/drafts/:draftId/complete`

Complete is dangerous because it finalizes draft result.

Payload:

```ts
export interface DraftCompletePayload {
  operatorId?: string;
  confirm: true;
  reason?: string;
  override?: {
    enabled: boolean;
    reason: string;
  };
  correlationId?: string;
}
```

Requirements:

- `confirm: true` is required.
- If draft has incomplete required slots, `override.enabled: true` and `override.reason` are required.
- Normal completion appends `DRAFT_COMPLETED`.
- Incomplete override completion appends both:

```text
DRAFT_MANUAL_OVERRIDE
DRAFT_COMPLETED
```

or one `DRAFT_COMPLETED` entry with:

```json
{
  "hasManualOverride": true,
  "overrideReason": "Referee approved incomplete draft due to remake."
}
```

The chosen convention must be consistent and tested.

Complete must not:

- Auto-fill missing picks.
- Auto-fill missing bans.
- Change match winner.
- Take graphics to Program.
- Trigger production state change unless separately called and logged.

---

# 10. Draft Dangerous Action Confirmation Requirements

## 10.1 Dangerous Draft Actions

The following draft operations require confirmation:

```text
POST /api/drafts/:draftId/undo
POST /api/drafts/:draftId/reset
POST /api/drafts/:draftId/complete
manual override routes/events if implemented
skip action if implemented
timer override if implemented
unlock / edit locked action if implemented
```

## 10.2 Confirmation Payload

Minimum required:

```json
{
  "operatorId": "local-operator",
  "confirm": true,
  "reason": "Operator correction after referee confirmation."
}
```

For reset, preferred:

```json
{
  "operatorId": "local-operator",
  "confirm": true,
  "confirmationText": "RESET_DRAFT",
  "reason": "Wrong ruleset selected before going live."
}
```

For incomplete complete override:

```json
{
  "operatorId": "local-operator",
  "confirm": true,
  "override": {
    "enabled": true,
    "reason": "Referee approved draft completion after technical issue."
  }
}
```

## 10.3 Confirmation Rules

A dangerous action must be rejected when:

- `confirm` is missing or not `true`.
- Required `reason` is missing.
- Required override reason is missing.
- Draft status does not allow the operation.
- The action would violate core draft rules and no explicit override metadata exists.

Rejected dangerous actions must not mutate state.

They may be logged as `INVALID_ACTION_ATTEMPTED` if useful.

---

# 11. Production Endpoints

Production endpoints control global show state and graphics Preview/Program state.

Production Control sits above draft and game adapters.

It must not live under `/games/lol`.

## 11.1 `GET /api/production/state`

Purpose:

```text
Return global production state, graphics preview/program state, and emergency status.
```

Response:

```ts
ApiResponse<ProductionRuntimeState>
```

Recommended shape:

```ts
export interface ProductionRuntimeState {
  state: string;
  graphicTakeState: unknown;
  emergency: {
    active: boolean;
    message?: string;
    triggeredAt?: string;
    triggeredBy?: string;
  };
  revision: number;
  updatedAt: string;
}
```

## 11.2 `POST /api/production/state`

Purpose:

```text
Set global production state.
```

Payload:

```ts
export interface SetProductionStatePayload {
  state: string;
  operatorId?: string;
  reason?: string;
  confirm?: true;
  correlationId?: string;
}
```

Confirmation:

- Required when leaving or entering emergency/critical live states if implementation marks it dangerous.
- Recommended when changing state while a draft is live.

Audit:

```text
PRODUCTION_STATE_CHANGED
```

Broadcast:

```text
production:state
state:patch
log:entry
```

## 11.3 `POST /api/production/preview`

Purpose:

```text
Prepare a graphic payload in Preview without affecting Program.
```

Payload:

```ts
export interface GraphicsPreviewPayload {
  graphicType: string;
  payload?: unknown;
  operatorId?: string;
  correlationId?: string;
}
```

Behavior:

- Validate supported `graphicType`.
- Set preview payload.
- Do not put graphic on Program.
- Append `GRAPHICS_PREVIEWED`.
- Broadcast `graphics:preview`.
- Broadcast `state:patch`.

Confirmation is not normally required for Preview.

## 11.4 `POST /api/production/take`

Take is dangerous because it can affect Program output.

Payload:

```ts
export interface GraphicsTakePayload {
  graphicType?: string;
  operatorId?: string;
  confirm: true;
  reason?: string;
  correlationId?: string;
}
```

Requirements:

- `confirm: true` required.
- Validate preview payload exists unless implementation supports taking a direct payload.
- Move preview to Program.
- Append `GRAPHICS_TAKEN`.
- Broadcast `graphics:program`.
- Broadcast `state:patch`.

Take must not require OBS WebSocket or vMix API.

The system output is the browser-source Program route state, not an external switcher command.

## 11.5 `POST /api/production/clear`

Clear is dangerous because it affects Program output.

Payload:

```ts
export interface GraphicsClearPayload {
  graphicType?: string;
  operatorId?: string;
  confirm: true;
  reason?: string;
  correlationId?: string;
}
```

Requirements:

- `confirm: true` required.
- Clear Program state according to core-production rules.
- Append `GRAPHICS_CLEARED`.
- Broadcast `graphics:clear`.
- Broadcast `state:patch`.

## 11.6 `POST /api/production/emergency`

Emergency trigger/clear is dangerous.

Payload:

```ts
export interface EmergencyPayload {
  active: boolean;
  message?: string;
  operatorId?: string;
  confirm: true;
  reason: string;
  correlationId?: string;
}
```

Behavior:

- `active: true` triggers emergency mode.
- `active: false` clears emergency mode if implemented.
- `confirm: true` required.
- `reason` required.
- Append:

```text
EMERGENCY_TRIGGERED
EMERGENCY_CLEARED
```

- Broadcast:

```text
production:state
graphics:program if emergency changes Program output
state:patch
log:entry
```

Emergency overlay must remain usable even if draft state is incomplete or broken.

---

# 12. Production Dangerous Action Confirmation Requirements

## 12.1 Dangerous Production Actions

Require confirmation:

```text
POST /api/production/take
POST /api/production/clear
POST /api/production/emergency
critical POST /api/production/state changes
active match switch during live state if implemented
winner/result change if implemented
```

## 12.2 Required Payload

Minimum:

```json
{
  "operatorId": "local-operator",
  "confirm": true,
  "reason": "Producer confirmed take to Program."
}
```

## 12.3 Rejection

Without confirmation, return:

```json
{
  "ok": false,
  "error": {
    "code": "PRODUCTION_CONFIRMATION_REQUIRED",
    "message": "This production action requires explicit confirmation."
  }
}
```

or for graphics:

```text
GRAPHICS_CONFIRMATION_REQUIRED
```

or for emergency:

```text
EMERGENCY_CONFIRMATION_REQUIRED
```

No state mutation may occur.

---

# 13. Socket.IO Connection Lifecycle

## 13.1 Connection Sequence

Expected flow:

```text
Client connects to Socket.IO.
Client emits client:hello.
Server records client info.
Server emits state:full to that client.
Server emits health:update to relevant clients.
Server keeps client lastSeenAt updated where practical.
On disconnect, server removes/marks client and broadcasts health:update.
On reconnect, client repeats client:hello and receives latest state:full.
```

## 13.2 Client Hello Event

Event name:

```text
client:hello
```

Payload:

```ts
export interface ClientHelloPayload {
  clientId?: string;
  role?: string;
  panel?: string;
  route?: string;
  matchId?: string;
  draftId?: string;
  version?: string;
  capabilities?: string[];
}
```

Recommended role/panel values:

```text
ADMIN
PRODUCER
DRAFT_OPERATOR
CASTER
OVERLAY
VIEWER

admin-dashboard
producer-panel
draft-operator
caster-panel
overlay-draft
overlay-scorebug
overlay-program
overlay-preview
overlay-emergency
health-panel
```

Behavior:

- The server should accept local clients without login.
- The server should store client info for health.
- The server should treat overlay clients as read-only.
- The server should emit `state:full` after hello.
- If hello payload is invalid, emit socket `error` but may still keep connection in limited viewer mode.

## 13.3 Server Acknowledgement

Optional but recommended server-to-client event:

```text
client:ack
```

Payload:

```ts
export interface ClientAckPayload {
  socketId: string;
  serverStartedAt: string;
  currentRevision: number;
  readOnly: boolean;
}
```

`client:ack` is optional for v0.1.

`state:full` is required.

---

# 14. `state:full` Behavior

Event name:

```text
state:full
```

Sent:

- After `client:hello`.
- After reconnect and re-hello.
- On explicit client request if `state:request-full` is implemented.
- After server decides a client may be stale.

Payload:

```ts
export interface StateFullPayload {
  revision: number;
  timestamp: string;
  state: FullStateResponse;
}
```

Rules:

- Must contain enough state for a fresh client to render immediately.
- Must not contain hidden competitive information.
- Must be serializable JSON.
- Must not contain socket/server internals.
- Must include current draft and production state where available.
- Must be used by overlays after refresh to recover latest state.

---

# 15. `state:patch` / Update Behavior

Event name:

```text
state:patch
```

Purpose:

```text
Tell connected clients that part of state changed after a successful mutation.
```

Payload:

```ts
export interface StatePatchPayload {
  revision: number;
  previousRevision?: number;
  timestamp: string;
  changed: string[];
  patch?: unknown;
  reason: string;
}
```

Example:

```json
{
  "revision": 12,
  "previousRevision": 11,
  "timestamp": "2026-05-22T12:00:20.000Z",
  "changed": ["drafts.draft_001", "production"],
  "reason": "HERO_LOCKED"
}
```

Rules:

- `state:patch` may be minimal.
- Clients must not rely on patch being a full JSON Patch implementation unless explicitly implemented and tested.
- Domain-specific events such as `draft:updated` and `production:state` carry authoritative domain payloads.
- If a client detects a missing revision, it should request or wait for `state:full`.

Optional client event:

```text
state:request-full
```

If implemented, server responds with `state:full`.

---

# 16. Draft Socket Events

Socket events are allowed for dashboard/control clients, but REST remains the primary contract for TQ-072.

If mutation socket events are implemented, they must reuse the same payload shapes, validation, confirmation rules, audit logging, and broadcast rules as REST.

Overlay clients must not use these events.

## 16.1 Server-to-Client Draft Events

Required:

```text
draft:updated
```

Recommended when timer is implemented:

```text
draft:timer
```

Optional:

```text
draft:error
```

but the generic `error` event is preferred.

### `draft:updated`

Payload:

```ts
export interface DraftUpdatedPayload {
  draftId: string;
  matchId?: string;
  gameId?: string;
  revision: number;
  reason:
    | "DRAFT_CREATED"
    | "DRAFT_STARTED"
    | "DRAFT_PAUSED"
    | "DRAFT_RESUMED"
    | "HERO_HOVERED"
    | "HERO_HOVER_CLEARED"
    | "HERO_LOCKED"
    | "DRAFT_ACTION_UNDONE"
    | "DRAFT_RESET"
    | "DRAFT_COMPLETED"
    | "DRAFT_MANUAL_OVERRIDE"
    | "TIMER_ADJUSTED";
  draft: unknown;
}
```

### `draft:timer`

Payload:

```ts
export interface DraftTimerPayload {
  draftId: string;
  revision: number;
  timer: {
    isRunning: boolean;
    phaseStartedAt?: string;
    remainingSeconds: number;
    originalSeconds: number;
    isExpired?: boolean;
  };
}
```

Timer broadcast guidance:

- Do not write JSONL audit log every second.
- Timer ticks may broadcast at a practical cadence only if implemented.
- Timer expiry must not auto-pick, auto-ban, or auto-advance by itself.
- Pause/resume must broadcast timer change.

## 16.2 Client-to-Server Draft Events

Allowed only from operator/admin panels if implemented:

```text
draft:start
draft:pause
draft:resume
draft:hover
draft:lock
draft:undo
draft:reset
draft:complete
```

Recommended payload wrapper:

```ts
export interface DraftSocketMutationPayload<T> {
  draftId: string;
  actionId?: string;
  payload: T;
  correlationId?: string;
}
```

Example:

```json
{
  "draftId": "draft_001",
  "actionId": "ban-1-blue:slot-0",
  "payload": {
    "heroId": "hero_001",
    "operatorId": "local-operator"
  },
  "correlationId": "ui_abc"
}
```

Server behavior:

- Validate panel/role.
- Reuse REST handler/service logic.
- Append audit log.
- Broadcast same events as REST mutation.
- Emit `error` to sender if invalid.
- Do not silently mutate state.

---

# 17. Production Socket Events

## 17.1 Server-to-Client

Required:

```text
production:state
graphics:preview
graphics:program
graphics:clear
```

### `production:state`

Payload:

```ts
export interface ProductionStatePayload {
  revision: number;
  state: unknown;
  reason:
    | "PRODUCTION_STATE_CHANGED"
    | "EMERGENCY_TRIGGERED"
    | "EMERGENCY_CLEARED"
    | "GRAPHICS_PREVIEWED"
    | "GRAPHICS_TAKEN"
    | "GRAPHICS_CLEARED";
}
```

### `graphics:preview`

Payload:

```ts
export interface GraphicsPreviewEventPayload {
  revision: number;
  graphicType: string;
  previewPayload: unknown;
}
```

### `graphics:program`

Payload:

```ts
export interface GraphicsProgramEventPayload {
  revision: number;
  graphicType: string;
  programPayload: unknown;
}
```

### `graphics:clear`

Payload:

```ts
export interface GraphicsClearEventPayload {
  revision: number;
  graphicType?: string;
  clearedAt: string;
}
```

## 17.2 Client-to-Server

Allowed only from producer/admin panels if implemented:

```text
production:set-state
graphics:preview
graphics:take
graphics:clear
emergency:trigger
```

Recommended payloads mirror REST production payloads.

Server must reject these from overlay clients.

---

# 18. Graphics Preview / Program / Clear Events

## 18.1 Preview

Preview means:

```text
Prepare graphic off-air.
Do not affect Program output.
```

Events:

```text
REST:   POST /api/production/preview
Socket: graphics:preview
Audit:  GRAPHICS_PREVIEWED
```

## 18.2 Program

Program means:

```text
Graphic is intended to be on live output route.
```

Events:

```text
REST:   POST /api/production/take
Socket: graphics:program
Audit:  GRAPHICS_TAKEN
```

Take to Program requires confirmation.

## 18.3 Clear

Clear means:

```text
Remove or clear the active Program graphic state.
```

Events:

```text
REST:   POST /api/production/clear
Socket: graphics:clear
Audit:  GRAPHICS_CLEARED
```

Clear requires confirmation.

## 18.4 No External Switcher Dependency

Preview / Program / Clear controls only affect toolkit state and browser-source overlay routes.

They must not require:

```text
OBS WebSocket
vMix API
Companion
Stream Deck
hardware switcher API
```

Those can be future optional integrations only.

---

# 19. Health Socket Events

## 19.1 `health:update`

Sent when:

- A client connects.
- A client sends hello.
- A client disconnects.
- Adapter/event package health changes.
- Audit log health changes.
- Emergency readiness changes.
- Server wants health dashboard to refresh.

Payload:

```ts
export interface HealthUpdatePayload {
  revision: number;
  health: unknown;
}
```

Do not emit health updates every second unless needed.

## 19.2 Client Heartbeat

Socket.IO already has ping/pong.

Optional client event:

```text
client:heartbeat
```

If implemented, update `lastSeenAt`.

Do not build a complex cloud presence system for v0.1.

---

# 20. Log Socket Events

## 20.1 `log:entry`

Sent after a successful append-only JSONL audit log entry.

Payload:

```ts
export interface LogEntryPayload {
  entry: AuditLogEntry;
}
```

Recommended audit log entry shape:

```ts
export interface AuditLogEntry {
  timestamp: string;
  event: string;
  operatorId?: string;
  matchId?: string;
  gameId?: string;
  draftId?: string;
  actionId?: string;
  team?: string;
  heroId?: string;
  productionState?: string;
  graphicType?: string;
  reason?: string;
  revision?: number;
  metadata?: Record<string, unknown>;
}
```

Rules:

- Do not broadcast sensitive hidden information.
- Do not include raw stack traces.
- Do not log timer ticks every second.
- Do log important live mutations.

---

# 21. Socket Error Event Format

## 21.1 Event Name

Use:

```text
error
```

## 21.2 Payload

Use `SocketEnvelope<SocketErrorPayload>`:

```ts
export interface SocketErrorPayload {
  code: string;
  message: string;
  details?: unknown;
  correlationId?: string;
}
```

Example:

```json
{
  "type": "error:socket-mutation-not-allowed",
  "timestamp": "2026-05-22T12:01:00.000Z",
  "payload": {
    "code": "SOCKET_MUTATION_NOT_ALLOWED",
    "message": "Overlay clients cannot mutate live state.",
    "details": {
      "panel": "overlay-draft",
      "event": "draft:lock"
    },
    "correlationId": "overlay_001"
  }
}
```

## 21.3 Socket Error Rules

- Emit error to the requesting socket.
- Do not broadcast validation errors to all clients unless operationally useful.
- Do not mutate state on socket errors.
- Use same error codes as REST when possible.
- Include correlation ID when the client provided one.

---

# 22. Reconnect Behavior

## 22.1 Client Responsibilities

Dashboard, operator, producer, caster, and overlay clients should:

- Auto-reconnect.
- Re-send `client:hello`.
- Treat disconnected state visibly.
- Wait for `state:full` after reconnect.
- Avoid assuming local stale state is current.

Overlay debug mode should show:

```text
socket connected/disconnected
last state revision
last state timestamp
route
matchId
```

## 22.2 Server Responsibilities

On reconnect:

- Treat client as a fresh connection.
- Store/update client health.
- Emit `state:full`.
- Emit `health:update`.

The server does not need to replay every missed patch in v0.1.

`state:full` is the recovery mechanism.

## 22.3 Stale Revision Handling

If clients receive a `state:patch` with a revision gap, they should request full state if supported or wait for the next `state:full`.

The implementation should not require a complex event-sourcing replay system in v0.1.

---

# 23. Broadcast Rules After REST Mutations

Every successful REST mutation must follow this sequence conceptually:

```text
1. Parse request.
2. Validate route params and body.
3. Validate current state.
4. Validate dangerous-action confirmation if required.
5. Compute next state without mutating old state where practical.
6. Build audit log entry.
7. Append audit log entry to JSONL.
8. Commit in-memory state and increment revision.
9. Return ApiResponse<T>.
10. Broadcast Socket.IO domain event(s).
11. Broadcast state:patch.
12. Broadcast log:entry.
13. Broadcast health:update if health/client/log status changed.
```

If audit log append fails before commit:

- Return `AUDIT_LOG_WRITE_FAILED`.
- Do not commit mutation.
- Update health/error state where possible.

If a mutation is safe to complete but log write warning is unavoidable, this must be explicitly documented in implementation handoff. Silent success with missing audit log is not acceptable for important live actions.

## 23.1 Draft Mutation Broadcasts

| REST Mutation | Required Socket Broadcasts |
|---|---|
| `POST /api/drafts` | `draft:updated`, `state:patch`, `log:entry` |
| `POST /api/drafts/:id/start` | `draft:updated`, `state:patch`, `log:entry` |
| `POST /api/drafts/:id/pause` | `draft:updated`, `draft:timer`, `state:patch`, `log:entry` |
| `POST /api/drafts/:id/resume` | `draft:updated`, `draft:timer`, `state:patch`, `log:entry` |
| `POST /api/drafts/:id/actions/:actionId/hover` | `draft:updated`, `state:patch`, `log:entry` |
| `POST /api/drafts/:id/actions/:actionId/lock` | `draft:updated`, `draft:timer` if phase changed, `state:patch`, `log:entry` |
| `POST /api/drafts/:id/undo` | `draft:updated`, `draft:timer` if timer changed, `state:patch`, `log:entry` |
| `POST /api/drafts/:id/reset` | `draft:updated`, `draft:timer`, `state:patch`, `log:entry` |
| `POST /api/drafts/:id/complete` | `draft:updated`, `state:patch`, `log:entry` |

## 23.2 Production Mutation Broadcasts

| REST Mutation | Required Socket Broadcasts |
|---|---|
| `POST /api/production/state` | `production:state`, `state:patch`, `log:entry` |
| `POST /api/production/preview` | `graphics:preview`, `production:state`, `state:patch`, `log:entry` |
| `POST /api/production/take` | `graphics:program`, `production:state`, `state:patch`, `log:entry` |
| `POST /api/production/clear` | `graphics:clear`, `production:state`, `state:patch`, `log:entry` |
| `POST /api/production/emergency` | `production:state`, `graphics:program` if Program changes, `state:patch`, `log:entry` |

---

# 24. Audit Log Event Naming Expectations

Audit log `event` values must use uppercase snake case.

Required v0.1 events:

```text
SERVER_STARTED
EVENT_PACKAGE_LOADED
ADAPTER_LOADED
ADAPTER_LOAD_FAILED

DRAFT_CREATED
DRAFT_STARTED
DRAFT_PAUSED
DRAFT_RESUMED
HERO_HOVERED
HERO_HOVER_CLEARED
HERO_LOCKED
DRAFT_ACTION_UNDONE
DRAFT_RESET
DRAFT_COMPLETED
DRAFT_MANUAL_OVERRIDE
TIMER_ADJUSTED
INVALID_ACTION_ATTEMPTED

PRODUCTION_STATE_CHANGED
GRAPHICS_PREVIEWED
GRAPHICS_TAKEN
GRAPHICS_CLEARED
EMERGENCY_TRIGGERED
EMERGENCY_CLEARED
```

Optional health/client events:

```text
SOCKET_CLIENT_CONNECTED
SOCKET_CLIENT_DISCONNECTED
AUDIT_LOG_WRITE_FAILED
```

Do not log noisy events such as every timer tick unless explicitly needed for debugging and disabled by default.

## 24.1 `HERO_LOCKED` Metadata

Use generic fields:

```json
{
  "event": "HERO_LOCKED",
  "draftId": "draft_001",
  "actionId": "pick-1-blue:slot-0",
  "phaseId": "pick-1-blue",
  "actionType": "PICK",
  "team": "BLUE",
  "heroId": "hero_001"
}
```

Do not use LoL-only fields such as:

```text
championId
summonerId
runePage
spell1Id
spell2Id
```

If a LoL adapter maps a champion to a generic hero, audit log still uses `heroId`.

---

# 25. Append-Only JSONL Relationship

## 25.1 JSONL Is Audit Log, Not Database

v0.1 persistence uses:

```text
local JSON event packages
append-only JSONL audit logs
in-memory runtime state
```

JSONL audit logs must not become a hidden database replacement with complex migrations.

They exist to:

- Record important live actions.
- Support operator/debug review.
- Provide a chronological production trail.
- Help future recovery/export features.

## 25.2 Log Location

Default path:

```text
event-packages/sample-event/logs/production-log.jsonl
```

If a different event package is loaded, logs should be inside that package's `logs/` folder.

## 25.3 Append-Only Rule

Normal live operations must:

- Append one JSON object per line.
- Never rewrite previous lines.
- Never delete previous lines.
- Never truncate the log file.
- Keep each line valid JSON.
- Use ISO timestamps.

Resetting a draft must not delete audit log history.

## 25.4 Recovery Boundary

v0.1 does not require full event-sourcing replay from JSONL.

Acceptable v0.1 behavior:

```text
Server loads event package and initializes runtime state.
Server keeps live state in memory.
Audit log records important changes.
On process restart, server loads event package and may initialize clean state unless recovery is explicitly implemented.
```

If recovery from logs is implemented, it must be documented and tested.

Do not silently rely on untested log replay.

---

# 26. Local-First / No-Cloud Constraints

The server contract must not require:

```text
cloud database
cloud auth
hosted realtime broker
remote asset CDN
internet connection
Riot API
Data Dragon automatic sync
LCU
OBS WebSocket
vMix API
Companion
Stream Deck
player-side software
```

Allowed:

```text
local HTTP server
local Socket.IO
local JSON files
local JSONL logs
local assets
manual sample data
future TODO comments
```

Future integrations may be noted only as future roadmap and must not run as active v0.1 features.

---

# 27. Read-Only Overlay Constraints

Overlay app/routes must be treated as display-only clients.

## 27.1 Allowed Overlay Operations

Overlay clients may:

```text
connect to Socket.IO
send client:hello
receive state:full
receive state:patch
receive draft updates
receive production updates
receive graphics updates
receive health updates
call safe GET endpoints for initial/fallback state
display debug information via ?debug=1
```

## 27.2 Forbidden Overlay Operations

Overlay clients must not:

```text
POST to /api/drafts/*
POST to /api/production/*
emit draft:* mutation events
emit production:set-state
emit graphics:take
emit graphics:clear
emit emergency:trigger
hold hidden admin controls
expose hidden competitive information
```

## 27.3 Server Guard

If an overlay emits a mutation event, server must reject it with:

```text
SOCKET_MUTATION_NOT_ALLOWED
```

No state mutation may occur.

---

# 28. Manual-First Draft Constraints

The API/socket layer must preserve `docs/BAN_PICK_RULES.md`.

Specifically:

- Timer expiry does not auto-pick.
- Timer expiry does not auto-ban.
- Timer expiry does not auto-advance because of time alone.
- Lock is always an operator action.
- Hover is temporary and non-final.
- Lock result type/team comes from the action slot.
- Duplicate blocking follows `DraftRuleset.allowDuplicateHeroes`.
- Manual override requires metadata and logging.
- Reset/complete/undo require confirmation.
- The universal draft engine remains game-agnostic.
- Server does not read LoL champion select.
- Server does not read player PCs.
- Server does not write to player PCs.

---

# 29. Out-of-Scope Guardrails

Do not add these to v0.1 API/socket contract:

```text
LoL LCU reader endpoints
LoL champion select auto-sync socket events
Data Dragon automatic sync endpoints
LoL in-game HUD APIs
OBS WebSocket control endpoints
vMix API endpoints
Companion / Stream Deck event endpoints
SQLite / Prisma database APIs
cloud sync APIs
user login / auth as required runtime dependency
player-side automation
auto-pick
auto-ban
hidden competitive info channels
advanced sponsor scheduling automation
PNG export as required v0.1 feature
AI match report endpoints
```

Do not create routes such as:

```text
/api/lol/lcu
/api/lol/champion-select
/api/datadragon/sync
/api/obs/take
/api/vmix/input
/api/auth/login
/api/cloud/sync
```

Clean future TODO comments are allowed only if they do not create active runtime behavior.

---

# 30. Automated Verification Expectations

Future coding agents implementing TQ-070 to TQ-074 should add or run tests that prove this contract.

## 30.1 TQ-070 Verification

Required:

```bash
pnpm --filter @*/server test
pnpm --filter @*/server typecheck
pnpm typecheck
pnpm build
curl http://localhost:3000/api/health
```

Expected tests:

- Server starts locally.
- `GET /api/health` returns `ApiResponse<SystemHealth>`.
- Invalid API route returns `ApiResponse` error, not HTML.
- Health response contains no cloud dependency.

## 30.2 TQ-071 Verification

Required:

```bash
pnpm --filter @*/server test
pnpm test
pnpm typecheck
pnpm build
curl http://localhost:3000/api/state
curl http://localhost:3000/api/adapters
```

Expected tests:

- Server loads sample event package.
- Server loads Generic, LoL sample, AOV, HoK adapters.
- `GET /api/state` returns serializable full state.
- `GET /api/adapters` returns adapter status and hero counts.
- LoL adapter reports no active LCU/Data Dragon/in-game HUD runtime feature.

## 30.3 TQ-072 Verification

Expected tests:

- Draft create returns `ok: true`.
- Draft start/pause/resume returns `ok: true`.
- Hover updates state but does not lock hero.
- Lock updates state and appends JSONL.
- Duplicate hero returns `DRAFT_DUPLICATE_HERO`.
- Reset without confirmation returns `DRAFT_CONFIRMATION_REQUIRED`.
- Complete without confirmation returns `DRAFT_CONFIRMATION_REQUIRED`.
- Incomplete complete without override reason returns `DRAFT_OVERRIDE_REASON_REQUIRED`.
- Invalid draft action does not mutate state.
- Audit log lines parse as JSON.

JSONL parse check:

```bash
node -e "const fs=require('fs'); const p='event-packages/sample-event/logs/production-log.jsonl'; if(fs.existsSync(p)){ for(const line of fs.readFileSync(p,'utf8').split(/\n/).filter(Boolean)) JSON.parse(line); }"
```

## 30.4 TQ-073 Verification

Expected tests:

- `GET /api/production/state` returns production state.
- Production state change appends `PRODUCTION_STATE_CHANGED`.
- Preview appends `GRAPHICS_PREVIEWED`.
- Take without confirmation is rejected.
- Take with confirmation appends `GRAPHICS_TAKEN`.
- Clear without confirmation is rejected.
- Emergency trigger without confirmation is rejected.
- Emergency trigger with confirmation appends `EMERGENCY_TRIGGERED`.
- No OBS/vMix integration is required.

Static guardrail:

```bash
grep -R "OBSWebSocket\|vMix\|Companion\|StreamDeck" apps/server packages/core-production || true
```

## 30.5 TQ-074 Verification

Expected Socket.IO integration tests:

```text
client receives state:full after client:hello
draft lock broadcasts draft:updated
draft lock broadcasts state:patch
production state change broadcasts production:state
graphics preview broadcasts graphics:preview
graphics take broadcasts graphics:program
graphics clear broadcasts graphics:clear
audit log append broadcasts log:entry
client reconnect receives latest state:full
invalid socket action emits error
overlay client mutation attempt emits SOCKET_MUTATION_NOT_ALLOWED
```

## 30.6 Global Static Guardrails

Run searches where practical:

```bash
grep -R "LCU\|DataDragon\|champion-select\|ingame-hud" apps/server packages/shared-types packages/core-draft packages/core-production || true
grep -R "sqlite\|prisma\|cloud\|firebase\|supabase\|auth0" apps/server packages || true
grep -R "OBSWebSocket\|vMix\|Companion\|StreamDeck" apps/server packages || true
```

Matches are acceptable only if they are documentation comments or clearly future-only TODOs and not active runtime features.

---

# 31. Manual Rehearsal Verification Expectations

## 31.1 API Smoke Rehearsal

Once server exists:

```text
Start local server.
Open /api/health.
Open /api/state.
Open /api/adapters.
Confirm sample event package is loaded.
Confirm adapter status shows Generic, LoL sample, AOV, HoK.
Confirm no internet is required.
```

## 31.2 Draft API Rehearsal

Using dashboard UI or API client:

```text
Create draft.
Start draft.
Hover hero.
Lock hero.
Pause draft.
Resume draft.
Undo with confirmation.
Try reset without confirmation and confirm rejection.
Reset with confirmation.
Start again.
Complete draft with confirmation.
Open JSONL log and confirm entries exist.
```

Confirm:

```text
No auto-pick.
No auto-ban.
No LoL-specific behavior is required.
No player-side client is used.
```

## 31.3 Production API Rehearsal

Using producer UI or API client:

```text
Get production state.
Set production state.
Preview draft overlay.
Try Take without confirmation and confirm rejection.
Take with confirmation.
Try Clear without confirmation and confirm rejection.
Clear with confirmation.
Trigger emergency with confirmation.
Confirm JSONL log entries exist.
```

## 31.4 Socket Rehearsal

With two clients open:

```text
Open admin/dashboard client.
Open overlay client.
Both send client:hello.
Both receive state:full.
Perform draft lock from operator.
Confirm both clients receive update.
Refresh overlay.
Confirm overlay receives latest state:full.
Disconnect/reconnect server if supported.
Confirm clients show disconnected/reconnected state.
```

## 31.5 Overlay Read-Only Rehearsal

Confirm:

```text
Overlay has no mutation buttons.
Overlay route does not call POST APIs.
Overlay mutation socket events are rejected by server.
Overlay refresh recovers latest state.
Overlay debug mode shows connection state.
```

---

# 32. Implementation Notes for Coding Agents

## 32.1 Recommended Server Module Boundaries

Suggested structure only:

```text
apps/server/src/index.ts
apps/server/src/api.ts
apps/server/src/socket.ts
apps/server/src/state/runtime-state.ts
apps/server/src/state/state-selectors.ts
apps/server/src/routes/health.ts
apps/server/src/routes/state.ts
apps/server/src/routes/events.ts
apps/server/src/routes/adapters.ts
apps/server/src/routes/drafts.ts
apps/server/src/routes/production.ts
apps/server/src/persistence/audit-log.ts
apps/server/src/services/event-package-loader.ts
apps/server/src/services/adapter-loader.ts
apps/server/src/services/draft-service.ts
apps/server/src/services/production-service.ts
apps/server/src/errors.ts
```

This is guidance, not a forced implementation if existing repo conventions differ.

## 32.2 Shared Constants

If public route/event names are implemented as constants, place them in a shared or server contract module so server/client/tests do not drift.

Recommended constants:

```text
API_BASE_PATH = "/api"

Socket event names:
client:hello
state:full
state:patch
draft:updated
draft:timer
production:state
graphics:preview
graphics:program
graphics:clear
health:update
log:entry
error
```

Do not rename public event names casually.

## 32.3 One Service Path for REST and Socket Mutations

REST handlers and socket mutation handlers should reuse the same service functions.

Correct:

```text
draft REST route → draft service → audit → state commit → broadcast
draft socket event → same draft service → audit → state commit → broadcast
```

Incorrect:

```text
REST has one validation path.
Socket has separate hidden validation path.
Overlay can bypass REST safety through socket.
```

## 32.4 Mutation Commit Discipline

Prefer:

```text
validate → compute next state → write audit log → commit state → broadcast
```

Do not broadcast before state is committed.

Do not return success before a required audit entry is appended.

---

# 33. Final Checklist for Future Coding Agents

Before marking TQ-070 to TQ-074 complete, confirm:

- [ ] REST base path is `/api`.
- [ ] All REST responses use `ApiResponse<T>`.
- [ ] Errors use machine-readable uppercase snake case codes.
- [ ] `GET /api/health` exists.
- [ ] `GET /api/state` exists.
- [ ] Event/match/team/player/sponsor read endpoints exist.
- [ ] Adapter endpoints expose loaded adapters, heroes, and rulesets.
- [ ] Draft endpoints match this contract.
- [ ] Draft dangerous actions require confirmation.
- [ ] Production endpoints match this contract.
- [ ] Production dangerous actions require confirmation.
- [ ] Socket.IO accepts local clients.
- [ ] Client sends `client:hello`.
- [ ] Server emits `state:full` on hello/reconnect.
- [ ] Server emits updates after successful mutations.
- [ ] Reconnect receives latest full state.
- [ ] Socket errors are explicit and machine-readable.
- [ ] Overlay clients are read-only.
- [ ] REST mutations append JSONL audit log entries.
- [ ] Audit logs are append-only JSONL.
- [ ] No cloud, database, login, OBS/vMix, LCU, Data Dragon, or LoL in-game HUD runtime feature was added.
- [ ] No auto-pick or auto-ban exists.
- [ ] No hidden competitive information is exposed.
- [ ] Automated verification was run or honestly marked unavailable.
- [ ] Manual rehearsal expectations are documented in handoff.

---

## End of Document
