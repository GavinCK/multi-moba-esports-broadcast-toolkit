# ADR-004: Fearless Draft + First Selection deferred to post-MVP; overlay design reserves space now

Status: Accepted · Date: 2026-07-05

## Context

2026 LCK rules include: (1) **Hard Fearless** in Bo3/Bo5 — from game 2, all champions played earlier in the series are locked for both teams (up to 30 unavailable by game 3); (2) **First Selection** — first pick is no longer tied to Blue side; the priority team chooses side OR draft order. The current ruleset schema has `globalBanAcrossSeries` / `globalPickAcrossSeries` flags but zero enforcement, and phases hardcode Blue-first.

## Decision

Both features are post-MVP. BO1/showmatch standard draft (current MVP scope) is unaffected. However, the overlay design being produced NOW must reserve: a fearless-unavailable champions display row (LCK broadcast shows prior-game picks near the ban strip), and a bidirectional first-pick indicator in the center block (can point to either side).

## Consequences

- Post-MVP implementation path (both data-friendly): fearless = series-level validation using existing flags; First Selection = mirrored "red-first" ruleset variant selected at draft creation. No engine rewrite anticipated.
- Producer `firstPickSide` presentation field already exists and stays the display source.
