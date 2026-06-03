# Ban/Pick Rules Harness — Multi-MOBA Esports Broadcast Toolkit v0.1

## Document Purpose

This document defines the v0.1 Universal Manual Ban/Pick rules harness for the **Multi-MOBA Esports Broadcast Toolkit**.

It is written for Codex / AI coding agents before they implement:

```text
packages/core-draft
```

This is a documentation / harness planning file only. It does not implement application code, generate test fixtures, rewrite the Technical Spec, or modify existing root instructions.

The purpose of this file is to remove ambiguity before these task queue items are executed:

```text
TQ-030 — Create Detailed Ban/Pick Rules Harness Document
TQ-031 — Implement Universal Draft Engine Lifecycle
TQ-032 — Implement Draft Actions, Timer, Undo, and Duplicate Blocking
```

---

## Source Documents

This document should be read together with:

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
WORKING_HANDOFF_AFTER_TASK_QUEUE.md
```

---

## Non-Negotiable v0.1 Principles

The following principles are release blockers.

- Universal Ban/Pick must be game-agnostic.
- LoL In-game HUD must remain a future plugin.
- Production Control must sit above both Universal Draft and game-specific plugins.
- v0.1 must be local-first, manual-first, and production-safe.
- No player-side automation.
- No auto-pick.
- No auto-ban.
- No hidden competitive information exposure.
- No game client, player PC, cloud, internet, OBS WebSocket, vMix API, SQLite, or user login dependency is required for v0.1 Ban/Pick.

---

# 1. Universal Draft Concepts

## 1.1 Draft

A `Draft` is the manual Ban/Pick state for one `GameInstance`.

A draft is not a match, not a full series, not a game adapter, and not a UI panel.

A draft:

- Belongs to one game instance.
- Uses one `DraftRuleset`.
- Uses one game code.
- Contains generated action slots.
- Tracks current status, phase, timer, locked picks, locked bans, and history.
- Must be serializable as JSON.
- Must be safe to operate manually in a live production environment.

## 1.2 Ruleset

A `DraftRuleset` is a declarative configuration that describes the draft order.

The universal core reads the ruleset but does not know whether the ruleset is LoL, AOV, HoK, or a custom game.

Correct:

```text
DraftRuleset says:
phase 1 = BAN, BLUE, count 1
phase 2 = BAN, RED, count 1
phase 3 = PICK, BLUE, count 1
```

Incorrect:

```text
core-draft knows:
LoL blue side bans first
LoL has exactly ten bans
LoL uses Riot champion IDs
```

## 1.3 Phase

A `DraftPhaseDefinition` is a block of draft activity.

A phase defines:

```text
type
team
count
timeSeconds
allowHover
autoAdvance
label
```

A phase can represent one action or multiple action slots.

Example:

```json
{ "id": "red-double-pick-1", "type": "PICK", "team": "RED", "count": 2, "timeSeconds": 60 }
```

This means:

```text
RED has two pick slots during the same phase.
The timer applies to the whole phase.
The phase is complete when both pick slots are locked or explicitly skipped by manual override.
```

## 1.4 Action Slot

An `Action Slot` is the actual operator-fillable slot generated from a phase.

If a phase has `count: 1`, it generates one action slot.

If a phase has `count: 2`, it generates two action slots.

An action slot is the object that moves from:

```text
PENDING → HOVER → LOCKED
```

or, where explicitly allowed by manual override:

```text
PENDING/HOVER → SKIPPED
```

## 1.5 Hero

A `Hero` is any selectable game entity.

For LoL it may represent a champion.
For AOV or HoK it may represent a hero.
For a generic MOBA it may represent a custom hero.

The universal draft engine must treat all of these as generic hero IDs.

The universal draft engine must not contain hero names such as LoL champions, AOV heroes, HoK heroes, Riot references, Data Dragon references, or game-client assumptions.

## 1.6 Adapter

A game adapter provides game-specific data:

```text
hero list
localized names
asset paths
default rulesets
game metadata
adapter capabilities
optional adapter-level validation
```

The adapter does not own the universal draft lifecycle.

The adapter may provide a LoL-style ruleset, but the universal core must treat that ruleset exactly like any other ruleset.

---

# 2. Draft Ruleset Model

## 2.1 Base Model

The v0.1 universal draft core expects the shared `DraftRuleset` shape to remain generic:

```ts
export interface DraftRuleset {
  id: string;
  gameCode: GameCode;
  name: string;
  description?: string;
  allowDuplicateHeroes: boolean;
  globalBanAcrossSeries: boolean;
  globalPickAcrossSeries: boolean;
  phases: DraftPhaseDefinition[];
}
```

```ts
export interface DraftPhaseDefinition {
  id: string;
  type: DraftActionType;
  team: TeamSide | "AUTO" | "NONE";
  count: number;
  timeSeconds: number;
  label?: string;
  allowHover?: boolean;
  autoAdvance?: boolean;
}
```

## 2.2 Required Validation Rules

`validateDraftRuleset` must reject or explicitly error when:

- `id` is empty.
- `gameCode` is empty.
- `phases` is empty.
- A phase `id` is empty.
- Two phases use the same `id`.
- `count` is not a positive integer.
- `timeSeconds` is negative.
- `type` is not a supported `DraftActionType`.
- `team` is invalid for the phase type.
- `BAN` or `PICK` phases use `team: "NONE"`.
- v0.1 implementation cannot safely handle a phase shape and no documented fallback exists.

## 2.3 Defaults

If fields are omitted:

```text
allowHover:
  BAN / PICK: default true
  SIDE_SELECTION / BREAK: default false

autoAdvance:
  default true

label:
  optional; UI may derive from phase id/type/team if missing
```

`timeSeconds: 0` is valid. It means the phase has no countdown or is operator-controlled.

## 2.4 `AUTO` and `NONE` Boundaries

For v0.1:

- `BAN` and `PICK` should normally use `BLUE` or `RED`.
- `AUTO` may be reserved for future side-swap or dynamic rules, but must not be guessed silently.
- `NONE` is allowed for `BREAK` phases.
- `SIDE_SELECTION` may use `BLUE`, `RED`, or `AUTO` only if the future implementation explicitly documents how side ownership is resolved.

If a coding agent cannot implement `AUTO` safely, it must reject `AUTO` in validation and document that it is reserved for future versions. It must not invent hidden side logic.

---

# 3. Draft State Lifecycle

## 3.1 Draft Status Values

The universal draft should use the shared draft status values:

```text
NOT_STARTED
READY
LIVE
PAUSED
COMPLETE
CANCELLED
```

Recommended v0.1 lifecycle:

```text
createDraftState → READY
startDraft → LIVE
pauseDraft → PAUSED
resumeDraft → LIVE
completeDraft → COMPLETE
resetDraft → READY
```

`NOT_STARTED` may be used only if an implementation clearly separates draft allocation from ruleset initialization. For v0.1, `createDraftState` should normally return a `READY` draft with generated action slots.

## 3.2 Allowed Transitions

| Current Status | Allowed Transition | Notes |
|---|---|---|
| READY | LIVE | Start draft |
| LIVE | PAUSED | Pause timer and operator actions |
| PAUSED | LIVE | Resume timer |
| LIVE | COMPLETE | Only when all required slots are complete or completion override is explicit |
| PAUSED | COMPLETE | Allowed only with deliberate confirmation / override |
| READY / LIVE / PAUSED / COMPLETE | READY | Reset with confirmation |
| Any | CANCELLED | Optional; only if implementation explicitly supports cancellation |

## 3.3 Invalid Transitions

Invalid lifecycle operations must return explicit errors and must not mutate state.

Examples:

- `startDraft` on a `COMPLETE` draft must fail.
- `resumeDraft` on a `READY` draft must fail.
- `lockHero` on a `READY` draft must fail.
- `hoverHero` on a `PAUSED` draft must fail unless manual override explicitly allows it.
- `completeDraft` with unfilled required slots must fail unless manual override is explicit.

---

# 4. Action Slot Generation

## 4.1 Generation Timing

Action slots should be generated by `createDraftState`.

The engine should not generate new slots during normal operation unless `resetDraft` rebuilds the draft from the same ruleset.

## 4.2 Generation Order

Action slots must be generated in deterministic order:

```text
ruleset.phases[0], slot 0
ruleset.phases[0], slot 1
...
ruleset.phases[1], slot 0
...
```

Recommended stable action ID pattern:

```text
{phaseId}:slot-{slotIndex}
```

Example:

```text
phase id: red-pick-1
count: 2

generated action ids:
red-pick-1:slot-0
red-pick-1:slot-1
```

The exact ID format may differ if shared types or existing code already define a convention, but IDs must be stable, unique within the draft, and human-readable enough for audit logs.

## 4.3 Slot Index

`slotIndex` is zero-based within the phase.

It is not the global pick/ban number.

Example:

```text
Phase: RED PICK count 2
Action A: slotIndex 0
Action B: slotIndex 1
```

UI can display them as Red Pick 1 and Red Pick 2 for that phase, but the core should not assume display language.

## 4.4 Action Slot Label Presentation

Operator UI and overlays must derive visible action labels from side, action type, and ordinal slot. Labels are presentation logic derived from generic draft actions/ruleset slots, not LoL-specific core behavior.

Required label examples:

```text
BLUE BAN 1
BLUE BAN 2
RED BAN 1
RED BAN 2
BLUE PICK 1
RED PICK 1
```

The UI must not hardcode repeated wrong labels. If the ruleset has phases with `count > 1`, the ordinal should still describe the visible slot order for that side and action type.

## 4.5 Current Phase

`currentPhaseIndex` points to the phase that contains the next incomplete action slot.

A phase is incomplete if at least one generated action slot in that phase has status:

```text
PENDING
HOVER
```

A phase is complete when all generated action slots for that phase have status:

```text
LOCKED
SKIPPED
CANCELLED
```

For v0.1, `SKIPPED` and `CANCELLED` should only occur through explicit manual override or reset/cancel logic.

---

# 5. Draft Phase Semantics

## 5.1 BAN Phase

A `BAN` phase creates ban action slots.

Locking a hero in a ban slot must:

- Set the action slot status to `LOCKED`.
- Set `heroId`.
- Set `lockedAt`.
- Add the hero ID to `bannedHeroIds`.
- Add the hero ID to `lockedHeroIds`.
- Add a draft history entry.
- Advance phase if the phase becomes complete and `autoAdvance` is true.

The universal core must not care what the hero is called.

## 5.2 PICK Phase

A `PICK` phase creates pick action slots.

Locking a hero in a pick slot must:

- Set the action slot status to `LOCKED`.
- Set `heroId`.
- Set `lockedAt`.
- Add the hero ID to `pickedHeroIds`.
- Add the hero ID to `lockedHeroIds`.
- Add a draft history entry.
- Advance phase if the phase becomes complete and `autoAdvance` is true.

## 5.3 SIDE_SELECTION Phase

`SIDE_SELECTION` is in the shared type model, but v0.1 Ban/Pick implementation does not need to implement complex side-selection workflows unless explicitly scoped by the task.

Allowed v0.1 behavior:

- Reject rulesets containing `SIDE_SELECTION` with a clear unsupported-phase error; or
- Represent side selection as a manual metadata action with explicit operator confirmation.

Disallowed behavior:

- Do not silently swap blue/red teams.
- Do not infer side selection from game-specific hidden data.
- Do not place LoL-specific side rules inside `packages/core-draft`.

## 5.4 BREAK Phase

A `BREAK` phase is a timing / production pause inside a draft.

Allowed v0.1 behavior:

- Generate no hero lock behavior.
- Use timer only.
- Require explicit `advancePhase` or `skip` if `autoAdvance` is false.
- Use `team: "NONE"`.

Disallowed behavior:

- Do not auto-pick or auto-ban when a break ends.
- Do not trigger overlay/program changes directly from core-draft.

Production Control may decide how break phases affect overlays, but that belongs above the draft core.

---

# 6. Phase `count > 1` Behavior

## 6.1 Meaning

`count > 1` means multiple action slots exist inside the same phase for the same type and team.

Example:

```json
{ "id": "red-pick-round-1", "type": "PICK", "team": "RED", "count": 2, "timeSeconds": 60 }
```

This means:

```text
RED gets two pick slots in one phase.
The phase timer is shared by both slots.
The phase completes only after both slots are LOCKED or explicitly SKIPPED.
```

## 6.2 Timer

The timer applies to the phase, not to each individual slot.

For `count: 2` and `timeSeconds: 60`:

```text
Both slots share the same 60-second phase timer.
Do not create two separate 60-second timers unless the ruleset has two separate phases.
```

## 6.3 Active Slots

All incomplete slots in the current phase are considered phase-active.

The operator may:

- Hover a hero into a specific active slot.
- Lock a hero into a specific active slot.
- Use the default "next available slot" behavior if no action slot is specified by UI/API.

Recommended default action resolution:

```text
If actionId is provided:
  use that action if it belongs to the current phase and is not complete.

If actionId is not provided:
  use the lowest slotIndex in the current phase with status PENDING or HOVER.
```

## 6.4 Advancement

The engine must not advance from a `count > 1` phase after only one slot is locked.

The engine advances only when all slots in that phase are complete.

## 6.5 Undo in `count > 1`

Undo should remove the most recently locked slot.

If one slot in a two-slot phase remains locked and the other is undone:

```text
currentPhaseIndex returns to that phase.
locked slot remains locked.
undone slot returns to PENDING.
phase is incomplete.
```

---

# 7. Hover vs Lock Behavior

## 7.1 Hover

Hover is a temporary, reversible operator preview.

Hover may be displayed on overlays, but it is not a final pick or ban.

Hover must not:

- Add a hero to `lockedHeroIds`.
- Add a hero to `bannedHeroIds`.
- Add a hero to `pickedHeroIds`.
- Advance the phase.
- Complete a slot.
- Count as a legal final selection.

Hover should:

- Set the action slot status to `HOVER`.
- Set the action slot `heroId`.
- Record operator ID where available.
- Record a meaningful history/audit entry if logging hover is enabled.
- Be replaceable by another hover on the same slot.
- Be clearable by hovering `null` only if the API/UI explicitly supports clear-hover.

## 7.2 Hover Validation

Hover must be rejected when:

- Draft is not `LIVE`.
- Current phase does not allow hover.
- The target action slot is already `LOCKED`, `SKIPPED`, or `CANCELLED`.
- The target action slot is not part of the current phase.
- The hero ID does not exist in the current game adapter hero pool, where adapter validation is available.
- The hero is already locked and `allowDuplicateHeroes` is false.
- The same hero is already hovered in another incomplete slot of the same phase and duplicates are disabled.

If hover validation fails, state must not mutate.

## 7.3 Lock

Lock is the final operator confirmation of a pick or ban.

Lock must be deliberate.

Lock must:

- Validate the draft status.
- Validate the target slot.
- Validate the hero ID.
- Validate duplicate blocking.
- Change the action slot to `LOCKED`.
- Set `lockedAt`.
- Update pick/ban/locked hero arrays.
- Add a meaningful history entry.
- Allow server/API layer to write an audit log entry.
- Broadcast state updates after server integration.

## 7.4 Lock is Not Automation

Lock is always an operator action.

The system must not:

- Lock a hero automatically because the timer reached zero.
- Lock a hero automatically because an external game client changed.
- Lock a hero automatically because a player hovered it.
- Lock a hero automatically from LoL champion select.

Future game-client readers may propose or mirror data only in future versions, with manual override preserved. They must not be part of the v0.1 universal core.

---

# 8. Pick / Ban Behavior

## 8.1 Type Comes from Slot

The action type comes from the generated slot.

A request should not decide whether an action is a pick or ban.

Correct:

```text
action slot type = BAN
lockHero(actionId, heroId)
→ result is a ban
```

Incorrect:

```text
request says type = PICK
target slot is BAN
core changes it to PICK
```

If request type and action slot type conflict, reject the request.

## 8.2 Team Comes from Slot

The team comes from the generated slot.

A request must not silently change slot ownership.

If UI/API sends a team value for safety, the core should verify it matches the slot.

## 8.3 Arrays

When a ban locks:

```text
bannedHeroIds includes heroId
lockedHeroIds includes heroId
pickedHeroIds does not include heroId
```

When a pick locks:

```text
pickedHeroIds includes heroId
lockedHeroIds includes heroId
bannedHeroIds does not include heroId
```

`lockedHeroIds` is the union of locked pick and ban hero IDs in lock order.

## 8.4 Team-Specific Display

The core state may not have separate `bluePicks`, `redPicks`, `blueBans`, `redBans` arrays in the base type.

UI/overlay/server selectors should derive these from `actions`:

```text
blueBans = actions where team BLUE and type BAN and status LOCKED
redBans = actions where team RED and type BAN and status LOCKED
bluePicks = actions where team BLUE and type PICK and status LOCKED
redPicks = actions where team RED and type PICK and status LOCKED
```

Do not duplicate derived arrays unless they are cached with tests proving consistency.

---

# 9. Timer Behavior

## 9.1 Timer Scope

The timer is phase-based.

It is not hero-based and not slot-based.

For a current phase:

```text
timer.originalSeconds = currentPhase.timeSeconds
timer.remainingSeconds = remaining time for the phase
timer.phaseStartedAt = timestamp when the phase timer started or resumed
timer.isRunning = true when actively counting down
```

## 9.2 Start Draft

When `startDraft` runs:

- Draft status becomes `LIVE`.
- `currentPhaseIndex` remains 0.
- Timer is initialized from the first phase.
- `phaseStartedAt` is set to the start timestamp if `timeSeconds > 0`.
- `isRunning` is true if the first phase has a positive timer.
- No hero is selected.

## 9.3 Advance Phase

When a phase completes and advances:

- `currentPhaseIndex` increments to the next incomplete phase.
- Timer resets to the new phase `timeSeconds`.
- `phaseStartedAt` resets to the advance timestamp.
- `isRunning` is true if the new phase has a positive timer.
- No automatic selection occurs.

## 9.4 Timer Reaches Zero

When the timer reaches zero:

- `remainingSeconds` should be reported as 0.
- No pick is locked automatically.
- No ban is locked automatically.
- No phase advances automatically because of time alone.
- Draft remains operator-controlled.
- UI may show expired / overtime state.
- Operator or referee must decide the next action.

If the current shared type does not include `isExpired`, UI can infer expiry from:

```text
remainingSeconds === 0
status === LIVE
current action slots still incomplete
```

## 9.5 Pause

`pauseDraft` must:

- Be allowed only from `LIVE`.
- Set draft status to `PAUSED`.
- Stop timer.
- Persist calculated `remainingSeconds`.
- Clear or freeze `phaseStartedAt` according to implementation convention.
- Add a history entry.

While paused:

- Timer does not count down.
- Hover should be rejected by default.
- Lock should be rejected by default.
- Undo, reset, and complete may be allowed only if deliberate and logged by server/UI.

## 9.6 Resume

`resumeDraft` must:

- Be allowed only from `PAUSED`.
- Set draft status to `LIVE`.
- Keep the same current phase.
- Keep the same incomplete action slots.
- Restart timer using the saved `remainingSeconds`.
- Set `phaseStartedAt` to the resume timestamp.
- Add a history entry.

Resume must not reset the phase to full time unless there is an explicit timer override operation.

## 9.7 Timer Override

A timer override is optional in v0.1.

If implemented, it must be explicit, logged, and operator-controlled.

It must not be used to auto-select heroes.

---

# 10. Pause / Resume Behavior

Pause and resume are draft lifecycle controls.

They are not production state controls.

Production Control may separately move the show to `PAUSE` or `TECH_PAUSE`, but that logic belongs above `packages/core-draft`.

Recommended integration:

```text
Draft pause:
  stops draft timer and blocks draft hover/lock.

Production pause:
  controls overlay/program/emergency or production state.
```

Do not merge these into one hidden state machine inside core-draft.

---

# 11. Undo Behavior

## 11.1 Purpose

Undo exists to fix manual operator mistakes during live draft operation.

Undo must be safe, predictable, and limited.

## 11.2 Default Undo Target

`undoLastAction` should undo the most recent reversible locked draft action.

Default reversible actions:

```text
LOCKED BAN
LOCKED PICK
SKIPPED action caused by manual override
```

Hover does not need undo because hover can be replaced or cleared.

## 11.3 Undo Restrictions

Undo must reject when:

- Draft is `READY` and no action has happened.
- Draft is `COMPLETE`, unless an explicit admin unlock/override flow exists.
- The last locked action cannot be identified.
- Undoing would leave later locked actions ahead of an earlier undone slot in a way that corrupts draft order.
- The undo request targets a non-last locked action without explicit manual override.

## 11.4 Undo Result

Undoing a locked action must:

- Set action status back to `PENDING`.
- Clear `heroId`.
- Clear `lockedAt`.
- Remove the hero from `lockedHeroIds`.
- Remove the hero from `bannedHeroIds` or `pickedHeroIds` according to action type.
- Set `currentPhaseIndex` to the undone action's phase if needed.
- Recalculate timer behavior according to implementation convention.
- Add a history entry.

Recommended timer behavior after undo:

```text
If undo returns to a previous phase:
  set timer to that phase's originalSeconds
  set isRunning according to draft status
  set phaseStartedAt to undo timestamp if LIVE

If undo stays in current phase:
  keep current remainingSeconds where practical
```

This convention must be covered by unit tests.

## 11.5 Undo Is Not Reset

Undo removes only the last reversible draft action.

Reset clears the full draft.

---

# 12. Reset Behavior

## 12.1 Purpose

Reset is a dangerous operation.

It exists for rehearsal, operator mistakes, wrong match/ruleset selection, or show recovery.

## 12.2 Required Safety

Reset must require deliberate confirmation at API/UI level.

Acceptable confirmation patterns:

```text
confirmation token
explicit confirm: true payload
typed confirmation string
modal confirmation in UI before calling API
```

The exact pattern belongs in API/UI contract, but reset must not be easy to trigger accidentally.

## 12.3 Reset Result

`resetDraft` should:

- Return the draft to `READY`.
- Set `currentPhaseIndex` to 0.
- Recreate or clear all action slots back to `PENDING`.
- Clear `lockedHeroIds`.
- Clear `bannedHeroIds`.
- Clear `pickedHeroIds`.
- Reset timer to the first phase.
- Add a `DRAFT_RESET` history entry.
- Let server/API append audit log entry.

Reset should not delete external audit logs.

## 12.4 Reset and History

Core `DraftState.history` may retain a reset history entry.

Append-only JSONL audit logs must not be rewritten or deleted.

---

# 13. Complete Draft Behavior

## 13.1 Purpose

Complete Draft finalizes the Ban/Pick result for downstream overlays, caster panel, audit, and possible export.

## 13.2 Completion Requirements

By default, `completeDraft` may succeed only when:

- Draft is `LIVE` or `PAUSED`.
- All required `BAN` and `PICK` action slots are `LOCKED` or explicitly `SKIPPED`.
- No required current phase remains incomplete.
- Confirmation is deliberate at API/UI level.

## 13.3 Incomplete Completion

Completing an incomplete draft is allowed only through explicit manual override.

Required metadata for override completion:

```text
operatorId
reason
confirmedAt
override: true
```

The server must log this as an override / incomplete completion.

## 13.4 Complete Result

Completing a draft must:

- Set status to `COMPLETE`.
- Stop timer.
- Preserve all locked picks and bans.
- Preserve action order.
- Add history entry.
- Allow serialization into a draft result JSON.

Complete must not:

- Auto-fill missing picks or bans.
- Call a game client.
- Update match winner.
- Trigger production take to Program.
- Modify game adapter data.

---

# 14. Duplicate Hero Blocking

## 14.1 Default Rule

When `allowDuplicateHeroes` is `false`, the same hero ID must not be locked more than once in the same draft.

This applies across:

```text
BAN slots
PICK slots
both teams
all phases
```

Example:

```text
BLUE bans hero_001.
RED cannot ban hero_001.
BLUE cannot pick hero_001.
RED cannot pick hero_001.
```

## 14.2 Hover Blocking

For production clarity, v0.1 should also block hovering an already locked hero when duplicates are disabled.

This prevents overlays from showing an impossible or misleading pending selection.

If the product later wants "hover anything but lock only legal choices", that must be explicitly documented as a future UI option. It must not be silent.

## 14.3 Same-Phase Duplicate Hover

If a `count > 1` phase has two active slots, the same hero should not be hovered into both slots when duplicates are disabled.

## 14.4 Duplicate Rule Source

The duplicate rule comes from `DraftRuleset.allowDuplicateHeroes`.

It must not be hardcoded per game in core-draft.

LoL, AOV, HoK, or Generic adapters may provide default rulesets with `allowDuplicateHeroes: false`, but universal core only reads the boolean.

## 14.5 Series-Wide Global Ban/Pick

The ruleset fields exist:

```text
globalBanAcrossSeries
globalPickAcrossSeries
```

v0.1 core should not infer series memory from hidden state.

Acceptable v0.1 behavior:

- Store these flags in ruleset.
- Validate that they are boolean.
- Expose them to server/UI/adapters.
- Support current-draft duplicate blocking.
- Defer cross-game series enforcement unless the server passes explicit public series-memory context.

Disallowed behavior:

- Reading hidden competitive data to determine global bans.
- Hardcoding HoK, AOV, or LoL series rules into `packages/core-draft`.
- Mutating previous game draft results automatically.

---

# 15. Manual Override Boundaries

## 15.1 Purpose

Manual override exists because live shows need recovery tools.

It must remain manual, explicit, logged, and production-safe.

## 15.2 Allowed Override Categories

Allowed v0.1 manual override behaviors may include:

```text
skip current action slot
force complete an incomplete draft
correct a locked action through undo + lock
mark an action as manually overridden
adjust timer
reset draft
```

If `manualOverrideDraftAction` is implemented in core-draft, it must be generic and explicit.

## 15.3 Required Override Metadata

Every override must include:

```text
operatorId
reason
timestamp
override: true
```

If operator IDs are not fully implemented in v0.1, use a documented local placeholder such as:

```text
operatorId: "local-operator"
```

The absence of a full user-login system must not prevent audit logging.

## 15.4 Override Must Be Logged

Manual override must be recorded in:

```text
DraftState.history
server append-only JSONL audit log
```

The exact server log file is defined elsewhere, but v0.1 expects event package JSONL audit logging.

## 15.5 Manual Override Must Not Become Automation

Manual override must not:

- Auto-pick.
- Auto-ban.
- Read player-side clients.
- Write to player-side clients.
- Read hidden competitive information.
- Silently bypass duplicate rules without metadata.
- Silently edit previous game results.
- Trigger production take to Program automatically.
- Modify game adapter hero data.

## 15.6 Override and Competitive Integrity

If an override intentionally bypasses a draft rule, the UI and audit log must make that visible.

Example:

```text
Override: duplicate hero allowed due to referee decision.
Reason: "Referee approved remake draft recreation."
```

The system must never hide that the rule was bypassed.

---

# 16. Draft History Expectations

## 16.1 Purpose

Draft history supports debugging, replay, audit, and operator handoff.

History inside `DraftState` does not replace append-only JSONL audit logs, but it should make current draft state understandable.

## 16.2 Required History Events

Core draft should record meaningful entries for:

```text
DRAFT_CREATED
DRAFT_STARTED
DRAFT_PAUSED
DRAFT_RESUMED
HERO_HOVERED
HERO_LOCKED
PHASE_ADVANCED
ACTION_UNDONE
DRAFT_RESET
DRAFT_COMPLETED
MANUAL_OVERRIDE
TIMER_ADJUSTED if implemented
```

Timer ticks every second should not create history entries.

## 16.3 History Entry Shape

Use the shared `DraftHistoryEntry` shape:

```ts
export interface DraftHistoryEntry {
  id: string;
  timestamp: string;
  operatorId?: string;
  action: string;
  before?: unknown;
  after?: unknown;
}
```

`before` and `after` should be compact enough to avoid huge state bloat.

Recommended:

```text
before:
  status
  currentPhaseIndex
  action id/status/heroId
  relevant arrays

after:
  status
  currentPhaseIndex
  action id/status/heroId
  relevant arrays
```

## 16.4 History Must Be Serializable

No functions, class instances, sockets, DOM nodes, timers, or adapter instances may be stored inside history.

---

# 17. Draft Result Serialization

## 17.1 Purpose

After completion, the system must export or serialize a draft result as JSON.

The result is used by:

```text
server API
overlay
caster panel
audit logs
future post-game graphics
future archive/export flows
```

## 17.2 Required Result Content

A serialized draft result should include:

```text
draftId
gameId
matchId where available
gameCode
rulesetId
status
completedAt
actions in order
blue bans
red bans
blue picks
red picks
all locked hero IDs
skipped actions
override markers
history or history reference
```

Recommended documentation-only shape:

```ts
export interface DraftResultSnapshot {
  draftId: string;
  gameId: string;
  matchId?: string;
  gameCode: GameCode;
  rulesetId: string;
  status: "COMPLETE";
  completedAt: string;
  actions: DraftAction[];
  teams: {
    blue: {
      bans: DraftAction[];
      picks: DraftAction[];
    };
    red: {
      bans: DraftAction[];
      picks: DraftAction[];
    };
  };
  lockedHeroIds: string[];
  skippedActionIds: string[];
  hasManualOverride: boolean;
}
```

This shape is guidance only. If shared types define a different official shape later, update this document or the API contract accordingly.

## 17.3 Hero Display Data

The draft result should store hero IDs.

Display names and icons should be resolved by game adapter / UI / overlay.

Do not store LoL-specific champion fields in the universal result.

## 17.4 Serialization Safety

Serialization must:

- Produce plain JSON.
- Be stable across server/dashboard/overlay.
- Include enough information to reconstruct the draft order.
- Not include hidden competitive information.
- Not include player-side client data.
- Not require internet.

---

# 18. Game Adapter Boundary

## 18.1 Adapter Responsibilities

A game adapter may provide:

```text
gameCode
displayName
hero list
localized names
role tags
local asset paths
default rulesets
safe fallback asset paths
adapter capabilities
adapter-level validation
```

## 18.2 Adapter Must Not Own Universal Lifecycle

Game adapters must not implement:

```text
startDraft
pauseDraft
resumeDraft
advancePhase
undoLastAction
resetDraft
completeDraft
timer lifecycle
global production state
Socket.IO broadcasting
REST route handlers
audit log writing
```

They may validate game-specific restrictions only if those restrictions are based on public/manual data and do not contaminate universal core.

## 18.3 LoL Adapter Boundary

For v0.1, `/games/lol` may include:

```text
adapter.ts
full practical static local champion data
local or placeholder asset paths
LoL-style sample ruleset
pre-event/static Data Dragon import tooling for generated local metadata
future TODO comments
```

For v0.1, `/games/lol` must not include active runtime implementation of:

```text
LCU reader
champion select auto-sync
active runtime Data Dragon sync
LoL in-game HUD
objective tracker
post-game stats reader
observer PC receiver
```

Clean future TODOs are allowed only if they are clearly not active v0.1 runtime features.

## 18.4 AOV and HoK Adapter Boundary

For v0.1, `/games/aov` and `/games/hok` may include:

```text
sample hero data
sample rulesets
local or placeholder asset paths
adapter capability declarations
```

They must not depend on LoL data structures or LoL adapter code.

---

# 19. What Belongs in `packages/core-draft`

`packages/core-draft` may contain:

```text
createDraftState
startDraft
pauseDraft
resumeDraft
resetDraft
completeDraft
getCurrentPhase
getCurrentActionSlots
validateDraftRuleset
hoverHero
lockHero
advancePhase
undoLastAction
calculateTimerState
validateDraftAction
serializeDraftResult
manualOverrideDraftAction if explicitly scoped
pure helper functions
unit tests for generic draft behavior
```

It may contain generic constants such as:

```text
DRAFT_STATUS values
DRAFT_ACTION_STATUS values
generic error codes
```

It must remain:

```text
game-agnostic
UI-free
server-free
Socket.IO-free
file-system-free
internet-free
adapter-import-free
serializable
testable as pure logic
```

It must not contain:

```text
LoL champion names
Riot API references
LCU references
Data Dragon references
AOV-only hero assumptions
HoK-only hero assumptions
OBS/vMix logic
React components
Socket.IO emitters
REST handlers
audit log file writing
database access
player-side automation
auto-pick
auto-ban
```

---

# 20. What Belongs in `/games/<game>`

Each `/games/<game>` folder may contain:

```text
adapter implementation
sample hero/champion data
default rulesets for that game
asset lookup logic
local fallback asset references
game metadata
adapter capability declarations
adapter-level validation helpers
adapter tests
```

Examples:

```text
/games/generic-moba
/games/lol
/games/aov
/games/hok
```

Game folders must not become hidden copies of core-draft.

They should import shared types and provide data/configuration to the universal engine.

---

# 21. Ruleset Examples

These examples are documentation examples.

They are not test fixtures and should not be copied into implementation blindly without validation.

All examples intentionally use generic phase semantics that the universal core can interpret without game-specific logic.

---

## 21.1 Generic MOBA Sample Ruleset

Purpose:

```text
Simple 5v5-style manual draft for rehearsal and adapter testing.
Three bans per team.
Five picks per team.
No duplicate heroes.
```

```json
{
  "id": "generic-moba-standard-5v5",
  "gameCode": "generic-moba",
  "name": "Generic MOBA Standard 5v5",
  "description": "Simple generic manual draft for v0.1 rehearsal.",
  "allowDuplicateHeroes": false,
  "globalBanAcrossSeries": false,
  "globalPickAcrossSeries": false,
  "phases": [
    { "id": "ban-1-blue", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30, "label": "Blue Ban 1", "allowHover": true, "autoAdvance": true },
    { "id": "ban-1-red", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30, "label": "Red Ban 1", "allowHover": true, "autoAdvance": true },
    { "id": "ban-2-blue", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30, "label": "Blue Ban 2", "allowHover": true, "autoAdvance": true },
    { "id": "ban-2-red", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30, "label": "Red Ban 2", "allowHover": true, "autoAdvance": true },
    { "id": "ban-3-blue", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30, "label": "Blue Ban 3", "allowHover": true, "autoAdvance": true },
    { "id": "ban-3-red", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30, "label": "Red Ban 3", "allowHover": true, "autoAdvance": true },

    { "id": "pick-1-blue", "type": "PICK", "team": "BLUE", "count": 1, "timeSeconds": 30, "label": "Blue Pick 1", "allowHover": true, "autoAdvance": true },
    { "id": "pick-1-red", "type": "PICK", "team": "RED", "count": 2, "timeSeconds": 60, "label": "Red Picks 1-2", "allowHover": true, "autoAdvance": true },
    { "id": "pick-2-blue", "type": "PICK", "team": "BLUE", "count": 2, "timeSeconds": 60, "label": "Blue Picks 2-3", "allowHover": true, "autoAdvance": true },
    { "id": "pick-2-red", "type": "PICK", "team": "RED", "count": 1, "timeSeconds": 30, "label": "Red Pick 3", "allowHover": true, "autoAdvance": true },
    { "id": "pick-3-red", "type": "PICK", "team": "RED", "count": 1, "timeSeconds": 30, "label": "Red Pick 4", "allowHover": true, "autoAdvance": true },
    { "id": "pick-3-blue", "type": "PICK", "team": "BLUE", "count": 2, "timeSeconds": 60, "label": "Blue Picks 4-5", "allowHover": true, "autoAdvance": true },
    { "id": "pick-4-red", "type": "PICK", "team": "RED", "count": 1, "timeSeconds": 30, "label": "Red Pick 5", "allowHover": true, "autoAdvance": true }
  ]
}
```

---

## 21.2 LoL-Style Sample Ruleset

Purpose:

```text
LoL-style manual draft sample.
This belongs in /games/lol or event package rulesets.
It must not be hardcoded into packages/core-draft.
```

This is a LoL-style sample, not an active LCU / Riot / Data Dragon integration.

```json
{
  "id": "lol-style-standard-5v5",
  "gameCode": "lol",
  "name": "LoL-Style Standard 5v5",
  "description": "Manual LoL-style sample ruleset for v0.1. No LCU, no auto-sync, no Data Dragon runtime dependency.",
  "allowDuplicateHeroes": false,
  "globalBanAcrossSeries": false,
  "globalPickAcrossSeries": false,
  "phases": [
    { "id": "ban-blue-1", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30 },
    { "id": "ban-red-1", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30 },
    { "id": "ban-blue-2", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30 },
    { "id": "ban-red-2", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30 },
    { "id": "ban-blue-3", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30 },
    { "id": "ban-red-3", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30 },

    { "id": "pick-blue-1", "type": "PICK", "team": "BLUE", "count": 1, "timeSeconds": 30 },
    { "id": "pick-red-1-2", "type": "PICK", "team": "RED", "count": 2, "timeSeconds": 60 },
    { "id": "pick-blue-2-3", "type": "PICK", "team": "BLUE", "count": 2, "timeSeconds": 60 },
    { "id": "pick-red-3", "type": "PICK", "team": "RED", "count": 1, "timeSeconds": 30 },

    { "id": "ban-red-4", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30 },
    { "id": "ban-blue-4", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30 },
    { "id": "ban-red-5", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30 },
    { "id": "ban-blue-5", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30 },

    { "id": "pick-red-4", "type": "PICK", "team": "RED", "count": 1, "timeSeconds": 30 },
    { "id": "pick-blue-4-5", "type": "PICK", "team": "BLUE", "count": 2, "timeSeconds": 60 },
    { "id": "pick-red-5", "type": "PICK", "team": "RED", "count": 1, "timeSeconds": 30 }
  ]
}
```

---

## 21.3 AOV-Style Sample Ruleset

Purpose:

```text
AOV-style manual sample to prove the system is not LoL-first.
This is a configurable sample, not an official rules guarantee.
```

```json
{
  "id": "aov-style-standard-5v5",
  "gameCode": "aov",
  "name": "AOV-Style Standard 5v5",
  "description": "Manual AOV-style sample ruleset for v0.1 adapter testing.",
  "allowDuplicateHeroes": false,
  "globalBanAcrossSeries": false,
  "globalPickAcrossSeries": false,
  "phases": [
    { "id": "aov-ban-blue-1", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30 },
    { "id": "aov-ban-red-1", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30 },
    { "id": "aov-ban-blue-2", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30 },
    { "id": "aov-ban-red-2", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30 },

    { "id": "aov-pick-blue-1", "type": "PICK", "team": "BLUE", "count": 1, "timeSeconds": 30 },
    { "id": "aov-pick-red-1-2", "type": "PICK", "team": "RED", "count": 2, "timeSeconds": 60 },
    { "id": "aov-pick-blue-2-3", "type": "PICK", "team": "BLUE", "count": 2, "timeSeconds": 60 },
    { "id": "aov-pick-red-3", "type": "PICK", "team": "RED", "count": 1, "timeSeconds": 30 },

    { "id": "aov-ban-red-3", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30 },
    { "id": "aov-ban-blue-3", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30 },
    { "id": "aov-ban-red-4", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30 },
    { "id": "aov-ban-blue-4", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30 },

    { "id": "aov-pick-red-4", "type": "PICK", "team": "RED", "count": 1, "timeSeconds": 30 },
    { "id": "aov-pick-blue-4-5", "type": "PICK", "team": "BLUE", "count": 2, "timeSeconds": 60 },
    { "id": "aov-pick-red-5", "type": "PICK", "team": "RED", "count": 1, "timeSeconds": 30 }
  ]
}
```

---

## 21.4 HoK-Style Sample Ruleset

Purpose:

```text
HoK-style manual sample with series-wide flags exposed.
The universal core must not hide any global-ban logic.
```

```json
{
  "id": "hok-style-global-bp-sample",
  "gameCode": "hok",
  "name": "HoK-Style Global Ban/Pick Sample",
  "description": "Manual HoK-style sample. Series-wide flags are exposed but must be enforced only with explicit public series context.",
  "allowDuplicateHeroes": false,
  "globalBanAcrossSeries": true,
  "globalPickAcrossSeries": true,
  "phases": [
    { "id": "hok-ban-blue-1", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30 },
    { "id": "hok-ban-red-1", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30 },
    { "id": "hok-ban-blue-2", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30 },
    { "id": "hok-ban-red-2", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30 },
    { "id": "hok-ban-blue-3", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30 },
    { "id": "hok-ban-red-3", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30 },
    { "id": "hok-ban-blue-4", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30 },
    { "id": "hok-ban-red-4", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30 },

    { "id": "hok-pick-blue-1", "type": "PICK", "team": "BLUE", "count": 1, "timeSeconds": 30 },
    { "id": "hok-pick-red-1-2", "type": "PICK", "team": "RED", "count": 2, "timeSeconds": 60 },
    { "id": "hok-pick-blue-2-3", "type": "PICK", "team": "BLUE", "count": 2, "timeSeconds": 60 },
    { "id": "hok-pick-red-3", "type": "PICK", "team": "RED", "count": 1, "timeSeconds": 30 },
    { "id": "hok-pick-red-4", "type": "PICK", "team": "RED", "count": 1, "timeSeconds": 30 },
    { "id": "hok-pick-blue-4-5", "type": "PICK", "team": "BLUE", "count": 2, "timeSeconds": 60 },
    { "id": "hok-pick-red-5", "type": "PICK", "team": "RED", "count": 1, "timeSeconds": 30 }
  ]
}
```

---

# 22. Automated Verification Expectations

Future implementation of `packages/core-draft` must include automated verification for the following.

## 22.1 Ruleset Validation

Test:

```text
valid ruleset passes
empty phases fail
duplicate phase IDs fail
count <= 0 fails
negative timeSeconds fails
BAN/PICK with team NONE fails
unsupported AUTO behavior fails if not implemented
```

## 22.2 Draft Lifecycle

Test:

```text
createDraftState returns READY state
startDraft moves READY to LIVE
pauseDraft moves LIVE to PAUSED and freezes timer
resumeDraft moves PAUSED to LIVE and preserves remaining time
resetDraft returns to READY and clears locked selections
completeDraft moves valid complete draft to COMPLETE
invalid lifecycle transitions do not mutate state
```

## 22.3 Action Slot Generation

Test:

```text
count 1 creates one slot
count 2 creates two slots
action IDs are unique
slotIndex is correct
actions are ordered by phase order then slotIndex
current phase starts at first incomplete phase
```

## 22.4 Hover and Lock

Test:

```text
hover updates slot to HOVER
hover does not update locked arrays
hover can be replaced
lock after hover locks the selected hero
lock without hover works if heroId is valid
lock updates bannedHeroIds for BAN
lock updates pickedHeroIds for PICK
lock updates lockedHeroIds for both BAN and PICK
invalid hover/lock does not mutate state
```

## 22.5 Phase Advancement

Test:

```text
phase advances after count 1 slot locked
phase does not advance after only one slot in count 2 phase
phase advances after all count 2 slots locked
manual advance rejects incomplete phase unless override/skip is explicit
```

## 22.6 Duplicate Blocking

Test:

```text
locked ban blocks later ban when allowDuplicateHeroes false
locked ban blocks later pick when allowDuplicateHeroes false
locked pick blocks later pick when allowDuplicateHeroes false
duplicate hover is blocked when allowDuplicateHeroes false
duplicates are allowed when allowDuplicateHeroes true
```

## 22.7 Timer

Test:

```text
timer initializes from phase timeSeconds
timer calculates remaining time
timer reaches zero without auto-pick/auto-ban
pause freezes remainingSeconds
resume preserves remainingSeconds
advance phase resets timer to next phase timeSeconds
```

## 22.8 Undo

Test:

```text
undo last locked ban
undo last locked pick
undo in count > 1 phase
undo after phase advancement returns currentPhaseIndex correctly
undo removes hero from locked arrays
undo rejects when no locked action exists
undo rejects non-last action unless override is explicit
```

## 22.9 Reset and Complete

Test:

```text
reset clears actions and arrays
reset records history
complete full draft succeeds
complete incomplete draft rejects without override
complete incomplete draft with explicit override records override
complete does not auto-fill missing heroes
```

## 22.10 Serialization

Test:

```text
DraftState serializes to JSON
serialized result contains ordered actions
serialized result derives blue/red picks and bans correctly
serialized result contains no functions/classes/sockets/DOM nodes
serialized result does not include game-client hidden data
```

## 22.11 Static Guardrails

Run static searches after implementation.

Required core-draft guardrail:

```bash
grep -R "Riot\|LCU\|DataDragon\|champion-select\|/games/lol\|Ahri\|Tulen" packages/core-draft || true
```

Any match inside `packages/core-draft` must be removed unless it appears only in a guardrail test or documentation comment explicitly describing forbidden scope.

Required adapter boundary guardrail:

```bash
grep -R "LCU\|DataDragon\|champion-select-reader\|ingame-hud" games/lol packages/core-draft packages/shared-types || true
```

Any match must be documentation-only or a clearly inactive future TODO under `/games/lol`.

---

# 23. Manual Rehearsal Verification Expectations

Full manual rehearsal occurs after server, dashboard, draft operator panel, overlay, and health page exist.

The rehearsal must verify:

```text
Open admin dashboard.
Open draft operator panel.
Open draft overlay route.
Select or confirm sample match.
Select or confirm game adapter and ruleset.
Start draft.
Hover one hero.
Lock one ban.
Lock one pick.
Run through a count > 1 pick phase.
Pause timer.
Resume timer.
Attempt duplicate hero and confirm it is blocked.
Undo a locked action and confirm state, overlay, and log update.
Complete the full draft.
Confirm overlay shows final draft result.
Confirm server audit log records start, hover, lock, pause/resume, undo, complete.
Reset draft with confirmation.
Run at least one short non-LoL draft using Generic MOBA, AOV, or HoK adapter.
Confirm no player-side software or game API is required.
Disconnect internet and confirm manual workflow still works on local LAN.
```

Failure conditions:

```text
operator cannot complete draft
overlay does not update after lock
count > 1 phase advances too early
timer causes auto-pick or auto-ban
duplicate hero can be locked when disabled
undo corrupts order or arrays
reset can be triggered accidentally
complete can be triggered accidentally
LoL-specific logic appears inside packages/core-draft
hidden competitive information appears in caster or overlay output
```

---

# 24. Out-of-Scope Guardrails

The following are explicitly out of scope for v0.1 Ban/Pick rules.

Do not implement:

```text
LoL LCU reader
LoL champion select auto-sync
LoL active runtime Data Dragon sync
LoL in-game HUD
observer-side objective tracker
post-game stats reader
OBS WebSocket integration
vMix API integration
Bitfocus Companion integration
Stream Deck integration
SQLite / Prisma / database persistence
cloud sync
user login as required runtime dependency
player-side software
player-side automation
auto-pick
auto-ban
hidden competitive information exposure
AI match report generation
advanced animation editor
PNG export
```

Do not move future features into universal draft core.

Future features must remain plugins, adapters, or higher-level production modules.

---

# 25. Implementation Notes for TQ-031

When executing `TQ-031 — Implement Universal Draft Engine Lifecycle`, the coding agent should implement only the lifecycle foundation:

```text
createDraftState
startDraft
pauseDraft
resumeDraft
resetDraft
completeDraft
getCurrentPhase
getCurrentActionSlots
validateDraftRuleset
```

TQ-031 should focus on:

```text
ruleset validation
action slot generation
status transitions
current phase lookup
timer initialization
serializable state
explicit errors
immutability / no mutation on invalid action
```

TQ-031 should not implement LoL sample adapter logic, REST APIs, Socket.IO, overlays, or UI controls.

---

# 26. Implementation Notes for TQ-032

When executing `TQ-032 — Implement Draft Actions, Timer, Undo, and Duplicate Blocking`, the coding agent should implement:

```text
hoverHero
lockHero
advancePhase
undoLastAction
calculateTimerState
validateDraftAction
manualOverrideDraftAction if explicitly scoped
serializeDraftResult
```

TQ-032 should focus on:

```text
ban/pick action behavior
phase count > 1 behavior
hover vs lock
timer pause/resume calculation
duplicate hero blocking
undo locked actions
reset and complete edge cases
manual override boundaries
draft history
draft result serialization
```

TQ-032 should not implement server API, dashboard UI, overlay UI, game adapters, LoL LCU, Data Dragon, or any player-side automation.

---

# 27. Final Checklist for Future Coding Agent

Before claiming `packages/core-draft` complete, verify:

- [ ] Core accepts generic `DraftRuleset`, `Hero`, and `DraftState`.
- [ ] Core does not import from `/games/*`.
- [ ] Core does not know hero/champion names.
- [ ] Core has no Riot / LCU / Data Dragon / champion-select logic.
- [ ] Draft can be created from ruleset.
- [ ] Action slots are generated deterministically.
- [ ] `count > 1` phases behave correctly.
- [ ] Hover is non-final.
- [ ] Lock is final and deliberate.
- [ ] Timer never causes auto-pick or auto-ban.
- [ ] Pause/resume preserves timer state.
- [ ] Undo works for locked actions.
- [ ] Reset requires higher-level confirmation and clears state.
- [ ] Complete requires higher-level confirmation and does not auto-fill.
- [ ] Duplicate hero blocking works when disabled.
- [ ] Manual override is explicit and logged.
- [ ] Invalid actions return explicit errors and do not mutate state.
- [ ] Draft history records meaningful changes.
- [ ] Draft result serializes to JSON.
- [ ] Automated tests cover required lifecycle and action behavior.
- [ ] Manual rehearsal expectations are documented for later UI/server tasks.

---

## End of Document
