# T-001: Draft/runtime state crash recovery

Status: SPEC READY — not run · Owner: Codex · Reviewer: planner + user

## Why

All runtime state (drafts in progress, producer presentation updates) is in-memory only. A server crash or accidental Ctrl+C during a live show loses the draft mid-match. Audit log exists but is write-only. This is the single biggest live-production risk (see architecture review, 2026-07-05).

## Design decisions (locked)

- Snapshot file: `event-packages/sample-event/runtime/state-snapshot.json` (directory created on demand; add `event-packages/*/runtime/` to `.gitignore`).
- Write trigger: every runtime revision increment, debounced ~500 ms, atomic write (write temp file, then rename).
- Snapshot contents: drafts runtime state, production runtime state, match presentation runtime overrides, revision, eventPackagePath, snapshot timestamp. Exclude: socket client lists, health transients.
- Startup behavior: if a snapshot exists AND its eventPackagePath matches the loaded package AND the package loads valid → restore it. Any draft that was RUNNING restores as PAUSED (operator resumes manually — broadcast-safe). Write an audit entry (e.g. `STATE_RESTORED_FROM_SNAPSHOT`) and expose a `restoredFromSnapshot: true` flag in the health payload.
- On mismatch or unparseable snapshot: rename it to `state-snapshot.stale.json`, start fresh, log a warning. Never crash on a bad snapshot.
- Fresh start procedure (documented, no code): stop server, delete the snapshot file.

## Codex prompt (copy verbatim)

```text
TASK: T-001 — Draft/runtime state crash recovery (snapshot + restore)

READ FIRST
- AGENTS.md
- docs/tasks/T-001-draft-state-crash-recovery.md (this spec — the "Design decisions (locked)" section is binding)
- apps/server/src/runtime-state.ts, draft-runtime.ts, production-runtime.ts, audit-log.ts, index.ts

GOAL
Server runtime state survives a process crash: state is periodically snapshotted to disk and restored on startup, so a live draft can continue (paused) after a server restart.

SCOPE — IN
1. Implement atomic, debounced (~500 ms) snapshot writes to event-packages/sample-event/runtime/state-snapshot.json on every runtime revision increment, per the locked design decisions.
2. Implement startup restore with eventPackagePath match check, RUNNING→PAUSED conversion for drafts, STATE_RESTORED_FROM_SNAPSHOT audit entry, and restoredFromSnapshot health flag.
3. Handle bad/mismatched snapshots by renaming to state-snapshot.stale.json and starting fresh with a logged warning.
4. Add event-packages/*/runtime/ to .gitignore.

SCOPE — OUT (do not do any of these)
- Do not modify packages/core-draft (engine, timer, lock/undo logic). Restore works purely at the server runtime layer; timers restore from their stored timestamp state in PAUSED status.
- Do not add new socket events; existing full-state emission on connect already covers clients after restart.
- Do not change any UI (admin dashboard, overlay).
- Do not add config systems/CLI flags; behavior is always-on.
- Do not run git add/commit/push.

FILES EXPECTED TO CHANGE
- apps/server/src/ (new snapshot module + wiring in runtime-state/index; you may add one new file, e.g. state-snapshot.ts)
- apps/server/src/index.test.ts or a new colocated test file
- .gitignore

ACCEPTANCE CRITERIA
1. Start server, start a draft, lock several bans/picks, kill the process → restart → draft state (locked heroes, phase index, presentation overrides) is intact; the draft is PAUSED; audit log has STATE_RESTORED_FROM_SNAPSHOT; health shows restoredFromSnapshot: true.
2. Snapshot from a different eventPackagePath is renamed .stale and ignored.
3. Corrupt JSON snapshot never crashes startup.
4. No snapshot directory content is committed (gitignore effective).

TESTING
- Unit tests: snapshot serialization round-trip; RUNNING→PAUSED conversion; mismatch and corrupt-file handling.
- pnpm lint, pnpm typecheck, pnpm test all pass.

REPORT FORMAT (produce this at the end, then STOP)
1. Summary. 2. File-by-file change list with line counts. 3. Test output summary. 4. Deviations flagged. 5. Open questions.
Do not start follow-up work after the report.
```

## Review checklist (planner fills after Codex run)

- ☐ Diff limited to listed files · ☐ core-draft untouched · ☐ atomic write pattern present · ☐ RUNNING→PAUSED covered by test · ☐ verify passes · ☐ user manual kill-restart test passed
