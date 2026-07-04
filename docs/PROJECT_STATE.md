# PROJECT_STATE

Updated: 2026-07-05 · by Claude (Fable 5) · session: governance setup (Day 1)

## Baseline

- HEAD: `5f3c858` docs(overlay): add LCK-inspired pixel implementation spec
- Working tree: clean (verified by user in PowerShell, 2026-07-05)
- `pnpm verify` on current baseline: ☐ pending user confirmation
- 2026-06-04 file-corruption incident: repaired and hash-verified (see ADR-002)

## Mission: LoL-first MVP — acceptance checklist

- ☐ 1. Load sample LoL match
- ☐ 2. Operator completes full ban/pick; timer correct (double-pick turns share one 30s window — ADR-003)
- ☐ 3. Final lineup swap / reset / confirm
- ☐ 4. Producer updates match label / BO / score / game number / patch live
- ☐ 5. Overlay (read-only) reflects items 1–4 correctly
- ☐ 6. OBS/vMix 1920×1080 rehearsal: transparent background, no scrollbars, no debug text, no broken images

Historical manual QA previously passed for items 2/3/5 at data level; formal sign-off happens at the full rehearsal.

## Tracks

- **A. Overlay design (Figma `BanPick-UI`)** — references reviewed (3 LCK refs + 1 rejected Codex output). `02_Design` page with 3 state frames: **not started — next action**. Design must reserve: fearless-unavailable champions row, bidirectional first-pick indicator (ADR-004).
- **B. Logic tasks (Codex, parallel-safe)** — T-001 crash recovery: spec ready, not run. T-002 no-ban path: spec ready, not run.

## Queue (strict order within each track)

1. User runs Codex on T-001, then T-002 (parallel with Track A design work)
2. Figma 02_Design frames → user approval rounds → written design spec in `docs/design/`
3. T-003 overlay implementation (BLOCKED until design spec approved)
4. Full rehearsal → MVP sign-off → update this file
5. Succession handoff to next planner model

## Frozen — no new work until MVP passes

theme-engine (933 lines, unwired), core-overlay (skeleton), Program/Preview/Emergency/ScoreBug overlay routes, Caster panel, AOV/HOK/generic-moba adapters, event package editor/import-export.

## Post-MVP backlog (do not start early)

Fearless Draft enforcement (ADR-004), First Selection red-first ruleset variant (ADR-004), operator hotkeys (only if rehearsal shows need), theme-engine wiring or deletion decision.

## Known constraints

- User runs Codex and ALL git write operations (Claude prepares the PowerShell blocks — see CLAUDE.md working rules and ADR-006). Governance commit status: ☐ pending user recovery + commit (reset --mixed 5f3c858, then stage + commit).
- Overlay read-only guardrail enforced at both server and client layers.
