# ADR-002: 2026-06-04 overlay file corruption and repair

Status: Accepted · Date: 2026-07-05

## Context

After the June 2026 pause, 4 overlay files (`App.test.tsx`, `DraftOverlay.test.tsx`, `DraftOverlay.tsx`, `styles.css`) appeared modified. Byte-level analysis showed each contained exact HEAD (`1d3bde8`) content followed by NUL-byte tails (up to 53 KB) — a crash-interrupted write from 2026-06-04, not uncommitted design work. The screenshot-spec visual WIP was already lost on that date. The rejected-WIP patch file and one stale handoff file no longer existed on disk.

## Decision

Repaired all 4 files by writing hash-verified HEAD blob content (each verified byte-perfect against `1d3bde8`). No WIP existed to back up. User confirmed clean `git status` locally on 2026-07-05.

## Consequences

- The only surviving record of the rejected visual passes is the reference screenshot in Figma (`01_References`, node 1:19).
- Lesson encoded in CLAUDE.md bootstrap: every session starts with a baseline check; unexpected dirty state is classified before any work.
