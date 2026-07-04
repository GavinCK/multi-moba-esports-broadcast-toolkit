# Working Handoff After Reference-Driven Harness Policy

## Task Summary

Completed docs-only task `DOC-PATCH-REFERENCE-STANDARDS`.

This patch updates the harness philosophy so future Codex work is reference-driven for feature completeness and broadcast quality while still preserving:

- game-agnostic universal draft core
- manual-first live operation
- local-first show runtime
- read-only overlays
- legal/asset boundaries
- no player-side automation, auto-pick, or auto-ban

No runtime code, package files, lockfiles, generated data, image assets, event package JSON, or tests were intentionally modified by this task.

## Starting Checks Recorded

`git status --short` before edits showed existing uncommitted work, including docs and non-doc/source changes:

```text
 M AGENTS.md
 M README.md
 M apps/overlay/src/guardrails.test.ts
 M apps/overlay/src/overlays/DraftOverlay.test.tsx
 M apps/overlay/src/overlays/DraftOverlay.tsx
 M apps/overlay/src/overlays/ScoreBugOverlay.test.tsx
 M apps/overlay/src/overlays/ScoreBugOverlay.tsx
 M docs/API_SOCKET_CONTRACT.md
 M docs/game-adapter-guide.md
 M event-packages/sample-event/README.md
 M games/lol/package.json
 M games/lol/src/adapter.ts
 M games/lol/src/data.ts
 M games/lol/src/index.test.ts
 M games/lol/src/index.ts
 M games/lol/src/validation.ts
?? WORKING_HANDOFF_AFTER_LOL_CHAMPION_DATA_IMAGE_PIPELINE.md
?? ZIP/
?? apps/overlay/src/components/SafeLocalImage.tsx
?? docs/REFERENCE_DRIVEN_IMPLEMENTATION_POLICY.md
?? docs/ZIP.zip
?? docs/ZIP/
?? event-packages/sample-event/assets/hero-icons/lol/
?? event-packages/sample-event/logs/production-log.jsonl
?? games/lol/README.md
?? games/lol/scripts/
?? games/lol/src/generated-champions.ts
```

`git diff --stat` before edits:

```text
16 files changed, 259 insertions(+), 69 deletions(-)
```

`git log --oneline -8` before edits:

```text
acefe1e docs: research LoL draft overlay design
e073b5c docs: update README local run and v0.1 scope
ff906b1 docs: add game adapter developer guide
9a8998e docs: add operator guide
771c118 docs: add local LAN deployment guide
c4ac68f feat(health): complete system health dashboard
61c3fd1 fix(server): harden audit logging and health reporting
8ab2394 feat(overlay): add program preview emergency overlays
```

## Files Changed / Created

Docs/handoff files updated or present for this task:

- `AGENTS.md` - pre-existing reference-policy edits were verified and preserved.
- `IMPLEMENTATION_PROMPT_FOR_CODEX.md` - added reference-driven implementation, full LoL roster, pre-event/static Data Dragon allowance, operator UI standards, overlay standards, and runtime-only Data Dragon ban.
- `README.md` - added reference-driven/copy-driven distinction, static Data Dragon allowance, fallback safety-net principle, and policy link.
- `docs/REFERENCE_DRIVEN_IMPLEMENTATION_POLICY.md` - required central policy file exists and was verified.
- `docs/ACCEPTANCE_CRITERIA.md` - added policy compliance, LoL roster/search/icon criteria, overlay visual QA criteria, and static guardrail guidance.
- `docs/TASK_QUEUE.md` - inserted Phase 11.5 corrective tasks between TQ-112 and TQ-120 and updated execution order.
- `docs/BAN_PICK_RULES.md` - added action slot label presentation rules and clarified runtime Data Dragon boundary.
- `docs/EVENT_PACKAGE_SPEC.md` - added local LoL icon package path, examples, and pre-event/static Data Dragon asset preparation policy.
- `docs/OVERLAY_SPEC.md` - added broadcast-vs-dashboard language, LoL draft reference visual standard, fallback requirements, timer requirements, and 1920x1080 QA.
- `docs/game-adapter-guide.md` - clarified richer LoL adapter guidance, full roster expectation, static import allowance, local icon path convention, and search normalization.
- `docs/design/LOL_DRAFT_OVERLAY_DESIGN_RESEARCH.md` - added status note making it an implementation reference while forbidding copying.
- `WORKING_HANDOFF_AFTER_REFERENCE_DRIVEN_HARNESS_POLICY.md` - this handoff.

Pre-existing non-doc/source changes remain in the working tree and were intentionally preserved.

## Policy Decision Summary

Reference-driven implementation is now encouraged for:

- feature completeness
- operator UX
- champion selector/search behavior
- asset pipeline shape
- broadcast overlay hierarchy
- OBS/vMix browser-source behavior
- manual QA expectations

Reference-driven does not mean copy-driven. Public references may inform concepts, but implementation must be rebuilt inside this project's own React, TypeScript, Node, Socket.IO, JSON event package, and local asset architecture.

Fallback rendering is a safety net for live-show resilience. It is not the target production UX.

## What Is Now Allowed

- Inspect mature public tools such as `RCVolus/lol-pick-ban-ui`, `RCVolus/league-prod-toolkit`, LeagueBroadcast-like tooling as conceptual reference only, OBS/vMix docs, and Riot Data Dragon public documentation.
- Use Data Dragon as a pre-event/static source for public LoL champion metadata and approved local icon preparation.
- Keep generated local LoL champion metadata under LoL-specific adapter/data areas.
- Package approved local LoL icons in event packages, recommended at `assets/hero-icons/lol/<ChampionDataId>.png`.
- Build a full practical local LoL champion roster for manual draft rehearsal.
- Use reference-driven broadcast layout standards for LoL draft overlay work.

## What Remains Forbidden

- Runtime dependency on Data Dragon CDN during show operation.
- Runtime Riot API dependency.
- Runtime LCU dependency.
- Mandatory internet for champion metadata or icons during show operation.
- Automatic show-time asset/data sync that changes live data without operator approval.
- Copying third-party source code, assets, exact layouts, branding, sponsor treatments, screenshots, or trade dress.
- Committing third-party repos or large artwork bundles without explicit approval.
- LoL-specific behavior in the universal draft core.
- Player-side automation, auto-pick, auto-ban, player client control, or hidden competitive information exposure.
- Overlay mutation controls or overlay calls to live mutation endpoints.

## Task Queue Additions

Inserted new Phase 11.5 before TQ-120:

- `DOC-REF-001 - Patch Reference-Driven Implementation Policy`
- `FIX-LOL-DATA-UI - Wire Full LoL Roster, Search, Icons, and Full-Name Fallback into Draft Operator`
- `FIX-DRAFT-TIMER-LABELS - Fix Countdown Timer and Side/Action/Ordinal Slot Labels`
- `FIX-LOL-OVERLAY-REFERENCE-DESIGN - Redesign LoL Draft Overlay Using Reference-Driven Broadcast Standards`
- `TEST-OBS-VMIX-VISUAL-QA - Perform Manual 1920x1080 Browser/OBS/vMix Visual QA`

The recommended execution order now places these tasks after TQ-112 and before TQ-120.

## Verification Run / Results

Required verification:

- `git diff --stat`: passed. Output included both this docs patch and pre-existing uncommitted non-doc/source changes.
- `git diff -- AGENTS.md IMPLEMENTATION_PROMPT_FOR_CODEX.md docs/REFERENCE_DRIVEN_IMPLEMENTATION_POLICY.md docs/ACCEPTANCE_CRITERIA.md docs/TASK_QUEUE.md docs/EVENT_PACKAGE_SPEC.md docs/OVERLAY_SPEC.md docs/game-adapter-guide.md docs/BAN_PICK_RULES.md README.md docs/design/LOL_DRAFT_OVERLAY_DESIGN_RESEARCH.md`: passed and reviewed.
- `rg -n "lint:docs" package.json apps packages games`: no matches; no docs lint script exists.

Additional verification:

- `git diff --check`: passed.
- Static phrase checks were run to catch leftover old wording such as `sample champion list only`, `sample champion pool`, and over-broad Data Dragon wording. Remaining Data Dragon mentions are scoped to active runtime/show-time restrictions or docs guidance.

Not run:

- `pnpm lint:docs`: unavailable; no docs lint script exists.
- Broad `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm verify`: not run because this task is docs-only and the prompt requested docs-specific verification.
- Manual rehearsal / OBS / vMix QA: not part of this docs-only task.

## Non-Doc Files

No non-doc files were intentionally touched by this task.

There were already uncommitted non-doc/source changes before this task began. They were preserved and not reverted.

## Warnings / Preservation Notes

- Preserve the existing uncommitted LoL champion-data/image-pipeline work unless the user explicitly asks to modify or revert it.
- Preserve `event-packages/sample-event/assets/hero-icons/lol/` and related uncommitted LoL asset-path work unless the next task explicitly scopes asset handling.
- Do not commit runtime `event-packages/sample-event/logs/production-log.jsonl` unless the project owner explicitly wants that log archived in source control.
- `docs/REFERENCE_DRIVEN_IMPLEMENTATION_POLICY.md` was already present as untracked work at task start; this task verified and incorporated it as the central policy.

## Next Recommended Codex Task

```text
FIX-LOL-DATA-UI - Wire Full LoL Roster, Search, Icons, and Full-Name Fallback into Draft Operator
```

Exact suggested prompt title:

```text
FIX-LOL-DATA-UI - Wire Full LoL Roster, Search, Icons, and Full-Name Fallback into Draft Operator
```
