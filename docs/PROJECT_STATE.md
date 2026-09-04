# PROJECT_STATE

Updated: 2026-09-04 · temporary archival consolidation

> **Authoritative resume record:** read root [`HANDOFF.md`](../HANDOFF.md) before using this planning index. The 2026-07-07 succession handoff remains historical context only.

## Baseline

- Canonical branch: `main`; pre-archive base: `b9204a316ee95035a82d5cc9a26f8442f982d52b`.
- Canonical archived HEAD: the `origin/main` commit containing root `HANDOFF.md`; resolve with `git rev-parse origin/main`.
- Remote before archival push: `origin/main` at `1d3bde8`; local base was eight commits ahead and required no rebase/merge.
- Working tree target after archival consolidation: clean; T-003 code and archival docs intentionally committed, with caches/build output/runtime state ignored.
- Validation on 2026-09-04: `pnpm build` passed; build-first `pnpm verify` passed lint, typecheck, 320 tests, and build; server health smoke passed on port 3100. Fresh one-shot `pnpm verify` still needs a prior build. See root `HANDOFF.md` for exact evidence and risks.
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
- **B. Logic tasks** — T-001 crash recovery and T-002 no-ban path are implemented and automated-test green. Their manual kill/restart and UI checks remain unsigned.

## Queue (strict order — one Codex task per run, stop for review after each)

1. ✅ Governance/design docs committed (`eebba12` + follow-ups)
2. ✅ T-001 crash recovery — reviewed PASS, committed (`fac2015`)
3. ✅ T-002 no-ban path — reviewed PASS, committed
4. **▶ T-003 overlay visual implementation — CODE PRESERVED, AUTOMATED CHECKS GREEN, HUMAN VISUAL REVIEW PENDING.** Review the exact spec/code and asset-routing risks in root `HANDOFF.md` before acceptance.
5. T-004 prep script (Codex writes; user executes script on own machine) → commit
6. Full rehearsal (operator→producer→overlay→OBS) → MVP sign-off → update this file
7. Post-MVP discussion only after item 6 (Fearless, red-first ruleset, hotkeys)

## Frozen — no new work until MVP passes

theme-engine (933 lines, unwired), core-overlay (skeleton), Program/Preview/Emergency/ScoreBug overlay routes, Caster panel, AOV/HOK/generic-moba adapters, event package editor/import-export.

## Post-MVP backlog (do not start early)

Fearless Draft enforcement (ADR-004), First Selection red-first ruleset variant (ADR-004), operator hotkeys (only if rehearsal shows need), theme-engine wiring or deletion decision.

## Known constraints

- **Licensing (user-confirmed 2026-07-05): the user's organization runs Riot-licensed tournaments and may use certain official Riot assets (e.g., position/role icons).** Design mockups use placeholder vectors; implementation binds official icons from local event-package assets. Runtime stays local-only (no CDN) regardless.

- User runs Codex and ALL git write operations (Claude prepares the PowerShell blocks — see CLAUDE.md working rules and ADR-006). Governance commit landed as `eebba12` (2026-07-05).
- Overlay read-only guardrail enforced at both server and client layers.
