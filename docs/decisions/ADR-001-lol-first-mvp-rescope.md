# ADR-001: LoL-first MVP rescope

Status: Accepted · Date: 2026-07-05

## Context

v0.1 expanded horizontally (caster panel, program/preview/emergency overlays, health dashboard, theme engine, AOV/HOK adapters) before the core product — a usable LoL ban/pick overlay — was accepted. Overlay art direction failed 7 times under freeform prompts.

## Decision

Narrow to a LoL-first MVP defined by the 6-item acceptance checklist in `docs/PROJECT_STATE.md`. Freeze all non-LoL and platform features (no deletion — the game-agnostic architecture is correct and stays). Multi-MOBA support resumes only after MVP sign-off.

## Consequences

- All new work must map to an MVP checklist item or an approved surgical fix (T-001, T-002).
- Frozen modules stay in the repo untouched; do not refactor, do not extend, do not delete.
