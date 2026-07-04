# ADR-006: All git write operations happen on the user's machine only

Status: Accepted · Date: 2026-07-05

## Context

The user delegated commit execution to the AI planner. The AI session's mounted filesystem proved unsafe for `.git` writes: `.git/index` was zero-byte-corrupted (same NUL-fill signature as the 2026-06-04 incident, which likely shares this root cause), `git add` failed with "bad signature 0x00000000", and a follow-on `git commit` — reachable due to a `;`-separated command pipeline that should have been strict `&&` — recorded an empty tree (local commit 746b0ec deleting all tracked files from history; working tree and remote were never touched).

## Decision

Recovery: `git reset --mixed 5f3c858` on the user's machine, then user stages and commits. Standing policy from now on: AI sessions never execute git write operations (add/commit/reset/rebase/push) through a mounted repo. AI prepares exact PowerShell blocks; the user executes them and pastes output back for verification. Read-only git (log/status/diff) in AI sessions is allowed for reconnaissance but treated as unreliable.

## Consequences

- Every commit gets human eyes at execution time — aligned with the approval-gate philosophy.
- AI-side file creation/editing remains allowed (native file tools proved reliable; only mount-mediated `.git` writes and shell renames/deletes exhibited corruption).
- If unexplained dirty state or NUL-filled files ever appear again, suspect the mount first; verify on the user's machine before any repair.
