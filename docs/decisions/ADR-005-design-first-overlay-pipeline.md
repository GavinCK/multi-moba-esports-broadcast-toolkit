# ADR-005: Design-first overlay pipeline — no freeform visual prompts

Status: Accepted · Date: 2026-07-05

## Context

Seven freeform "make it look like LCK" prompt attempts produced engineer-styled UI (hatched placeholders, app-button icons, redundant labels, debug leaks, scrollbar artifacts). Post-mortem: code-generation agents implement well but do not art-direct well. The Figma file `BanPick-UI` contained only reference screenshots — no actual design ever existed for implementers to follow.

## Decision

All overlay visual work follows this pipeline, in order: (1) design produced in Figma (or static HTML/CSS artifact) by the planner/art-director role; (2) user approves frames; (3) approved design is written down as a locked spec (geometry, tokens, typography, per-state visual matrix) in `docs/design/`; (4) implementation prompt derives from that spec — implementer changes nothing visually beyond it. Freeform visual prompts to code agents are banned.

## Consequences

- Design iteration cost lives in Figma rounds, not in code churn.
- `docs/design/LOL_DRAFT_OVERLAY_LCK_INSPIRED_IMPLEMENTATION_SPEC.md` (geometry, verified accurate vs LCK refs) is the base; the approved-design spec will extend it.
