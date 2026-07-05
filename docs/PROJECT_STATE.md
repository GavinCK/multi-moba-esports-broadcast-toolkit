# PROJECT_STATE

Updated: 2026-07-05 · by Claude (Fable 5) · session: governance setup (Day 1)

## Baseline

- HEAD: `eebba12` docs: add governance layer (CLAUDE.md, PROJECT_STATE, ADRs, task specs); archive legacy handoffs
- origin/main: `1d3bde8` (push pending, user's discretion)
- Working tree: clean (user-verified in PowerShell, 2026-07-05, post ADR-006 recovery)
- `pnpm verify` on current baseline: ☐ pending user confirmation (docs-only commits since last green run)
- 2026-06-04 file-corruption incident: repaired and hash-verified (ADR-002); root cause now attributed to AI-mount writes (ADR-006)

## Mission: LoL-first MVP — acceptance checklist

- ☐ 1. Load sample LoL match
- ☐ 2. Operator completes full ban/pick; timer correct (double-pick turns share one 30s window — ADR-003)
- ☐ 3. Final lineup swap / reset / confirm
- ☐ 4. Producer updates match label / BO / score / game number / patch live
- ☐ 5. Overlay (read-only) reflects items 1–4 correctly
- ☐ 6. OBS/vMix 1920×1080 rehearsal: transparent background, no scrollbars, no debug text, no broken images

Historical manual QA previously passed for items 2/3/5 at data level; formal sign-off happens at the full rehearsal.

## Tracks

- **A. Overlay design — APPROVED (round 3, 2026-07-05).** Figma `02_Design` (3 frames + ICON_WORKBENCH, node 41:2) locked into `docs/design/LOL_DRAFT_OVERLAY_APPROVED_DESIGN_SPEC.md` (binding for implementation). Asset sourcing: official role SVGs + splashes arrive via T-004 user-machine script; overlay must run on fallbacks until then.
- **B. Logic tasks (Codex, parallel-safe)** — T-001 crash recovery: spec ready, not run. T-002 no-ban path: spec ready, not run.

## Queue (strict order — one Codex task per run, stop for review after each)

1. User commits governance/design docs (block prepared by Claude)
2. Codex T-001 crash recovery → review → commit
3. Codex T-002 no-ban path → review → commit
4. Codex T-003 overlay visual implementation → review vs Figma frames → commit
5. User runs T-004 prep script task (Codex writes it; user executes script) → commit
6. Full rehearsal (operator→producer→overlay→OBS) → MVP sign-off → update this file
7. Succession handoff to next planner model

## Frozen — no new work until MVP passes

theme-engine (933 lines, unwired), core-overlay (skeleton), Program/Preview/Emergency/ScoreBug overlay routes, Caster panel, AOV/HOK/generic-moba adapters, event package editor/import-export.

## Post-MVP backlog (do not start early)

Fearless Draft enforcement (ADR-004), First Selection red-first ruleset variant (ADR-004), operator hotkeys (only if rehearsal shows need), theme-engine wiring or deletion decision.

## Known constraints

- **Licensing (user-confirmed 2026-07-05): the user's organization runs Riot-licensed tournaments and may use certain official Riot assets (e.g., position/role icons).** Design mockups use placeholder vectors; implementation binds official icons from local event-package assets. Runtime stays local-only (no CDN) regardless.

- User runs Codex and ALL git write operations (Claude prepares the PowerShell blocks — see CLAUDE.md working rules and ADR-006). Governance commit landed as `eebba12` (2026-07-05).
- Overlay read-only guardrail enforced at both server and client layers.
