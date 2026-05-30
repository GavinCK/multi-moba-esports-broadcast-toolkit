# Task Queue — Multi-MOBA Esports Broadcast Toolkit v0.1

## Document Purpose

This document converts the v0.1 technical roadmap and acceptance criteria into a clear, ordered task queue for Codex / AI coding agents.

It is a harness document. It does **not** implement application code, generate fixtures, rewrite the Technical Spec, or modify existing root instructions.

The goal is to let future AI agents execute one small, safe task at a time without attempting to build the full repository in one pass.

---

## Required Source Documents

Every agent must read these documents before starting any task in this queue:

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

If present, also read task-specific harness files such as:

```text
docs/BAN_PICK_RULES.md
docs/OVERLAY_SPEC.md
docs/OPERATOR_REHEARSAL_CHECKLIST.md
docs/API_SOCKET_CONTRACT.md
docs/EVENT_PACKAGE_SPEC.md
```

If a referenced file is missing, continue with available sources and record the missing file in the handoff summary.

---

## Non-Negotiable v0.1 Principles

The following principles apply to every task:

- Universal Ban/Pick must remain game-agnostic.
- LoL In-game HUD must remain a future plugin.
- Production Control must sit above both Universal Draft and game-specific plugins.
- v0.1 must be local-first, manual-first, and production-safe.
- No player-side automation.
- No auto-pick.
- No auto-ban.
- No hidden competitive information exposure.
- No runtime dependency on internet, cloud services, game APIs, OBS WebSocket, vMix API, SQLite, or player-PC software.

---

## Task Type Labels

Use these labels consistently in handoffs:

```text
DOCS-ONLY          Documentation / harness planning only
SETUP              Repository, tooling, package, script, config setup
CODE-CORE          Shared types, match, draft, production, theme engine
CODE-SERVER        Server runtime, REST API, Socket.IO, audit logs
CODE-UI            Admin dashboard, draft operator, producer, caster panels
CODE-OVERLAY       Browser-source overlay implementation
TESTING            Unit, integration, static guardrail, E2E, visual testing
REHEARSAL          Manual live-production rehearsal and release validation
```

A task may include more than one type only if necessary. Keep mixed tasks small.

---

## Standard Verification Policy

For every task, run the most relevant available commands. Do **not** claim success for commands that do not exist yet.

Preferred root commands once the monorepo exists:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify
```

For early tasks where scripts do not exist yet, record them as:

```text
Not available yet — expected to be introduced by this or a later setup task.
```

For documentation-only tasks, run markdown lint only if it already exists. Otherwise perform a documentation review and state that no code verification was applicable.

---

## Standard Handoff Format for Each Task

Every implementation agent must end with:

```text
Summary:
- ...

Files changed:
- ...

Commands run:
- command: result

Verification:
- Passed: ...
- Failed: ...
- Not run / unavailable: ...

Manual rehearsal:
- Required: yes/no
- Result: ...

Scope guardrails checked:
- ...

Notes / risks:
- ...

Suggested next task:
- ...
```

---

# Phase 0 — Harness, Repo Inspection, and Safety

## TQ-000 — Read Harness Sources and Confirm Scope

**Task Type:** DOCS-ONLY

**Purpose**

Ensure the agent understands the project constraints before touching files.

**Scope**

- Read required source documents.
- Confirm the current task ID and allowed scope.
- Identify whether the task is docs-only, setup, code, testing, or rehearsal.
- Do not modify code.

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
None, unless the user explicitly asks for documentation notes.
```

**Dependencies**

```text
None.
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#1-general-v01-definition-of-complete
docs/ACCEPTANCE_CRITERIA.md#26-out-of-scope-guardrails
```

**Automated Verification**

```bash
# No code command required for this docs-only inspection task.
# If markdown lint exists:
pnpm lint:docs
```

If `pnpm lint:docs` does not exist, record it as unavailable.

**Manual Rehearsal Verification**

```text
Not required.
```

**Out-of-Scope Guardrails**

- Do not start implementation.
- Do not rewrite Technical Spec, AGENTS.md, or Acceptance Criteria.
- Do not introduce v0.2/v0.3/v0.4 features.

**Handoff Notes**

Record the exact task being executed, source documents read, missing files, and any scope ambiguity.

---

## TQ-001 — Inspect Existing Repository and Preserve User Work

**Task Type:** SETUP

**Purpose**

Before creating or modifying any repository structure, inspect what already exists and avoid overwriting user work.

**Scope**

- List current repository root files and folders.
- Identify whether a pnpm monorepo already exists.
- Identify any existing apps, packages, games, event packages, tests, or docs.
- Identify naming conventions and scripts.
- Produce a short repo inspection summary.
- Do not delete files.

**Source Documents to Read**

```text
AGENTS.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
None required.
Optional: WORKING_HANDOFF_AFTER_REPO_INSPECTION.md if the user asks.
```

**Dependencies**

```text
TQ-000
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#2-repository--monorepo-setup
docs/ACCEPTANCE_CRITERIA.md#24-documentation
```

**Automated Verification**

```bash
pwd
ls
find . -maxdepth 3 -type f | sort | head -200
find . -maxdepth 3 -type d | sort | head -200
```

If `package.json` exists:

```bash
cat package.json
```

If pnpm workspace exists:

```bash
pnpm -r list
```

**Manual Rehearsal Verification**

```text
Manual repo tree review only. No live rehearsal required.
```

**Out-of-Scope Guardrails**

- Do not initialize a new repo before confirming no existing repo structure should be preserved.
- Do not delete or rename existing user files.
- Do not implement application features.

**Handoff Notes**

Record existing structure, missing expected folders, available scripts, and recommended next task.

---

# Phase 1 — Monorepo Foundation

## TQ-010 — Create Minimal pnpm Monorepo Skeleton

**Task Type:** SETUP

**Purpose**

Create the minimum repository shape required for the v0.1 toolkit without implementing feature logic.

**Scope**

Create or align the expected skeleton:

```text
apps/server
apps/admin-dashboard
apps/overlay
packages/shared-types
packages/core-match
packages/core-draft
packages/core-production
packages/core-overlay
packages/theme-engine
games/generic-moba
games/lol
games/aov
games/hok
event-packages/sample-event
docs
tests
```

Create or update root workspace files:

```text
package.json
pnpm-workspace.yaml
tsconfig.base.json
README.md
```

Only add minimal placeholder package entry points where required to make workspace discovery possible.

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
package.json
pnpm-workspace.yaml
tsconfig.base.json
README.md
apps/**
packages/**
games/**
event-packages/**
docs/**
tests/**
```

**Dependencies**

```text
TQ-001
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#2-repository--monorepo-setup
docs/ACCEPTANCE_CRITERIA.md#25-testing-and-verification-commands
```

**Automated Verification**

```bash
pnpm install
pnpm -r list
pnpm typecheck
pnpm build
```

If `typecheck` or `build` are not fully meaningful yet, they must still exist or be explicitly reported as unavailable.

**Manual Rehearsal Verification**

```text
Open repo tree and confirm each expected app/package/game/docs folder exists.
No live production rehearsal required.
```

**Out-of-Scope Guardrails**

- Do not implement draft logic yet.
- Do not add LoL LCU reader, Data Dragon sync, in-game HUD, OBS WebSocket, vMix, SQLite, cloud sync, or login.
- Do not create large sample datasets or real production assets.

**Handoff Notes**

Record root scripts created, workspace packages discovered, and any intentionally empty folders.

---

## TQ-011 — Add Baseline TypeScript, Lint, Test, and Build Scripts

**Task Type:** SETUP

**Purpose**

Make the repository verifiable through standard root commands before feature work begins.

**Scope**

- Add TypeScript config inheritance.
- Add package-level scripts for relevant apps/packages.
- Add Vitest baseline where appropriate.
- Add ESLint/Prettier only to the minimum stable level.
- Add root `verify` script.
- Ensure empty or placeholder packages can still typecheck/build cleanly.

**Source Documents to Read**

```text
AGENTS.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
package.json
pnpm-workspace.yaml
tsconfig.base.json
.eslintrc* or eslint.config.*
.prettierrc*
vitest.config.*
apps/*/package.json
packages/*/package.json
games/*/package.json
```

**Dependencies**

```text
TQ-010
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#2-repository--monorepo-setup
docs/ACCEPTANCE_CRITERIA.md#25-testing-and-verification-commands
```

**Automated Verification**

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify
```

**Manual Rehearsal Verification**

```text
Not required.
```

**Out-of-Scope Guardrails**

- Do not add feature implementation beyond minimal entry points.
- Do not introduce heavy frameworks not required by the v0.1 stack.
- Do not use database tooling.

**Handoff Notes**

Record exact scripts added and which commands pass, fail, or remain unavailable.

---

# Phase 2 — Shared Types and Core Contracts

## TQ-020 — Implement Shared Types Package

**Task Type:** CODE-CORE

**Purpose**

Centralize all core TypeScript data contracts so server, dashboard, overlay, and game adapters share the same models.

**Scope**

Implement and export required shared types, including:

```text
GameCode
MatchFormat
TeamSide
EventInfo
Team
Player
Sponsor
SponsorSlot
Match
MatchStatus
GameInstance
GameStatus
Hero
DraftRuleset
DraftPhaseDefinition
DraftState
DraftStatus
DraftAction
DraftActionType
DraftActionStatus
DraftTimerState
DraftHistoryEntry
ProductionState
GraphicType
GraphicTakeState
ThemeConfig
SystemHealth
SocketEnvelope
ApiResponse
GameAdapter
GameAdapterCapabilities
DraftValidationResult
```

Keep types serializable and generic.

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
packages/shared-types/src/**
packages/shared-types/package.json
```

**Dependencies**

```text
TQ-011
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#3-shared-types
docs/ACCEPTANCE_CRITERIA.md#25-testing-and-verification-commands
```

**Automated Verification**

```bash
pnpm --filter @*/shared-types typecheck
pnpm typecheck
pnpm test
pnpm build
```

Also run static searches:

```bash
grep -R "Riot\|LCU\|DataDragon\|SummonerSpell\|champion-select" packages/shared-types || true
```

Matches are acceptable only if they are documentation comments explaining forbidden scope. Prefer no matches.

**Manual Rehearsal Verification**

```text
Manual review only: confirm shared types contain no LoL-only assumptions and can represent Generic MOBA, LoL sample, AOV, and HoK.
```

**Out-of-Scope Guardrails**

- Do not put LoL-only runtime types in shared universal models.
- Do not add user login as a required runtime dependency.
- Do not introduce non-serializable classes or hidden state.

**Handoff Notes**

List exported type groups and any deliberately deferred fields.

---

## TQ-021 — Implement Core Match Models and Validation Helpers

**Task Type:** CODE-CORE

**Purpose**

Build the game-agnostic match/event/team/player/sponsor foundation used by draft, overlays, panels, and server state.

**Scope**

- Implement `packages/core-match` exports.
- Add simple validation/helpers for Event → Match → Game.
- Support match format, team sides, score, game number, status values, sponsor slots.
- Keep package UI-free and game-agnostic.

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
packages/core-match/src/**
packages/core-match/package.json
packages/core-match/**/*.test.ts
```

**Dependencies**

```text
TQ-020
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#4-core-match-system
docs/ACCEPTANCE_CRITERIA.md#25-testing-and-verification-commands
```

**Automated Verification**

```bash
pnpm --filter @*/core-match test
pnpm --filter @*/core-match typecheck
pnpm test
pnpm typecheck
pnpm build
```

Static guardrail:

```bash
grep -R "Riot\|LCU\|DataDragon\|champion-select" packages/core-match || true
```

**Manual Rehearsal Verification**

```text
Manual data review only: confirm match state can represent a BO3 with two teams and score.
No live rehearsal required yet.
```

**Out-of-Scope Guardrails**

- Do not add UI logic.
- Do not hardcode LoL or any specific MOBA into match core.
- Do not add database persistence.

**Handoff Notes**

Record helper functions added and any validation limitations.

---

# Phase 3 — Ban/Pick Rules and Universal Draft Core

## TQ-030 — Create Detailed Ban/Pick Rules Harness Document

**Task Type:** DOCS-ONLY

**Purpose**

Before implementing the universal draft engine, document exact draft rules, phase semantics, edge cases, and guardrails in a dedicated harness file.

**Scope**

Create:

```text
docs/BAN_PICK_RULES.md
```

The document should define:

- Generic draft model.
- Phase semantics.
- `count > 1` behavior.
- Hover vs lock behavior.
- Timer behavior.
- Undo behavior.
- Reset and complete safety.
- Duplicate hero prevention.
- Manual override boundaries.
- Ruleset examples for Generic, LoL-style, AOV-style, HoK-style.
- What must never be game-specific inside `packages/core-draft`.

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
docs/BAN_PICK_RULES.md
```

**Dependencies**

```text
TQ-020
TQ-021
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#5-universal-draft-engine
docs/ACCEPTANCE_CRITERIA.md#6-game-adapter-layer
docs/ACCEPTANCE_CRITERIA.md#26-out-of-scope-guardrails
```

**Automated Verification**

```bash
# If docs lint exists:
pnpm lint:docs
```

If no docs lint exists, record as unavailable and perform manual documentation review.

**Manual Rehearsal Verification**

```text
Not required, but the document should include future rehearsal checks for a full manual draft.
```

**Out-of-Scope Guardrails**

- Do not implement code.
- Do not generate test fixtures.
- Do not define LoL LCU reader, Data Dragon sync, or in-game HUD as v0.1 requirements.

**Handoff Notes**

Record the intended use of this file as the source for TQ-031 and TQ-032.

---

## TQ-031 — Implement Universal Draft Engine Lifecycle

**Task Type:** CODE-CORE

**Purpose**

Implement the base game-agnostic draft state lifecycle.

**Scope**

Implement in `packages/core-draft`:

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

Support:

- `DraftRuleset` validation.
- Phase creation.
- Status transitions.
- Serializable state.
- Explicit errors for invalid transitions.

**Source Documents to Read**

```text
AGENTS.md
docs/BAN_PICK_RULES.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
packages/core-draft/src/**
packages/core-draft/**/*.test.ts
```

**Dependencies**

```text
TQ-020
TQ-030
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#5-universal-draft-engine
docs/ACCEPTANCE_CRITERIA.md#25-testing-and-verification-commands
```

**Automated Verification**

```bash
pnpm --filter @*/core-draft test
pnpm --filter @*/core-draft typecheck
pnpm test
pnpm typecheck
pnpm build
```

Static guardrail:

```bash
grep -R "Riot\|LCU\|DataDragon\|champion-select\|Ahri\|Tulen" packages/core-draft || true
```

**Manual Rehearsal Verification**

```text
Not required yet. Manual draft rehearsal starts after UI/server integration.
```

**Out-of-Scope Guardrails**

- Do not import from `/games/*`.
- Do not know champion/hero names.
- Do not connect to game clients or external APIs.

**Handoff Notes**

Record lifecycle functions implemented and test cases covered.

---

## TQ-032 — Implement Draft Actions, Timer, Undo, and Duplicate Blocking

**Task Type:** CODE-CORE

**Purpose**

Complete the universal manual draft behavior required for live ban/pick operation.

**Scope**

Implement in `packages/core-draft`:

```text
hoverHero
lockHero
advancePhase
undoLastAction
calculateTimerState
validateDraftAction
manualOverrideDraftAction if explicitly scoped for v0.1
serializeDraftResult
```

Support:

- Ban and pick actions.
- Phases with `count > 1`.
- Duplicate hero blocking when `allowDuplicateHeroes` is false.
- Timer pause/resume calculations.
- Undo of locked actions.
- Invalid actions must not mutate previous state.
- Draft history entries.

**Source Documents to Read**

```text
AGENTS.md
docs/BAN_PICK_RULES.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
packages/core-draft/src/**
packages/core-draft/**/*.test.ts
```

**Dependencies**

```text
TQ-031
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#5-universal-draft-engine
docs/ACCEPTANCE_CRITERIA.md#25-testing-and-verification-commands
docs/ACCEPTANCE_CRITERIA.md#26-out-of-scope-guardrails
```

**Automated Verification**

```bash
pnpm --filter @*/core-draft test
pnpm --filter @*/core-draft typecheck
pnpm test
pnpm typecheck
pnpm build
```

Required unit tests:

```text
draft creation
start draft
phase advancement
hover
pick/ban lock
duplicate hero blocking
timer pause/resume
undo
reset
complete
invalid actions do not mutate state
```

Static guardrail:

```bash
grep -R "Riot\|LCU\|DataDragon\|champion-select\|/games/lol" packages/core-draft || true
```

**Manual Rehearsal Verification**

```text
Not required yet. Manual rehearsal begins after Draft Operator Panel and Overlay integration.
```

**Out-of-Scope Guardrails**

- Do not auto-pick or auto-ban.
- Do not read game client state.
- Do not implement LoL-only draft rules in core; all rules must come from `DraftRuleset`.

**Handoff Notes**

Record any edge cases not yet handled and whether manual override was implemented or deferred.

---

# Phase 4 — Production Core and Theme Core

## TQ-040 — Implement Core Production State Machine

**Task Type:** CODE-CORE

**Purpose**

Create the global show-control foundation that sits above draft and game adapters.

**Scope**

Implement in `packages/core-production`:

```text
ProductionState values
GraphicTakeState
createInitialProductionState
setProductionState
previewGraphic
takeGraphic
clearGraphic
triggerEmergency
clearEmergency
validateProductionTransition where practical
```

Support Preview / Program concept and emergency state.

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
packages/core-production/src/**
packages/core-production/**/*.test.ts
```

**Dependencies**

```text
TQ-020
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#19-production-control-layer
docs/ACCEPTANCE_CRITERIA.md#13-producer-panel
docs/ACCEPTANCE_CRITERIA.md#18-emergency-overlay
docs/ACCEPTANCE_CRITERIA.md#25-testing-and-verification-commands
```

**Automated Verification**

```bash
pnpm --filter @*/core-production test
pnpm --filter @*/core-production typecheck
pnpm test
pnpm typecheck
pnpm build
```

Static guardrail:

```bash
grep -R "games/lol\|LCU\|DataDragon" packages/core-production || true
```

**Manual Rehearsal Verification**

```text
Not required yet. Manual Preview/Program rehearsal begins after Producer Panel and overlays exist.
```

**Out-of-Scope Guardrails**

- Do not bury production control inside overlay UI.
- Do not make production state LoL-specific.
- Do not require OBS WebSocket/vMix to take or clear graphics.

**Handoff Notes**

Record supported states, graphic types, and safety confirmations expected from UI/API layers.

---

## TQ-041 — Implement Basic Theme Engine

**Task Type:** CODE-CORE

**Purpose**

Provide local JSON theme parsing and safe defaults for overlays.

**Scope**

Implement in `packages/theme-engine`:

```text
loadThemeConfig
validateThemeConfig
mergeThemeWithDefaults
resolveThemeAssetPath
```

Support:

- Colors.
- Typography.
- Safe margins.
- Border radius.
- Animation speed.
- Background/frame/sponsor assets.
- Safe fallbacks for missing values.

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
packages/theme-engine/src/**
packages/theme-engine/**/*.test.ts
```

**Dependencies**

```text
TQ-020
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#20-theme-system
docs/ACCEPTANCE_CRITERIA.md#25-testing-and-verification-commands
```

**Automated Verification**

```bash
pnpm --filter @*/theme-engine test
pnpm --filter @*/theme-engine typecheck
pnpm test
pnpm typecheck
pnpm build
```

**Manual Rehearsal Verification**

```text
Not required yet. Overlay theme rehearsal starts after overlay routes exist.
```

**Out-of-Scope Guardrails**

- Do not build an advanced theme editor.
- Do not require remote asset hosting.
- Do not introduce game-specific assumptions into theme engine.

**Handoff Notes**

Record default theme values and invalid config behavior.

---

# Phase 5 — Game Adapter Layer

## TQ-050 — Implement Game Adapter Interface Loader and Generic MOBA Adapter

**Task Type:** CODE-CORE

**Purpose**

Establish the adapter pattern without making LoL the default architecture.

**Scope**

- Implement adapter loader utility if appropriate.
- Implement `games/generic-moba` adapter.
- Include a small manual hero list and one simple generic ruleset.
- Add tests proving the generic adapter conforms to `GameAdapter`.

**Source Documents to Read**

```text
AGENTS.md
docs/BAN_PICK_RULES.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
games/generic-moba/**
packages/shared-types/src/** only if interface gaps are found
tests/adapters/** or games/generic-moba/**/*.test.ts
```

**Dependencies**

```text
TQ-020
TQ-032
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#6-game-adapter-layer
docs/ACCEPTANCE_CRITERIA.md#5-universal-draft-engine
```

**Automated Verification**

```bash
pnpm --filter @*/generic-moba test
pnpm --filter @*/generic-moba typecheck
pnpm test
pnpm typecheck
pnpm build
```

Static guardrail:

```bash
grep -R "Riot\|LCU\|DataDragon" games/generic-moba packages/core-draft packages/core-match || true
```

**Manual Rehearsal Verification**

```text
Not required yet. Future UI rehearsal should confirm Generic MOBA hero pool appears.
```

**Out-of-Scope Guardrails**

- Do not add official APIs.
- Do not use LoL champion assumptions.
- Do not require internet assets.

**Handoff Notes**

Record hero count, ruleset ID, and adapter capabilities.

---

## TQ-051 — Implement LoL Sample Adapter Without Future Runtime Features

**Task Type:** CODE-CORE

**Purpose**

Provide a LoL sample adapter for manual draft while keeping LCU, Data Dragon sync, and in-game HUD out of active v0.1 runtime.

**Scope**

- Implement `games/lol` adapter.
- Use manually included sample champion data only.
- Provide at least one LoL-style draft ruleset.
- Provide asset lookup with safe local/fallback paths.
- Add clear TODO comments for future v0.3 plugin features only if helpful.

**Source Documents to Read**

```text
AGENTS.md
docs/BAN_PICK_RULES.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
games/lol/adapter.ts
games/lol/sample-champions.ts
games/lol/assets/**
games/lol/**/*.test.ts
```

**Dependencies**

```text
TQ-050
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#6-game-adapter-layer
docs/ACCEPTANCE_CRITERIA.md#26-out-of-scope-guardrails
```

**Automated Verification**

```bash
pnpm --filter @*/lol test
pnpm --filter @*/lol typecheck
pnpm test
pnpm typecheck
pnpm build
```

Static guardrail:

```bash
grep -R "LCU\|DataDragon\|champion-select-reader\|ingame-hud" games/lol packages/core-draft packages/shared-types || true
```

Any match must be documentation-only or explicit future TODO, not active implementation.

**Manual Rehearsal Verification**

```text
Not required yet. Future UI rehearsal should confirm LoL sample champion pool appears manually.
```

**Out-of-Scope Guardrails**

- Do not implement LCU reader.
- Do not implement Data Dragon automatic sync.
- Do not implement LoL in-game HUD.
- Do not import LoL adapter into universal core.

**Handoff Notes**

Record champion count, ruleset ID, and explicit confirmation that no active future LoL plugin feature was implemented.

---

## TQ-052 — Implement AOV and HoK Sample Adapters

**Task Type:** CODE-CORE

**Purpose**

Prove the architecture is genuinely multi-MOBA and not LoL-first.

**Scope**

- Implement `games/aov` sample adapter.
- Implement `games/hok` sample adapter.
- Use manually maintained sample hero data.
- Provide at least one ruleset each.
- Add tests proving each adapter returns heroes, rulesets, and capabilities.

**Source Documents to Read**

```text
AGENTS.md
docs/BAN_PICK_RULES.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
games/aov/**
games/hok/**
tests/adapters/**
```

**Dependencies**

```text
TQ-050
TQ-051
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#6-game-adapter-layer
docs/ACCEPTANCE_CRITERIA.md#27-final-release-checklist
```

**Automated Verification**

```bash
pnpm --filter @*/aov test
pnpm --filter @*/hok test
pnpm test
pnpm typecheck
pnpm build
```

Static guardrail:

```bash
grep -R "Riot\|LCU\|DataDragon" games/aov games/hok packages/core-draft || true
```

**Manual Rehearsal Verification**

```text
Not required yet. Future UI rehearsal should run at least one non-LoL draft.
```

**Out-of-Scope Guardrails**

- Do not use official external APIs.
- Do not make AOV/HoK depend on LoL data structures.
- Do not put AOV/HoK logic into `packages/core-draft`.

**Handoff Notes**

Record sample hero counts, ruleset IDs, and any adapter limitations.

---

# Phase 6 — Local Event Package

## TQ-060 — Create Sample Event Package Structure and JSON Files

**Task Type:** CODE-CORE

**Purpose**

Provide a portable local event package that can run without internet or external APIs.

**Scope**

Create or update:

```text
event-packages/sample-event/event.json
event-packages/sample-event/matches.json
event-packages/sample-event/teams.json
event-packages/sample-event/players.json
event-packages/sample-event/sponsors.json
event-packages/sample-event/rulesets/generic-standard.json
event-packages/sample-event/rulesets/lol-standard.json
event-packages/sample-event/rulesets/aov-standard.json
event-packages/sample-event/rulesets/hok-standard.json
event-packages/sample-event/themes/default-theme.json
event-packages/sample-event/assets/**
event-packages/sample-event/logs/.gitkeep
```

Include:

- One event.
- One BO3 match.
- Two teams.
- At least five players per team.
- At least one sponsor.
- Default theme.
- Relative/local asset paths or safe fallbacks.

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/BAN_PICK_RULES.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
event-packages/sample-event/**
```

**Dependencies**

```text
TQ-020
TQ-021
TQ-041
TQ-050
TQ-051
TQ-052
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#10-sample-event-package
docs/ACCEPTANCE_CRITERIA.md#20-theme-system
```

**Automated Verification**

```bash
node -e "JSON.parse(require('fs').readFileSync('event-packages/sample-event/event.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('event-packages/sample-event/matches.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('event-packages/sample-event/teams.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('event-packages/sample-event/players.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('event-packages/sample-event/sponsors.json','utf8'))"
pnpm test
pnpm typecheck
pnpm build
```

**Manual Rehearsal Verification**

```text
Manual file review: confirm all paths are local/relative and no internet asset is required.
Full sample-event UI rehearsal occurs later.
```

**Out-of-Scope Guardrails**

- Do not use copyrighted production assets as required test assets.
- Do not require remote image URLs.
- Do not create large fixture datasets.

**Handoff Notes**

Record sample event ID, match ID, team IDs, ruleset IDs, theme ID, and asset fallback assumptions.

---

## TQ-061 — Add Sample Event Validation Tests

**Task Type:** TESTING

**Purpose**

Make the sample package verifiable before server integration.

**Scope**

- Add tests that parse sample JSON files.
- Validate that required fields exist.
- Validate sample rulesets can create draft states.
- Validate default theme can load through `theme-engine`.
- Validate sample teams/players/match linkage.

**Source Documents to Read**

```text
AGENTS.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
tests/sample-event/**
event-packages/sample-event/** if fixes are required
```

**Dependencies**

```text
TQ-060
TQ-032
TQ-041
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#10-sample-event-package
docs/ACCEPTANCE_CRITERIA.md#25-testing-and-verification-commands
```

**Automated Verification**

```bash
pnpm test
pnpm typecheck
pnpm build
```

**Manual Rehearsal Verification**

```text
Not required.
```

**Out-of-Scope Guardrails**

- Do not generate large fixture libraries.
- Do not add internet-dependent validation.
- Do not broaden sample package into v0.2 import/export UI.

**Handoff Notes**

Record validation coverage and any assumptions not yet enforced.

---

# Phase 7 — Server Runtime and APIs

## TQ-070 — Implement Server App Shell and Health Endpoint

**Task Type:** CODE-SERVER

**Purpose**

Create a local-first Node server foundation with a health endpoint.

**Scope**

- Implement server entry point.
- Start HTTP server locally.
- Add `GET /api/health`.
- Return basic `SystemHealth` using shared types.
- Add clear error handling wrapper.
- Do not yet implement all draft/production APIs.

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
apps/server/src/index.ts
apps/server/src/api.ts
apps/server/src/health/**
apps/server/package.json
```

**Dependencies**

```text
TQ-011
TQ-020
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#7-server-runtime-state
docs/ACCEPTANCE_CRITERIA.md#8-rest-api
docs/ACCEPTANCE_CRITERIA.md#22-system-health-dashboard
```

**Automated Verification**

```bash
pnpm --filter @*/server test
pnpm --filter @*/server typecheck
pnpm typecheck
pnpm build
```

When server can run:

```bash
pnpm --filter @*/server dev
curl http://localhost:3000/api/health
```

Use the documented port if not `3000`.

**Manual Rehearsal Verification**

```text
Manual smoke test: open /api/health in browser or curl. No full production rehearsal required.
```

**Out-of-Scope Guardrails**

- Do not require cloud credentials.
- Do not add database.
- Do not require internet.

**Handoff Notes**

Record server port, health response shape, and run command.

---

## TQ-071 — Implement Event Package and Adapter Loading in Server Runtime

**Task Type:** CODE-SERVER

**Purpose**

Let the server load local event data and game adapters into serializable runtime state.

**Scope**

- Load `event-packages/sample-event`.
- Load Generic, LoL sample, AOV, and HoK adapters.
- Store current event, match, teams, players, sponsors, rulesets, theme, adapter status.
- Expose `GET /api/state`, `GET /api/events`, `GET /api/matches`, `GET /api/teams`, `GET /api/players`, `GET /api/adapters`.
- Include adapter health and hero counts.

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
apps/server/src/state/**
apps/server/src/services/**
apps/server/src/api.ts
apps/server/src/persistence/**
```

**Dependencies**

```text
TQ-060
TQ-061
TQ-070
TQ-050
TQ-051
TQ-052
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#7-server-runtime-state
docs/ACCEPTANCE_CRITERIA.md#8-rest-api
docs/ACCEPTANCE_CRITERIA.md#10-sample-event-package
```

**Automated Verification**

```bash
pnpm --filter @*/server test
pnpm test
pnpm typecheck
pnpm build
curl http://localhost:3000/api/state
curl http://localhost:3000/api/adapters
```

**Manual Rehearsal Verification**

```text
Manual API smoke check: confirm sample event and all adapters appear in returned state.
```

**Out-of-Scope Guardrails**

- Do not add cloud sync.
- Do not add SQLite/Prisma.
- Do not auto-sync LoL champion data.

**Handoff Notes**

Record loaded event package ID, adapters loaded, and any validation warnings.

---

## TQ-072 — Implement Draft REST APIs and Audit Logging

**Task Type:** CODE-SERVER

**Purpose**

Expose manual draft operations through consistent REST APIs and append-only logs.

**Scope**

Implement required draft endpoints:

```text
GET    /api/drafts/:draftId
POST   /api/drafts
POST   /api/drafts/:draftId/start
POST   /api/drafts/:draftId/pause
POST   /api/drafts/:draftId/resume
POST   /api/drafts/:draftId/reset
POST   /api/drafts/:draftId/complete
POST   /api/drafts/:draftId/actions/:actionId/hover
POST   /api/drafts/:draftId/actions/:actionId/lock
POST   /api/drafts/:draftId/undo
```

Add append-only JSONL logging for:

```text
Draft created
Draft started
Draft paused/resumed
Hero hovered
Hero locked
Undo
Reset
Complete
Manual override if implemented
Invalid action attempted where useful
```

**Source Documents to Read**

```text
AGENTS.md
docs/BAN_PICK_RULES.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
apps/server/src/api.ts
apps/server/src/routes/drafts/**
apps/server/src/state/**
apps/server/src/persistence/audit-log**
event-packages/sample-event/logs/**
```

**Dependencies**

```text
TQ-032
TQ-071
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#5-universal-draft-engine
docs/ACCEPTANCE_CRITERIA.md#8-rest-api
docs/ACCEPTANCE_CRITERIA.md#21-audit-logging
```

**Automated Verification**

```bash
pnpm --filter @*/server test
pnpm test
pnpm typecheck
pnpm build
```

Suggested API smoke checks when server runs:

```bash
curl http://localhost:3000/api/drafts/<draftId>
# Use documented POST bodies from implementation tests for mutation endpoints.
```

JSONL validation:

```bash
node -e "const fs=require('fs'); const p='event-packages/sample-event/logs/production-log.jsonl'; if(fs.existsSync(p)){ for(const line of fs.readFileSync(p,'utf8').split(/\n/).filter(Boolean)) JSON.parse(line); }"
```

**Manual Rehearsal Verification**

```text
API-level manual smoke only if UI does not exist yet. Full manual draft rehearsal occurs after TQ-101 and TQ-120.
```

**Out-of-Scope Guardrails**

- Do not auto-pick or auto-ban.
- Dangerous reset/complete must require confirmation token, explicit flag, or documented deliberate UI mediation.
- Do not implement player-side automation.

**Handoff Notes**

Record endpoints implemented, audit events written, and confirmation behavior for dangerous actions.

---

## TQ-073 — Implement Production REST APIs and Audit Logging

**Task Type:** CODE-SERVER

**Purpose**

Expose production state, Preview/Program, Take/Clear, and emergency controls above draft and game-specific modules.

**Scope**

Implement:

```text
GET  /api/production/state
POST /api/production/state
POST /api/production/preview
POST /api/production/take
POST /api/production/clear
POST /api/production/emergency
```

Log:

```text
Production state change
Graphics preview
Graphics take
Graphics clear
Emergency trigger
Emergency clear if implemented
```

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
apps/server/src/routes/production/**
apps/server/src/state/**
apps/server/src/persistence/audit-log**
packages/core-production/src/** if gaps are found
```

**Dependencies**

```text
TQ-040
TQ-071
TQ-072
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#8-rest-api
docs/ACCEPTANCE_CRITERIA.md#13-producer-panel
docs/ACCEPTANCE_CRITERIA.md#19-production-control-layer
docs/ACCEPTANCE_CRITERIA.md#21-audit-logging
```

**Automated Verification**

```bash
pnpm --filter @*/server test
pnpm test
pnpm typecheck
pnpm build
```

Static guardrail:

```bash
grep -R "OBSWebSocket\|vMix\|Companion\|StreamDeck" apps/server packages/core-production || true
```

**Manual Rehearsal Verification**

```text
API-level smoke check: preview, take, clear, and emergency API calls change production state as expected.
Full producer rehearsal occurs after Producer Panel and overlays exist.
```

**Out-of-Scope Guardrails**

- Do not require OBS WebSocket or vMix API.
- Emergency trigger must be deliberate and logged.
- Production control must not live under `/games/lol`.

**Handoff Notes**

Record production endpoints, confirmation behavior, and audit events.

---

## TQ-074 — Implement Socket.IO Realtime Sync

**Task Type:** CODE-SERVER

**Purpose**

Synchronize live state to admin, operator, producer, caster, and overlay clients.

**Scope**

Implement Socket.IO server behavior:

```text
client:hello
state:full on connect
state:patch or equivalent after mutations
draft:updated
draft:timer where implemented
production:state
graphics:preview
graphics:program
graphics:clear
health:update
log:entry
error
```

Track connected clients for health.

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
apps/server/src/socket.ts
apps/server/src/state/**
apps/server/src/health/**
packages/shared-types/src/** if socket contract gaps are found
```

**Dependencies**

```text
TQ-071
TQ-072
TQ-073
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#9-socketio-realtime-sync
docs/ACCEPTANCE_CRITERIA.md#22-system-health-dashboard
docs/ACCEPTANCE_CRITERIA.md#25-testing-and-verification-commands
```

**Automated Verification**

```bash
pnpm --filter @*/server test
pnpm test
pnpm typecheck
pnpm build
```

Required integration tests:

```text
client receives state:full on connect
draft lock broadcasts draft update
production state change broadcasts production update
reconnect receives latest full state
invalid socket action emits explicit error
```

**Manual Rehearsal Verification**

```text
Manual socket smoke check: open two simple clients or dashboard/overlay once available and confirm both receive state updates.
Full multi-client rehearsal occurs later.
```

**Out-of-Scope Guardrails**

- Do not use cloud realtime services.
- Do not hide socket errors.
- Do not make overlay depend on polling only unless documented fallback is intentional.

**Handoff Notes**

Record socket events implemented, envelope shape, and reconnect behavior.

---

# Phase 8 — Admin Dashboard and Operator Panels

## TQ-080 — Create Admin Dashboard App Shell and Shared Client State

**Task Type:** CODE-UI

**Purpose**

Create the React dashboard shell that can host admin, draft operator, producer, health, and caster panels.

**Scope**

- Set up dashboard routes or panel navigation.
- Add API client and Socket.IO client connection.
- Display connection status.
- Display current event/match summary from `/api/state` or socket `state:full`.
- Keep UI practical and production-readable.

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
apps/admin-dashboard/src/**
apps/admin-dashboard/package.json
```

**Dependencies**

```text
TQ-074
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#11-admin-dashboard
docs/ACCEPTANCE_CRITERIA.md#9-socketio-realtime-sync
```

**Automated Verification**

```bash
pnpm --filter @*/admin-dashboard typecheck
pnpm --filter @*/admin-dashboard build
pnpm typecheck
pnpm build
```

**Manual Rehearsal Verification**

```text
Open dashboard locally. Confirm it shows connected/disconnected status and current sample event summary.
```

**Out-of-Scope Guardrails**

- Do not add full login system.
- Do not add mutation controls inside overlays.
- Do not make UI depend on internet assets.

**Handoff Notes**

Record dashboard URL, routes/panels created, and connection behavior.

---

## TQ-081 — Implement Admin Match Setup and System Health Panels

**Task Type:** CODE-UI

**Purpose**

Let TD/admin users inspect event, match, team, adapter, ruleset, theme, production, and health state.

**Scope**

Implement minimum panels/routes:

```text
/admin
/admin/matches
/admin/teams
/admin/players
/admin/sponsors
/admin/themes
/admin/system-health
```

For v0.1, read-only or select/confirm controls are acceptable if mutation workflows are not fully required yet.

Show:

- Current event.
- Current match.
- Blue/red teams.
- Players.
- Sponsors.
- Available adapters.
- Selected game code/ruleset.
- Theme.
- Current production state.
- Connected clients.
- Emergency status.
- Server disconnected state.

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
apps/admin-dashboard/src/routes/**
apps/admin-dashboard/src/panels/**
apps/admin-dashboard/src/components/**
apps/admin-dashboard/src/stores/**
```

**Dependencies**

```text
TQ-080
TQ-071
TQ-074
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#11-admin-dashboard
docs/ACCEPTANCE_CRITERIA.md#22-system-health-dashboard
```

**Automated Verification**

```bash
pnpm --filter @*/admin-dashboard test
pnpm --filter @*/admin-dashboard typecheck
pnpm --filter @*/admin-dashboard build
pnpm test
pnpm typecheck
pnpm build
```

**Manual Rehearsal Verification**

```text
Open /admin and /admin/system-health.
Confirm active event, match, teams, adapter status, production state, connected clients, and emergency status are visible.
Disconnect server and confirm clear disconnected state.
```

**Out-of-Scope Guardrails**

- Do not hide live-critical state in tiny UI.
- Do not make dangerous live changes without confirmation.
- Do not implement full role-login as required runtime dependency.

**Handoff Notes**

Record admin routes implemented and any read-only limitations.

---

## TQ-082 — Implement Draft Operator Panel

**Task Type:** CODE-UI

**Purpose**

Allow a draft operator to run a full manual Ban/Pick under live-show pressure.

**Scope**

Implement `/draft` and/or `/draft/:matchId` with:

```text
Current match
Current game number
Blue/red teams
Draft status
Current phase
Current team turn
Timer
Hero search
Hero grid/list
Pick slots
Ban slots
Start draft
Pause draft
Resume draft
Hover hero
Lock hero
Undo
Reset with confirmation
Complete with confirmation
Invalid action feedback
```

Actions must use server APIs/socket workflow and be logged by server.

**Source Documents to Read**

```text
AGENTS.md
docs/BAN_PICK_RULES.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
apps/admin-dashboard/src/routes/draft**
apps/admin-dashboard/src/panels/DraftOperator**
apps/admin-dashboard/src/components/draft/**
apps/admin-dashboard/src/stores/**
```

**Dependencies**

```text
TQ-072
TQ-074
TQ-080
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#12-draft-operator-panel
docs/ACCEPTANCE_CRITERIA.md#5-universal-draft-engine
docs/ACCEPTANCE_CRITERIA.md#21-audit-logging
```

**Automated Verification**

```bash
pnpm --filter @*/admin-dashboard test
pnpm --filter @*/admin-dashboard typecheck
pnpm --filter @*/admin-dashboard build
pnpm test
pnpm typecheck
pnpm build
```

**Manual Rehearsal Verification**

```text
Open draft operator panel.
Start sample draft.
Search hero.
Hover hero.
Lock one ban.
Lock one pick.
Pause timer.
Resume timer.
Undo locked action.
Attempt duplicate hero and confirm it is blocked.
Complete draft.
Confirm audit log contains draft actions.
```

**Out-of-Scope Guardrails**

- Do not auto-pick or auto-ban.
- Do not read game client state.
- Reset and complete must be deliberate.
- Do not place hidden information in operator UI unless it is public/production-safe.

**Handoff Notes**

Record operator workflow status, incomplete controls, and manual rehearsal result.

---

## TQ-083 — Implement Producer Panel and Production Control UI

**Task Type:** CODE-UI

**Purpose**

Provide producer-facing controls for global show state, Preview/Program, Take/Clear, and emergency mode.

**Scope**

Implement `/producer` with:

```text
Current match
Current production state
State change controls
Preview graphic
Take to Program
Clear Program
Emergency trigger with confirmation
Emergency status
Overlay/health summary or link
```

Use production REST APIs and socket updates.

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
apps/admin-dashboard/src/routes/producer**
apps/admin-dashboard/src/panels/Producer**
apps/admin-dashboard/src/components/production/**
```

**Dependencies**

```text
TQ-073
TQ-074
TQ-080
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#13-producer-panel
docs/ACCEPTANCE_CRITERIA.md#19-production-control-layer
docs/ACCEPTANCE_CRITERIA.md#18-emergency-overlay
```

**Automated Verification**

```bash
pnpm --filter @*/admin-dashboard test
pnpm --filter @*/admin-dashboard typecheck
pnpm --filter @*/admin-dashboard build
pnpm test
pnpm typecheck
pnpm build
```

**Manual Rehearsal Verification**

```text
Open producer panel.
Change production state to DRAFT_READY.
Preview draft overlay.
Take draft overlay to Program.
Clear Program.
Trigger emergency mode with confirmation.
Confirm audit log records all producer actions.
```

**Out-of-Scope Guardrails**

- Do not require OBS WebSocket/vMix for Preview/Take/Clear.
- Do not allow graphics to Program without deliberate Take action.
- Do not bury production control in a game-specific module.

**Handoff Notes**

Record producer controls implemented and any confirmation safeguards.

---

## TQ-084 — Implement Caster Read-only Panel

**Task Type:** CODE-UI

**Purpose**

Provide a public-safe read-only panel for casters without mutation controls or hidden information.

**Scope**

Implement `/caster` and/or `/caster/match/:matchId` showing:

```text
Match info
Team info
Player info
Current draft summary
Previous draft summary where available
Connection status
```

Remove or avoid all mutation controls.

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
apps/admin-dashboard/src/routes/caster**
apps/admin-dashboard/src/panels/Caster**
apps/admin-dashboard/src/components/caster/**
```

**Dependencies**

```text
TQ-080
TQ-082
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#14-caster--read-only-panel
```

**Automated Verification**

```bash
pnpm --filter @*/admin-dashboard test
pnpm --filter @*/admin-dashboard typecheck
pnpm --filter @*/admin-dashboard build
pnpm test
pnpm typecheck
pnpm build
```

Add tests or source checks confirming caster route does not render mutation buttons or call mutation endpoints.

**Manual Rehearsal Verification**

```text
Open caster panel during sample draft.
Confirm match, teams, players, and draft summary are visible.
Confirm panel updates after draft lock.
Confirm no buttons exist for start, lock, undo, reset, complete, take, clear, or emergency.
```

**Out-of-Scope Guardrails**

- Do not expose hidden competitive information.
- Do not include mutation controls.
- Do not give caster panel production take/clear access.

**Handoff Notes**

Record read-only safeguards and UI limitations.

---

# Phase 9 — Overlay App

## TQ-090 — Create Overlay App Shell, Socket Client, and Debug Mode

**Task Type:** CODE-OVERLAY

**Purpose**

Create browser-source compatible overlay foundations used by draft, score bug, emergency, program, and preview routes.

**Scope**

Implement overlay app shell with routes:

```text
/overlay/program
/overlay/preview
/overlay/draft/:matchId
/overlay/scorebug/:matchId
/overlay/emergency
```

Optional/future routes may be placeholders only if documented:

```text
/overlay/lower-third
/overlay/sponsor
/overlay/pause
/overlay/post-game/:matchId
/overlay/mvp/:matchId
```

Implement:

- Socket.IO client.
- Auto-reconnect.
- Latest `state:full` recovery after refresh.
- `?debug=1` showing route, connection status, match ID, timestamp.
- 1920x1080 base canvas/layout.
- No mutation controls.

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
apps/overlay/src/**
apps/overlay/package.json
```

**Dependencies**

```text
TQ-074
TQ-041
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#15-overlay-app
docs/ACCEPTANCE_CRITERIA.md#9-socketio-realtime-sync
```

**Automated Verification**

```bash
pnpm --filter @*/overlay test
pnpm --filter @*/overlay typecheck
pnpm --filter @*/overlay build
pnpm test
pnpm typecheck
pnpm build
```

Static guardrail:

```bash
grep -R "fetch(.*POST\|axios.post\|/api/drafts/.*/start\|/api/production/take" apps/overlay/src || true
```

Investigate any matches; overlay must not mutate state.

**Manual Rehearsal Verification**

```text
Open each required overlay route in browser.
Use ?debug=1 and confirm route, match ID, connection status, and timestamp display.
Refresh route and confirm latest state returns.
Confirm no scrollbars at 1920x1080 browser-source size.
```

**Out-of-Scope Guardrails**

- Do not add admin controls to overlays.
- Do not require OBS WebSocket/vMix API.
- Do not implement advanced animation editor.

**Handoff Notes**

Record overlay routes, debug mode behavior, and socket reconnect behavior.

---

## TQ-091 — Implement Draft Overlay

**Task Type:** CODE-OVERLAY

**Purpose**

Display manual Ban/Pick state clearly for broadcast.

**Scope**

Implement `/overlay/draft/:matchId` showing:

```text
Blue team name/logo
Red team name/logo
Blue bans
Red bans
Blue picks
Red picks
Current timer
Current phase
Active team/side
Hovered hero where supported
Locked heroes distinct from hover/pending
Sponsor slot if configured
Theme styling
Missing hero icon fallback
Debug mode
```

**Source Documents to Read**

```text
AGENTS.md
docs/BAN_PICK_RULES.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
apps/overlay/src/overlays/DraftOverlay**
apps/overlay/src/routes/**
apps/overlay/src/components/**
```

**Dependencies**

```text
TQ-090
TQ-082
TQ-041
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#16-draft-overlay
docs/ACCEPTANCE_CRITERIA.md#20-theme-system
```

**Automated Verification**

```bash
pnpm --filter @*/overlay test
pnpm --filter @*/overlay typecheck
pnpm --filter @*/overlay build
pnpm test
pnpm typecheck
pnpm build
```

If Playwright or visual tests exist:

```bash
pnpm test:e2e
```

**Manual Rehearsal Verification**

```text
Open draft overlay.
Start draft from operator panel.
Confirm phase/timer appear.
Hover hero and confirm overlay update.
Lock ban and confirm ban slot update.
Lock pick and confirm pick slot update.
Undo and confirm overlay rolls back.
Complete draft and confirm final state is readable.
Enable ?debug=1 and confirm debug info appears.
```

**Out-of-Scope Guardrails**

- Overlay is read-only.
- No mutation endpoints from overlay.
- No LoL-specific hardcoding in universal overlay components; game-specific labels/assets must come from adapter/state.

**Handoff Notes**

Record display states implemented and any fallback/asset limitations.

---

## TQ-092 — Implement Score Bug Overlay

**Task Type:** CODE-OVERLAY

**Purpose**

Display basic match score and team identity as a broadcast browser source.

**Scope**

Implement `/overlay/scorebug/:matchId` showing:

```text
Blue/left team name or short name
Red/right team name or short name
Team logos or fallback
Current match score
Current game number where available
Compact event/match context where appropriate
Theme colors
No mutation controls
```

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
apps/overlay/src/overlays/ScoreBug**
apps/overlay/src/routes/**
apps/overlay/src/components/**
```

**Dependencies**

```text
TQ-090
TQ-081
TQ-041
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#17-score-bug-overlay
```

**Automated Verification**

```bash
pnpm --filter @*/overlay test
pnpm --filter @*/overlay typecheck
pnpm --filter @*/overlay build
pnpm test
pnpm typecheck
pnpm build
```

**Manual Rehearsal Verification**

```text
Open score bug overlay route.
Confirm team names/logos and score display.
Change sample score through admin or server-supported action if available.
Confirm score bug updates.
Confirm missing logo fallback works.
Confirm no scrollbars in browser-source-sized view.
```

**Out-of-Scope Guardrails**

- Do not add mutation controls.
- Do not implement LoL in-game HUD/objective tracker.
- Do not require live game API.

**Handoff Notes**

Record score data source and any missing score update UI limitations.

---

## TQ-093 — Implement Program, Preview, and Emergency Overlays

**Task Type:** CODE-OVERLAY

**Purpose**

Provide the minimum production-safe output routes for Preview/Program workflow and emergency fallback.

**Scope**

Implement:

```text
/overlay/program
/overlay/preview
/overlay/emergency
```

Support:

- Program displays current program graphic payload.
- Preview displays preview graphic payload.
- Emergency route remains readable even if draft data/assets are missing.
- Emergency state can override normal overlay display where intended.
- Debug mode.
- Browser-source safe layout.

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
apps/overlay/src/overlays/ProgramOverlay**
apps/overlay/src/overlays/PreviewOverlay**
apps/overlay/src/overlays/EmergencyOverlay**
apps/overlay/src/routes/**
```

**Dependencies**

```text
TQ-083
TQ-090
TQ-091
TQ-092
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#18-emergency-overlay
docs/ACCEPTANCE_CRITERIA.md#19-production-control-layer
docs/ACCEPTANCE_CRITERIA.md#15-overlay-app
```

**Automated Verification**

```bash
pnpm --filter @*/overlay test
pnpm --filter @*/overlay typecheck
pnpm --filter @*/overlay build
pnpm test
pnpm typecheck
pnpm build
```

**Manual Rehearsal Verification**

```text
Open producer panel.
Preview draft graphic.
Confirm /overlay/preview updates.
Take to Program.
Confirm /overlay/program updates.
Clear Program.
Confirm program clears.
Trigger emergency with confirmation.
Confirm /overlay/emergency and intended program/emergency behavior display clearly.
Reload emergency route and confirm correct state returns.
```

**Out-of-Scope Guardrails**

- Do not require OBS WebSocket/vMix API.
- PNG export can remain future/deferred for v0.1 unless explicitly requested.
- Emergency overlay must not depend on complex draft state to render.

**Handoff Notes**

Record emergency behavior, program/preview payload behavior, and any deferred routes.

---

# Phase 10 — Audit, Health, and Local Deployment

## TQ-100 — Harden Audit Logging and Surface Log Failures in Health

**Task Type:** CODE-SERVER TESTING

**Purpose**

Ensure important live-production actions are recorded and log failures are visible.

**Scope**

- Confirm append-only JSONL path.
- Ensure required actions are logged.
- Validate every JSONL line parses.
- Ensure log is appended, not overwritten during normal operations.
- Surface log write failure in `/api/health` or health state.

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
apps/server/src/persistence/audit-log**
apps/server/src/health/**
apps/server/**/*.test.ts
event-packages/sample-event/logs/**
```

**Dependencies**

```text
TQ-072
TQ-073
TQ-074
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#21-audit-logging
docs/ACCEPTANCE_CRITERIA.md#22-system-health-dashboard
```

**Automated Verification**

```bash
pnpm --filter @*/server test
pnpm test
pnpm typecheck
pnpm build
node -e "const fs=require('fs'); const p='event-packages/sample-event/logs/production-log.jsonl'; if(fs.existsSync(p)){ for(const line of fs.readFileSync(p,'utf8').split(/\n/).filter(Boolean)) JSON.parse(line); }"
```

**Manual Rehearsal Verification**

```text
Perform several draft and producer actions.
Open the JSONL log file.
Confirm entries exist in chronological order for start, hover, lock, pause/resume, undo, take, clear, and emergency.
```

**Out-of-Scope Guardrails**

- Do not store logs only in browser memory.
- Do not introduce a database.
- Do not hide log write errors.

**Handoff Notes**

Record log path, events covered, and any missing log events.

---

## TQ-101 — Complete System Health Dashboard Integration

**Task Type:** CODE-SERVER CODE-UI

**Purpose**

Give the TD a reliable view of server, clients, adapters, assets, production state, and emergency readiness.

**Scope**

Ensure `/api/health` and `/admin/system-health` include:

```text
Server started time
Connected Socket.IO clients
Loaded event package ID
Current production state
Adapter status
Hero count per adapter
Asset warnings/missing assets
Emergency readiness/status
Last state update timestamp
Dashboard connection status
Overlay/draft/producer/caster connection status where available
```

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
apps/server/src/health/**
apps/server/src/socket.ts
apps/admin-dashboard/src/panels/SystemHealth**
apps/admin-dashboard/src/routes/**
```

**Dependencies**

```text
TQ-074
TQ-081
TQ-090
TQ-100
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#22-system-health-dashboard
docs/ACCEPTANCE_CRITERIA.md#7-server-runtime-state
```

**Automated Verification**

```bash
pnpm --filter @*/server test
pnpm --filter @*/admin-dashboard test
pnpm test
pnpm typecheck
pnpm build
curl http://localhost:3000/api/health
```

**Manual Rehearsal Verification**

```text
Open health dashboard.
Open overlay and draft operator panel.
Confirm connected clients appear.
Disconnect overlay and confirm health updates.
Trigger missing asset scenario if supported and confirm warning appears.
Confirm emergency status is visible.
```

**Out-of-Scope Guardrails**

- Do not require third-party monitoring service.
- Do not hide adapter or asset failures.
- Do not add cloud telemetry.

**Handoff Notes**

Record health fields, client tracking limitations, and asset warning behavior.

---

## TQ-102 — Document Local LAN Deployment and Browser Source URLs

**Task Type:** DOCS-ONLY

**Purpose**

Document how to run the system in a real local production LAN setup.

**Scope**

Create or update:

```text
docs/deployment-guide.md
```

Include:

- Control laptop / mini PC role.
- Graphics PC / OBS role.
- Draft operator laptop role.
- Producer laptop role.
- Caster tablet/laptop role.
- Local host/port examples.
- Browser source URLs.
- Firewall/port assumptions.
- Offline operation principle.
- No OBS WebSocket/vMix requirement for v0.1.
- Emergency overlay usage.

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
docs/deployment-guide.md
README.md if URL summary is needed
```

**Dependencies**

```text
TQ-090
TQ-093
TQ-101
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#23-local-deployment--lan-operation
docs/ACCEPTANCE_CRITERIA.md#24-documentation
```

**Automated Verification**

```bash
# If docs lint exists:
pnpm lint:docs
```

If unavailable, record as unavailable.

**Manual Rehearsal Verification**

```text
Read guide and verify it gives enough information to open dashboard and overlays from another LAN device.
Actual two-device LAN rehearsal occurs in TQ-131.
```

**Out-of-Scope Guardrails**

- Do not document OBS WebSocket/vMix API as required.
- Do not require cloud sync or internet.
- Do not imply player PCs need software.

**Handoff Notes**

Record documented ports, URLs, and any assumptions requiring implementation confirmation.

---

# Phase 11 — Operator and Developer Documentation

## TQ-110 — Create Operator Guide

**Task Type:** DOCS-ONLY

**Purpose**

Give live-show operators clear instructions for running manual Ban/Pick and emergency workflows.

**Scope**

Create or update:

```text
docs/operator-guide.md
```

Include:

- Starting server/dashboard/overlay.
- Loading sample event.
- Selecting/confirming match, teams, game, ruleset.
- Running manual Ban/Pick.
- Hover and lock behavior.
- Pause/resume timer.
- Undo.
- Reset with confirmation.
- Complete draft with confirmation.
- Producer Preview/Take/Clear.
- Emergency mode.
- Overlay URLs.
- What to do if overlay disconnects.
- What not to do during live show.

**Source Documents to Read**

```text
AGENTS.md
docs/BAN_PICK_RULES.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
docs/operator-guide.md
README.md if overview links are needed
```

**Dependencies**

```text
TQ-082
TQ-083
TQ-093
TQ-101
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#24-documentation
docs/ACCEPTANCE_CRITERIA.md#12-draft-operator-panel
docs/ACCEPTANCE_CRITERIA.md#18-emergency-overlay
```

**Automated Verification**

```bash
# If docs lint exists:
pnpm lint:docs
```

**Manual Rehearsal Verification**

```text
Have a fresh operator follow the guide to start a sample draft and trigger emergency mode.
If no second operator is available, perform self-review and mark rehearsal as not independently verified.
```

**Out-of-Scope Guardrails**

- Do not tell operators to rely on LCU, Data Dragon, OBS WebSocket, vMix API, or internet.
- Do not document player-side automation.

**Handoff Notes**

Record guide sections completed and any missing screenshots/examples.

---

## TQ-111 — Create Game Adapter Developer Guide

**Task Type:** DOCS-ONLY

**Purpose**

Explain how future developers/agents can add games without contaminating universal core.

**Scope**

Create or update:

```text
docs/game-adapter-guide.md
```

Include:

- `GameAdapter` responsibilities.
- How to add hero data.
- How to add rulesets.
- How to handle assets/fallbacks.
- Capabilities flags.
- Tests required for an adapter.
- What belongs in `/games/<game>`.
- What must never go into `packages/core-draft` or shared universal core.
- Future LoL plugin boundary.

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
docs/BAN_PICK_RULES.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
docs/game-adapter-guide.md
README.md if overview links are needed
```

**Dependencies**

```text
TQ-050
TQ-051
TQ-052
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#6-game-adapter-layer
docs/ACCEPTANCE_CRITERIA.md#24-documentation
docs/ACCEPTANCE_CRITERIA.md#26-out-of-scope-guardrails
```

**Automated Verification**

```bash
# If docs lint exists:
pnpm lint:docs
```

**Manual Rehearsal Verification**

```text
Manual developer review: confirm a future agent can identify exactly where to add a new game and what not to touch.
```

**Out-of-Scope Guardrails**

- Do not describe LoL LCU reader or Data Dragon sync as active v0.1 features.
- Do not encourage game-specific logic in universal core.

**Handoff Notes**

Record guide coverage and any missing adapter examples.

---

## TQ-112 — Update README with Local Run and v0.1 Scope

**Task Type:** DOCS-ONLY

**Purpose**

Make the root README useful for developers and production operators.

**Scope**

Update `README.md` with:

```text
Project overview
v0.1 scope
Out-of-scope list
Install commands
Run server/dashboard/overlay commands
Development commands
OBS/vMix browser-source URLs
Sample event instructions
Known limitations
Links to docs
```

**Source Documents to Read**

```text
AGENTS.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
README.md
```

**Dependencies**

```text
TQ-102
TQ-110
TQ-111
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#24-documentation
docs/ACCEPTANCE_CRITERIA.md#25-testing-and-verification-commands
```

**Automated Verification**

```bash
# If docs lint exists:
pnpm lint:docs
```

Also verify commands documented in README match `package.json` scripts:

```bash
cat package.json
```

**Manual Rehearsal Verification**

```text
Follow README from a clean checkout after dependencies are available.
Confirm commands and URLs match actual implementation.
```

**Out-of-Scope Guardrails**

- Do not claim v0.2/v0.3/v0.4 features are implemented.
- Do not imply external services are required.
- Do not advertise LoL in-game HUD as v0.1.

**Handoff Notes**

Record documented commands, URLs, and known limitations.

---

# Phase 12 — Testing, Scope Guardrails, and Rehearsal

## TQ-120 — Add Static Scope Guardrail Tests

**Task Type:** TESTING

**Purpose**

Prevent future agents from accidentally adding forbidden v0.1 features or contaminating universal core.

**Scope**

Add automated guardrail checks that search for forbidden active runtime dependencies or imports.

Check for:

```text
LCU
DataDragon
champion-select-reader
ingame-hud
OBSWebSocket
vMix
Companion
StreamDeck
sqlite
prisma
cloud provider SDKs
```

Also check:

- `packages/core-draft` does not import `/games/*`.
- `packages/core-match` does not import `/games/*`.
- Overlays do not call mutation endpoints.

**Source Documents to Read**

```text
AGENTS.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
tests/guardrails/**
package.json
scripts/** if using a script-based check
```

**Dependencies**

```text
TQ-032
TQ-052
TQ-093
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#26-out-of-scope-guardrails
docs/ACCEPTANCE_CRITERIA.md#25-testing-and-verification-commands
```

**Automated Verification**

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm verify
```

If a dedicated script is added:

```bash
pnpm test:guardrails
```

**Manual Rehearsal Verification**

```text
Manual source review of any allowed matches. Confirm they are docs-only or clearly future TODOs and not active runtime features.
```

**Out-of-Scope Guardrails**

- Guardrail tests must not block documentation mentions of future scope unless the script intentionally distinguishes docs from runtime code.
- Do not implement forbidden features while testing for them.

**Handoff Notes**

Record forbidden terms checked and any allowed matches.

---

## TQ-121 — Expand Unit and Integration Test Coverage

**Task Type:** TESTING

**Purpose**

Ensure core behavior is repeatably verified before release rehearsal.

**Scope**

Add or complete tests for:

```text
Draft ruleset parsing
Draft creation
Draft start
Draft phase advancement
Pick/ban lock
Duplicate hero blocking
Timer calculation
Pause/resume
Undo
Reset
Complete
Production state transitions
Game adapter loading
Server loads sample event
Server exposes health state
Socket.IO state:full on connect
Draft action updates server state
Draft state broadcasts to connected clients
Socket reconnect receives latest state
Audit log entries
```

**Source Documents to Read**

```text
AGENTS.md
docs/BAN_PICK_RULES.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
packages/*/**/*.test.ts
games/*/**/*.test.ts
apps/server/**/*.test.ts
apps/admin-dashboard/**/*.test.ts
apps/overlay/**/*.test.ts
tests/**
```

**Dependencies**

```text
TQ-120
TQ-100
TQ-101
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#25-testing-and-verification-commands
docs/ACCEPTANCE_CRITERIA.md#27-final-release-checklist
```

**Automated Verification**

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify
```

If E2E tests exist:

```bash
pnpm test:e2e
```

**Manual Rehearsal Verification**

```text
Not required for this testing task, but record which manual checks remain for TQ-130 and TQ-131.
```

**Out-of-Scope Guardrails**

- Do not generate large fixtures beyond what tests need.
- Do not add external API dependencies for tests.
- Do not skip failing tests silently.

**Handoff Notes**

Record coverage added and any missing tests.

---

## TQ-130 — Create Operator Rehearsal Checklist

**Task Type:** DOCS-ONLY REHEARSAL

**Purpose**

Create a repeatable live-production rehearsal checklist for release validation.

**Scope**

Create:

```text
docs/OPERATOR_REHEARSAL_CHECKLIST.md
```

Include checks for:

```text
Start server
Open admin dashboard
Open draft operator panel
Open producer panel
Open caster panel
Open OBS browser-source-style overlay view
Load sample event
Select active match
Select game adapter
Select ruleset
Start full manual draft
Hover/lock ban and pick
Pause/resume timer
Undo
Complete draft
Draft overlay updates real time
Score bug displays team/score
Preview/Program Take/Clear
Emergency overlay trigger
Browser source refresh and state recovery
Audit log review
Health dashboard review
LAN/offline operation
```

**Source Documents to Read**

```text
AGENTS.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
docs/operator-guide.md
docs/deployment-guide.md
```

**Files / Folders Likely Affected**

```text
docs/OPERATOR_REHEARSAL_CHECKLIST.md
```

**Dependencies**

```text
TQ-110
TQ-112
TQ-121
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#25-testing-and-verification-commands
docs/ACCEPTANCE_CRITERIA.md#27-final-release-checklist
```

**Automated Verification**

```bash
# If docs lint exists:
pnpm lint:docs
```

**Manual Rehearsal Verification**

```text
Not executed in this task unless explicitly requested. This task creates the checklist.
```

**Out-of-Scope Guardrails**

- Do not require OBS WebSocket/vMix API.
- Do not require internet.
- Do not require player PC software.

**Handoff Notes**

Record checklist sections and whether it has been executed.

---

## TQ-131 — Perform Full Local Manual Rehearsal

**Task Type:** REHEARSAL

**Purpose**

Verify that the system behaves like a usable local-first live production toolkit.

**Scope**

Execute `docs/OPERATOR_REHEARSAL_CHECKLIST.md` against the current repo.

Minimum setup:

```text
One control/admin browser
One draft operator browser
One producer browser
One caster/read-only browser
One overlay browser-source-style view
```

Where possible, also test two devices on the same LAN.

**Source Documents to Read**

```text
docs/OPERATOR_REHEARSAL_CHECKLIST.md
docs/operator-guide.md
docs/deployment-guide.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
```

**Files / Folders Likely Affected**

```text
No source files unless issues are fixed in a follow-up task.
Optional: WORKING_HANDOFF_AFTER_REHEARSAL.md
```

**Dependencies**

```text
TQ-130
TQ-121
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#1-general-v01-definition-of-complete
docs/ACCEPTANCE_CRITERIA.md#23-local-deployment--lan-operation
docs/ACCEPTANCE_CRITERIA.md#27-final-release-checklist
```

**Automated Verification**

Before rehearsal:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify
```

Start runtime using documented commands, for example:

```bash
pnpm dev
```

**Manual Rehearsal Verification**

```text
Run the full checklist.
Record each pass/fail item.
Record browser URLs used.
Record whether internet was disconnected for offline/LAN test.
Record audit log entries reviewed.
Record health dashboard result.
```

**Out-of-Scope Guardrails**

- Do not patch code during rehearsal unless the user explicitly asks for fixes.
- Do not hide failures.
- Do not mark v0.1 complete if manual draft, overlay updates, emergency, audit log, or local/offline workflow fails.

**Handoff Notes**

Create a rehearsal result summary with pass/fail, risks, and recommended fix tasks.

---

## TQ-140 — Final v0.1 Release Validation and Handoff

**Task Type:** REHEARSAL TESTING DOCS-ONLY

**Purpose**

Confirm the implementation is ready to be called v0.1 complete, or honestly list what remains incomplete.

**Scope**

- Run all final commands.
- Execute or review rehearsal results.
- Review acceptance criteria.
- Review guardrail tests.
- Review docs.
- Produce final handoff summary.

Create if requested:

```text
WORKING_HANDOFF_AFTER_V0_1_VALIDATION.md
```

**Source Documents to Read**

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
docs/OPERATOR_REHEARSAL_CHECKLIST.md
```

**Files / Folders Likely Affected**

```text
WORKING_HANDOFF_AFTER_V0_1_VALIDATION.md if requested
No code files unless explicitly fixing issues in a separate task.
```

**Dependencies**

```text
TQ-131
```

**Acceptance Criteria Link / Mapping**

```text
docs/ACCEPTANCE_CRITERIA.md#27-final-release-checklist
```

**Automated Verification**

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify
```

If available:

```bash
pnpm test:e2e
pnpm test:guardrails
```

**Manual Rehearsal Verification**

```text
Confirm TQ-131 rehearsal passed or document failed items.
Confirm full manual draft completed.
Confirm overlay updated in real time.
Confirm score bug displayed team and score.
Confirm Preview/Program and emergency were tested.
Confirm audit log and health dashboard were reviewed.
Confirm local LAN/offline behavior was tested or honestly marked not tested.
```

**Out-of-Scope Guardrails**

- Do not claim v0.1 complete if blockers remain.
- Do not quietly downgrade acceptance criteria.
- Do not add future features to compensate for incomplete v0.1 foundations.

**Handoff Notes**

State clearly:

```text
v0.1 accepted / not accepted
Commands run and results
Manual rehearsal result
Remaining blockers
Known limitations
Suggested next tasks
```

---

# Recommended Execution Order Summary

Use this order unless the user explicitly changes priority:

```text
TQ-000  Read Harness Sources and Confirm Scope
TQ-001  Inspect Existing Repository and Preserve User Work
TQ-010  Create Minimal pnpm Monorepo Skeleton
TQ-011  Add Baseline TypeScript, Lint, Test, and Build Scripts
TQ-020  Implement Shared Types Package
TQ-021  Implement Core Match Models and Validation Helpers
TQ-030  Create Detailed Ban/Pick Rules Harness Document
TQ-031  Implement Universal Draft Engine Lifecycle
TQ-032  Implement Draft Actions, Timer, Undo, and Duplicate Blocking
TQ-040  Implement Core Production State Machine
TQ-041  Implement Basic Theme Engine
TQ-050  Implement Game Adapter Interface Loader and Generic MOBA Adapter
TQ-051  Implement LoL Sample Adapter Without Future Runtime Features
TQ-052  Implement AOV and HoK Sample Adapters
TQ-060  Create Sample Event Package Structure and JSON Files
TQ-061  Add Sample Event Validation Tests
TQ-070  Implement Server App Shell and Health Endpoint
TQ-071  Implement Event Package and Adapter Loading in Server Runtime
TQ-072  Implement Draft REST APIs and Audit Logging
TQ-073  Implement Production REST APIs and Audit Logging
TQ-074  Implement Socket.IO Realtime Sync
TQ-080  Create Admin Dashboard App Shell and Shared Client State
TQ-081  Implement Admin Match Setup and System Health Panels
TQ-082  Implement Draft Operator Panel
TQ-083  Implement Producer Panel and Production Control UI
TQ-084  Implement Caster Read-only Panel
TQ-090  Create Overlay App Shell, Socket Client, and Debug Mode
TQ-091  Implement Draft Overlay
TQ-092  Implement Score Bug Overlay
TQ-093  Implement Program, Preview, and Emergency Overlays
TQ-100  Harden Audit Logging and Surface Log Failures in Health
TQ-101  Complete System Health Dashboard Integration
TQ-102  Document Local LAN Deployment and Browser Source URLs
TQ-110  Create Operator Guide
TQ-111  Create Game Adapter Developer Guide
TQ-112  Update README with Local Run and v0.1 Scope
TQ-120  Add Static Scope Guardrail Tests
TQ-121  Expand Unit and Integration Test Coverage
TQ-130  Create Operator Rehearsal Checklist
TQ-131  Perform Full Local Manual Rehearsal
TQ-140  Final v0.1 Release Validation and Handoff
```

---

# Next Recommended Harness Document

Before coding the universal draft engine, the next most useful harness document is:

```text
docs/BAN_PICK_RULES.md
```

Reason:

- It directly supports `TQ-031` and `TQ-032`.
- It prevents ambiguity around phase advancement, `count > 1`, hover/lock, duplicate hero blocking, undo, reset, complete, timer, and manual override.
- It helps keep Universal Draft game-agnostic before any code is written.

If `docs/BAN_PICK_RULES.md` already exists, the next recommended harness file should be:

```text
docs/API_SOCKET_CONTRACT.md
```

That file would lock REST endpoints, Socket.IO events, payload shapes, errors, and audit log event names before server implementation begins.
