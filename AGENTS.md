# AGENTS.md

## Purpose

This file is the root instruction document for AI coding agents working on the **Multi-MOBA Esports Broadcast Toolkit v0.1**.

Read this file before making any code, documentation, configuration, test, or repository-structure changes.

This project is a production-oriented esports broadcast control system for real live events. It is not a simple hobby overlay, not a League of Legends-only Ban/Pick tool, and not an experimental one-off prototype.

---

## Required Source Documents

Before starting any implementation task, read these documents in this order:

1. `AGENTS.md`
2. `Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md`
3. `IMPLEMENTATION_PROMPT_FOR_CODEX.md`
4. Any task-specific document under `docs/`, such as:
   - `docs/ACCEPTANCE_CRITERIA.md`
   - `docs/TASK_QUEUE.md`
   - `docs/BAN_PICK_RULES.md`
   - `docs/OVERLAY_SPEC.md`
   - `docs/PRODUCT_SPEC.md`
   - `docs/TECHNICAL_SPEC.md`

If a required document is missing, continue using the available source documents and report the missing file in the handoff summary.

---

## Source of Truth and Conflict Resolution

Use this priority order when instructions conflict:

1. User's latest explicit instruction.
2. `AGENTS.md`.
3. `Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md`.
4. `IMPLEMENTATION_PROMPT_FOR_CODEX.md`.
5. More specific task documents under `docs/`.
6. Existing codebase conventions.

If there is still a conflict, choose the option that best preserves:

1. Game-agnostic architecture.
2. Manual-first live production reliability.
3. Local-first operation.
4. Simple, inspectable, testable implementation.

Do not silently resolve major architectural conflicts. Document the decision in the handoff summary.

---

## Project Direction

The project goal is to build a **local-first, manual-first, production-safe esports broadcast toolkit** that supports:

- Universal multi-MOBA Ban/Pick workflows.
- OBS/vMix-compatible browser-source overlays.
- Role-based production panels.
- Production state control.
- Manual fallback as the core workflow.
- JSON event packages and append-only JSONL audit logs.
- Socket.IO real-time state sync.
- Emergency mode and health monitoring.
- Future game-specific integrations without contaminating the universal core.

The system must support League of Legends, Arena of Valor, Honor of Kings, generic MOBA workflows, and future MOBA titles through adapters or plugins.

---

## Non-Negotiable Architectural Rules

These rules must not be violated.

### 1. Universal Ban/Pick must be game-agnostic

The universal draft engine must not hardcode League of Legends-specific concepts, champion names, Riot APIs, LCU behavior, Data Dragon assumptions, or LoL-only workflow rules.

Correct:

```text
Broadcast Toolkit Core
├── Generic Draft Engine
├── Game Adapters
│   ├── LoL
│   ├── AOV
│   └── HoK
└── Production Control Layer
```

Incorrect:

```text
LoL System
└── Add AOV / HoK later
```

### 2. LoL In-game HUD is a future plugin

LoL-specific in-game HUD, champion select reader, Data Dragon sync, LCU integration, and observer-side data mapping must remain separate from the universal draft core.

LoL-specific implementation belongs only under:

```text
/games/lol
```

or a clearly named future plugin folder.

### 3. Production Control sits above game and draft modules

Production Control is responsible for global show state, Preview / Program workflow, Take / Clear, emergency mode, overlay state, and live-production safety.

It must not be buried inside a LoL-specific module or inside an overlay component.

### 4. Manual operation must always work

The project is manual-first. API readers, game-client readers, OBS WebSocket, vMix integration, or future automation must never be required for the show to run.

### 5. Local-first operation is required

The system must run on a private production LAN without relying on cloud services or internet access during live show.

### 6. Live output must be deliberate

Any UI control that can affect program output must be clear, deliberate, and safe. Dangerous actions require confirmation.

Dangerous actions include:

- Reset draft.
- Complete draft.
- Change winner.
- Trigger emergency mode.
- Unlock locked result.
- Switch active match during live state.
- Take graphics to Program.
- Clear Program graphics.

---

## v0.1 Scope

v0.1 should build a reliable foundation, not every future feature.

### Must Have

- Core Match System.
- Universal Manual Ban/Pick.
- Game Adapter structure.
- Generic MOBA adapter.
- LoL sample adapter with manually included champion data sample.
- AOV sample adapter.
- HoK sample adapter.
- Admin Dashboard.
- Draft Operator Panel.
- OBS Draft Overlay.
- Basic Score Bug Overlay.
- Production State Machine.
- Socket.IO real-time sync.
- JSON event package loading.
- Append-only JSONL audit logging.
- Mock mode.
- Manual override.
- Timer control.
- Undo.
- Emergency state route.
- System health page.
- Basic theme loading.
- Clear operator and developer documentation.

### Should Have

- Basic Producer Panel.
- Basic sponsor logo slots.
- Preview / Program separation for draft overlay.
- Caster read-only panel.

---

## Out of Scope for v0.1

Do not implement these in v0.1 unless the user explicitly changes the scope:

- LoL LCU reader.
- LoL champion select auto sync.
- LoL in-game HUD.
- LoL Data Dragon automatic sync.
- OBS WebSocket integration.
- vMix API integration.
- Bitfocus Companion integration.
- Stream Deck integration.
- SQLite database.
- Cloud sync.
- User login system.
- Advanced animation editor.
- PNG export.
- AI match report generation.
- Real sponsor scheduling automation.
- Player-side automation.

Clean placeholder interfaces and specific TODO notes are allowed only when they preserve the architecture and do not expand v0.1 implementation scope.

---

## Compliance and Safety Boundaries

The system must not:

- Auto-pick.
- Auto-ban.
- Control player clients.
- Automate player-side gameplay actions.
- Expose hidden competitive information.
- Require software to run on player PCs.
- Depend on unsupported game-client behavior as the only production workflow.

The system may:

- Support manual operator input.
- Display broadcast graphics.
- Read approved or observer-side data in future versions.
- Provide future game-reader plugins with manual override.
- Use mock data, sample data, and local event packages for rehearsal and testing.

---

## Expected Technology Stack

Use the v0.1 stack unless the user explicitly changes it:

```text
Frontend: React + TypeScript + Vite
Backend: Node.js + TypeScript
Realtime: Socket.IO
Package Manager: pnpm
Monorepo: pnpm workspace
Testing: Vitest
E2E / visual testing: Playwright when introduced
Styling: Tailwind CSS or CSS Modules
Runtime Persistence: JSON event packages + append-only JSONL logs
Overlay Output: OBS/vMix browser-source URLs
```

Avoid unnecessary dependencies. Prefer boring, reliable, inspectable tools.

---

## Expected Repository Shape

The target repository should generally follow this shape:

```text
/esports-broadcast-toolkit
├── apps
│   ├── server
│   ├── admin-dashboard
│   └── overlay
├── packages
│   ├── shared-types
│   ├── core-match
│   ├── core-draft
│   ├── core-production
│   ├── core-overlay
│   └── theme-engine
├── games
│   ├── generic-moba
│   ├── lol
│   ├── aov
│   └── hok
├── event-packages
│   └── sample-event
├── docs
├── tests
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── README.md
└── AGENTS.md
```

Do not reorganize the repository casually. If a structural change is necessary, explain why in the handoff summary.

---

## Standard Agent Workflow

For every task, follow this workflow.

### 1. Inspect first

Before editing:

- Read this file.
- Read the task prompt.
- Inspect the existing repository structure.
- Identify existing conventions.
- Locate the files likely affected.
- Preserve user work.

Do not delete or overwrite existing files unless clearly required.

### 2. Confirm task scope internally

Classify the task:

- Documentation-only.
- Code implementation.
- Test implementation.
- Refactor.
- Bug fix.
- Harness / tooling.
- Configuration.

Stay within the task scope. Do not build future roadmap items opportunistically.

### 3. Make the smallest safe change

Prefer small, working, reviewable changes over large speculative rewrites.

When implementing a milestone:

- Start with shared types and core logic before UI.
- Keep state serializable.
- Keep game-specific logic inside `/games`.
- Keep universal draft logic inside `packages/core-draft`.
- Keep production state logic inside `packages/core-production`.
- Keep overlay rendering separate from operator controls.

### 4. Add or update tests when behavior changes

Behavioral changes require tests whenever practical.

Prioritize tests for:

- Draft ruleset parsing.
- Draft phase advancement.
- Duplicate hero validation.
- Timer state calculation.
- Undo logic.
- Production state transitions.
- Game adapter loading.
- Server loading sample event.
- Socket reconnect receiving latest state.
- Overlay receiving updated draft state.
- Audit log entries.

### 5. Update documentation when behavior or commands change

Update relevant docs when changing:

- Setup commands.
- Development commands.
- Runtime behavior.
- API routes.
- Socket events.
- Overlay routes.
- Event package format.
- Operator workflow.
- Deployment assumptions.

### 6. Run verification commands

Use the available scripts in the repo. Standard target commands are:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

When E2E tests exist:

```bash
pnpm test:e2e
```

When a combined script exists:

```bash
pnpm verify
```

If a command does not exist yet, do not invent success. Report that the command is unavailable.

### 7. Provide a handoff summary

At the end of each task, summarize:

- What changed.
- Files created or modified.
- Commands run.
- Results of commands.
- Anything not completed.
- Risks or assumptions.
- Suggested next task.

---

## Standard Root Scripts

When creating or updating root `package.json`, prefer these scripts:

```json
{
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "verify": "pnpm lint && pnpm typecheck && pnpm test && pnpm build"
  }
}
```

Individual packages may define their own scripts, but root-level commands should work for the full repository once the monorepo exists.

---

## Code Quality Rules

Follow these rules:

1. Use strict TypeScript.
2. Avoid `any` unless absolutely necessary.
3. Keep shared types centralized.
4. Do not duplicate type definitions across apps.
5. Keep game-specific logic inside `/games`.
6. Keep LoL-specific logic out of universal core packages.
7. Keep UI components small and readable.
8. Keep runtime state serializable.
9. Avoid hidden global state.
10. Prefer simple JSON configs over hidden magic.
11. Log all important live-production actions.
12. Make dangerous actions require confirmation.
13. Use explicit error messages.
14. Prefer readable code over clever code.
15. Add comments where production logic is non-obvious.
16. Keep TODOs specific, scoped, and tied to future versions.

---

## Naming Rules

Use clear names such as:

```text
DraftState
ProductionState
MatchState
GameAdapter
OverlayRoute
GraphicTakeState
SocketEnvelope
ApiResponse
SystemHealth
```

Avoid vague names such as:

```text
data
info
manager
stuff
misc
temp
helper
```

A generic name is acceptable only when the file or context makes the purpose obvious.

---

## API and Socket Conventions

Use a consistent API response shape:

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

Use a consistent Socket.IO envelope shape:

```ts
export interface SocketEnvelope<T> {
  type: string;
  timestamp: string;
  operatorId?: string;
  payload: T;
}
```

Socket errors should be explicit and machine-readable, for example:

```text
error:draft-invalid-action
error:permission-denied
error:state-conflict
error:adapter-not-loaded
error:asset-missing
```

Do not rename public API routes or Socket.IO events casually. If a rename is required, update:

- Shared constants or shared types.
- Server handlers.
- Client hooks.
- Tests.
- Documentation.
- Sample payloads.

---

## Overlay Rules

Overlays are broadcast outputs and must be treated as production-critical.

Overlay routes must be browser-source compatible and generally read-only.

Required overlay principles:

- Transparent background where appropriate.
- 1920x1080 default layout.
- Safe margins.
- No scrollbars in standard OBS browser-source view.
- Automatic Socket.IO reconnect.
- Debug mode via `?debug=1` where supported.
- Missing assets must show fallback graphics.
- Overlay must recover current state after browser refresh.
- Overlay must not expose admin mutation controls.

v0.1 should fully implement at least:

```text
/overlay/draft/:matchId
/overlay/scorebug/:matchId
/overlay/emergency
/overlay/program
/overlay/preview
```

---

## Event Package and Persistence Rules

v0.1 uses local JSON event packages and append-only JSONL logs.

Do not introduce a database unless explicitly requested.

Event packages should remain portable and human-readable.

Expected sample event package shape:

```text
event-packages/sample-event
├── event.json
├── matches.json
├── teams.json
├── players.json
├── sponsors.json
├── rulesets
├── themes
├── assets
└── logs
```

Important operations must be logged to JSONL, including:

- Match creation or update.
- Game creation or update.
- Draft start, pause, resume, reset, complete.
- Pick / ban hover and lock.
- Undo and override.
- Timer changes.
- Production state changes.
- Graphics preview, take, clear.
- Result confirmation.
- Emergency mode trigger.

---

## Testing and Harness Expectations

The harness should make correctness verifiable.

### Unit tests should cover

- Draft ruleset parsing.
- Draft creation.
- Draft start.
- Draft phase advancement.
- Pick / ban lock.
- Duplicate hero blocking.
- Timer calculation.
- Pause / resume.
- Undo.
- Reset.
- Complete.
- Production state transitions.
- Game adapter loading.

### Integration tests should cover

- Server loads sample event.
- Server exposes health state.
- Client receives `state:full` on Socket.IO connection.
- Draft action updates server state.
- Draft state broadcasts to connected clients.
- Socket reconnect receives latest state.
- Audit log receives entries.

### Manual rehearsal checklist should eventually cover

- Start server.
- Open admin dashboard.
- Open draft operator panel.
- Open OBS overlay route.
- Load sample match.
- Start draft.
- Complete draft.
- Trigger emergency mode.
- Reset system.
- Reload browser sources.
- Confirm state recovery.

---

## Definition of Done for Any Task

A task is complete only when all relevant items below are satisfied.

### For documentation-only tasks

- File is created or updated in the correct location.
- Scope matches the requested output.
- It does not contradict source documents.
- It preserves the game-agnostic and manual-first architecture.
- It clearly states any future TODOs without implementing them.

### For code tasks

- The smallest working change has been implemented.
- Relevant tests are added or updated where practical.
- Shared types are reused instead of duplicated.
- LoL-specific logic is not placed in universal core packages.
- Runtime state remains serializable.
- Important live-production state changes are logged where relevant.
- Dangerous actions require confirmation where relevant.
- Relevant documentation is updated.
- Verification commands have been run or clearly reported as unavailable.

### For milestone tasks

- The milestone acceptance criteria are satisfied.
- `pnpm lint` passes where available.
- `pnpm typecheck` passes where available.
- `pnpm test` passes where available.
- `pnpm build` passes where available.
- Known limitations are documented.
- Next-step recommendations are included.

Do not claim completion if required verification was not run or did not pass. Report partial completion honestly.

---

## v0.1 Final Acceptance Criteria

The implementation is considered v0.1 complete only when all of the following are true:

1. `pnpm install` succeeds.
2. `pnpm build` succeeds.
3. `pnpm typecheck` succeeds.
4. `pnpm test` succeeds.
5. Server runs locally.
6. Admin dashboard runs locally.
7. Overlay app runs locally.
8. Sample event package loads.
9. User can select or view a sample match.
10. User can run a full manual draft.
11. Draft overlay updates in real time.
12. Score bug overlay displays basic team and score information.
13. Emergency overlay can be triggered.
14. System health page shows connected clients and current state.
15. Important actions are written to JSONL audit log.
16. Generic, LoL, AOV, and HoK adapters exist.
17. LoL-specific logic is not hardcoded into the universal draft core.
18. Documentation explains how to operate the system locally.
19. The system can run on a local network without internet.
20. No player-side automation is implemented.

---

## Forbidden Agent Behavior

Do not:

- Convert the project into a LoL-only system.
- Hardcode LoL champion names or Riot-specific behavior into shared core packages.
- Implement player-side automation.
- Implement auto-pick or auto-ban.
- Add LoL LCU reader in v0.1.
- Add LoL in-game HUD in v0.1.
- Add Data Dragon automatic sync in v0.1.
- Add OBS WebSocket, vMix, Bitfocus Companion, or Stream Deck integration in v0.1.
- Add SQLite, cloud sync, or user login in v0.1 unless explicitly requested.
- Delete user files or existing implementation without clear reason.
- Make broad rewrites when a focused change is enough.
- Hide errors or claim tests passed without running them.
- Leave the project in a state where root commands are broken without reporting it.
- Introduce internet dependency for live-show operation.
- Place mutation controls inside overlay routes.
- Use vague TODOs such as `fix later` or `improve this`.

---

## Handoff Summary Format

At the end of every task, provide this summary:

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
- Not run: ...

Notes / risks:
- ...

Suggested next task:
- ...
```

If the task was documentation-only, say that no code or tests were changed.

---

## Final Reminder

This project is for live esports production.

A beautiful overlay that fails under pressure is not acceptable.

A simple, reliable, manual-first system is more valuable than an advanced API-dependent system.

Build the foundation first.
