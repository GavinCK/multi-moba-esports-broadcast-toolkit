# Codex Task Prompt Template

Every Codex prompt is written in English, derives from a `docs/tasks/T-*.md` spec, and follows this structure. Copy the block below and fill it in.

```text
TASK: T-XXX — <title>

READ FIRST
- AGENTS.md (guardrails and conventions)
- docs/tasks/T-XXX-<name>.md (this task's full spec — follow it exactly)
- Files listed under "Files expected to change"

GOAL
<one paragraph: the single outcome this task delivers>

SCOPE — IN
<numbered list of concrete changes>

SCOPE — OUT (do not do any of these)
- Do not modify the draft engine core (timer, lock/undo paths) beyond what the spec explicitly allows.
- Do not add overlay mutation controls, mutation REST calls, or mutation socket events.
- Do not add runtime internet dependencies (Riot API, Data Dragon CDN, LCU).
- Do not refactor unrelated code, rename files, or reformat untouched lines.
- Do not run git add/commit/push. Leave the working tree for human review.
- <task-specific exclusions>

FILES EXPECTED TO CHANGE
<explicit list; adding a file not listed here requires flagging it in the report>

ACCEPTANCE CRITERIA
<numbered, testable statements>

TESTING
- Add/update unit tests covering <...>.
- All of: pnpm lint, pnpm typecheck, pnpm test must pass.

REPORT FORMAT (produce this at the end, then STOP)
1. Summary of what changed and why (short).
2. File-by-file change list with approximate line counts.
3. Test results (paste the summary lines).
4. Any deviations from this spec, flagged explicitly.
5. Open questions for the reviewer.
Do not start any follow-up work after the report.
```

Planner checklist before issuing a prompt: spec file committed? scope-out list covers the protected zones this task borders? acceptance criteria testable? files list complete?
