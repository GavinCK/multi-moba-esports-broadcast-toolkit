# ADR-003: Double-pick turns share one timer window — engine model is CORRECT

Status: Accepted · Date: 2026-07-05

## Context

Review initially flagged the LoL ruleset's `count: 2` pick phases (single 30s window for two picks) as deviating from LCK. The user challenged this from broadcast observation. Verification against the official LoL client behavior and the League Wiki (Team drafting: pick turns are 27s + lock buffer, teams "pick two at a time" simultaneously within one turn) confirmed: **double picks share one timer window in real tournament draft**.

## Decision

The engine's `count: 2 / timeSeconds: 30` phase model stands. Do NOT split double-pick phases into per-pick phases. Do NOT add per-pick timer resets. The overlay timer bar runs once per turn, including double-pick turns.

## Consequences

- The passed timer core remains untouched.
- Any future "fix" proposal touching draft timing must cite this ADR and new primary evidence (client behavior change or official rules change).
- Sources: wiki.leagueoflegends.com/en-us/Team_drafting · user broadcast observation (2026-07-05).
