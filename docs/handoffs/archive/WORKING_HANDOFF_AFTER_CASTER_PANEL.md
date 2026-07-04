Summary:
- Completed TQ-084: Implement Caster Read-only Panel.
- Added a public-safe `/caster` and `/caster/:matchId` role route inside the existing `@mmbt/admin-dashboard` app.
- Built a read-only match view for casters with match title, format, status, score, current game, teams, players, draft summary, picks/bans summary, completed draft summaries where already available, and connection/server/realtime status.
- Kept the Caster Panel on existing read-only dashboard state, API client, and Socket.IO patterns. It only performs safe GET reads for state, draft detail, and adapter data.
- Added URL match ID preselect plus empty, error, partial-detail, and missing-match states.
- Added route, rendering, guardrail, and socket-identity tests for the caster route.

Files changed:
- `README.md`
- `apps/admin-dashboard/src/App.tsx`
- `apps/admin-dashboard/src/App.test.tsx`
- `apps/admin-dashboard/src/caster/CasterPanel.tsx`
- `apps/admin-dashboard/src/state/socketClient.ts`
- `apps/admin-dashboard/src/state/socketClient.test.ts`
- `apps/admin-dashboard/src/styles.css`
- `WORKING_HANDOFF_AFTER_CASTER_PANEL.md`

Commands run:
- command: `git status --short`; result: clean before edits.
- command: `git branch --show-current`; result: `main`.
- command: `git log --oneline -5`; result: latest commits reviewed, newest was `bf049c4 feat(admin-dashboard): add producer panel`.
- command: Read required source documents and prior handoffs; result: succeeded.
- command: `pnpm.cmd install --frozen-lockfile`; result: failed once in sandbox due Corepack cache access outside workspace, rerun with approval and passed. Lockfile was already up to date; Node emitted an existing `url.parse()` deprecation warning.
- command: `pnpm.cmd verify`; result: failed once in sandbox due Corepack cache access outside workspace, rerun with approval and passed before implementation.
- command: `pnpm.cmd --filter @mmbt/admin-dashboard lint`; result: passed before implementation and passed after implementation.
- command: `pnpm.cmd --filter @mmbt/admin-dashboard typecheck`; result: passed before implementation and passed after implementation.
- command: `pnpm.cmd --filter @mmbt/admin-dashboard test`; result: passed before implementation with 6 files and 38 tests; passed after implementation with 6 files and 42 tests.
- command: `pnpm.cmd --filter @mmbt/admin-dashboard build`; result: passed before implementation and passed after implementation.
- command: `pnpm.cmd lint`; result: passed after implementation.
- command: `pnpm.cmd typecheck`; result: passed after implementation.
- command: `pnpm.cmd test`; result: passed after implementation.
- command: `pnpm.cmd build`; result: passed after implementation.
- command: `pnpm.cmd verify`; result: passed after implementation.
- command: focused caster guardrail search; result: no caster POST calls, mutation socket emits, production controls, overlay routes, raw audit paths, raw socket IDs, private emergency reason text, stack traces, or local file path labels found.
- command: in-app Browser smoke attempt; result: unavailable. The Browser runtime crashed while spawning local helper processes with `windows sandbox failed: spawn setup refresh`.
- command: `git diff --check`; result: passed before this handoff file was added.
- command: `git status --short`; result: reviewed changed files before this handoff file was added.
- command: `git diff --name-only`; result: reviewed tracked modified files before this handoff file was added; untracked files were visible through `git status --short`.

Verification:
- Passed: `/caster` and `/caster/:matchId` route mapping.
- Passed: URL match ID preselect.
- Passed: current/selected match summary with format, status, score, and current game number.
- Passed: blue/red team and player rendering where player data is available.
- Passed: current draft public summary.
- Passed: picks/bans summary from draft detail when available, with safe summary fallback.
- Passed: completed draft summary uses only draft summaries already present in existing dashboard state.
- Passed: connection, server, realtime, revision, event package, and connected-client status rendering.
- Passed: empty, partial-detail, error, and missing-match states.
- Passed: socket identity maps `/caster` to `CASTER / caster-panel`.
- Passed: Caster Panel tests assert no forbidden mutation controls and no POST calls.
- Passed: dashboard lint, typecheck, test, and build.
- Passed: root lint, typecheck, test, build, and verify.
- Failed: none in final automated verification.
- Not run / unavailable: visual/manual browser rehearsal. Browser startup was attempted, but the in-app Browser runtime crashed while spawning local server/dashboard helper processes.

Manual rehearsal:
- Required: yes.
- Result: not completed in-browser because the Browser runtime was unavailable in this session. Automated React rendering tests, socket-client tests, lint, typecheck, build, and root verify passed.

Scope guardrails checked:
- Caster Panel is read-only.
- No draft mutation controls added.
- No Start Draft, Pause, Resume, Hover, Lock, Undo, Redo, Reset Draft, Complete Draft, or Create Draft controls added.
- No production controls added.
- No Preview, Take to Program, Clear Program, Trigger Emergency, or Clear Emergency controls added.
- No overlay routes added or implemented.
- No OBS WebSocket integration.
- No vMix API integration.
- No Companion or Stream Deck integration.
- No database, SQLite, Prisma, cloud sync, auth, or login added.
- No official game API, Riot API, LCU, Data Dragon, Garena API, Tencent API, or TiMi API added.
- No player-side automation.
- No auto-pick or auto-ban.
- No socket-side mutation path added.
- No mutation REST endpoint is called from the Caster Panel.
- No raw audit paths, raw socket IDs, hidden competitive information, raw emergency reason text, private operator notes, stack traces, or local file paths are exposed by the Caster Panel.

Notes / risks:
- Full side-specific pick/ban ownership depends on `GET /api/drafts/:draftId` succeeding. If draft detail is unavailable, the panel intentionally falls back to combined reported picks/bans from the existing draft summary so it does not misattribute sides.
- Completed draft history is limited to summaries already available in `snapshot.drafts`; the Caster Panel does not fetch or create additional historical state.
- The in-app Browser smoke issue appears tooling-related, not an app compile/test failure. No local helper server processes were left running.
- Build output may exist in ignored `dist/` folders after verification, but no build output is tracked.

Suggested next task:
- TQ-090 — Create Overlay App Shell, Socket Client, and Debug Mode
