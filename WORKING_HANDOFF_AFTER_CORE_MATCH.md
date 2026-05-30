Summary:
- Completed TQ-021: implemented the game-agnostic core match validation and helper layer.
- Added validation for event, team, player, sponsor, match, game instance, and aggregate match bundle data using shared types from `@mmbt/shared-types`.
- Added BO1/BO3/BO5/BO7 format helpers, score bounds, current game bounds, explicit match/game status checks, sponsor slot checks, reference checks, duplicate ID checks, and JSON-serializable metadata checks.
- Added read-only helper functions for match games, current game, match teams, and immutable score updates.
- Added unit tests for valid and invalid event/match/game/team/player/sponsor/bundle data.
- Did not implement draft engine logic, draft lifecycle, server APIs, Socket.IO runtime, dashboard UI, overlays, game adapters, future LoL integrations, database/cloud/login features, or player-side automation.

Files changed:
- packages/core-match/package.json: updated package description/dev text and added workspace dependency on `@mmbt/shared-types`.
- packages/core-match/src/index.ts: replaced skeleton marker with public exports.
- packages/core-match/src/constants.ts: added supported match formats, statuses, team sides, and sponsor slots.
- packages/core-match/src/helpers.ts: added match format, game lookup, current game, and team lookup helpers.
- packages/core-match/src/types.ts: added core-match validation result, issue, match bundle, and match team helper types.
- packages/core-match/src/validation.ts: added validation functions and immutable score update helper.
- packages/core-match/src/index.test.ts: replaced skeleton test with core-match validation/helper unit tests.
- packages/core-match/dist/index.d.ts, packages/core-match/dist/index.js, packages/core-match/dist/index.js.map: updated by the required build because the repository already tracks package dist files.
- pnpm-lock.yaml: updated workspace dependency link for `packages/core-match`.
- WORKING_HANDOFF_AFTER_CORE_MATCH.md: created this handoff.

Commands run:
- Get-Content -Raw AGENTS.md: succeeded.
- Get-Content -Raw docs/TASK_QUEUE.md: succeeded.
- Get-Content -Raw docs/ACCEPTANCE_CRITERIA.md: succeeded.
- Get-Content -Raw Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md: succeeded.
- Get-Content -Raw WORKING_HANDOFF_AFTER_SHARED_TYPES.md: succeeded.
- Get-Content -Raw IMPLEMENTATION_PROMPT_FOR_CODEX.md: succeeded.
- Repository/package inspection commands using Get-ChildItem, Get-Content, rg, git status, git diff: succeeded.
- pnpm.cmd install: failed inside sandbox with Corepack cache EPERM; rerun with approved escalation and passed with no downloads.
- pnpm.cmd --filter @mmbt/core-match test: failed inside sandbox with Corepack cache EPERM; rerun with approved escalation and initially failed one fixture expectation; fixed fixture and final rerun passed.
- pnpm.cmd --filter @mmbt/core-match typecheck: failed inside sandbox with Corepack cache EPERM; rerun with approved escalation and initially failed on ES2023 `toSorted` plus ID lookup narrowing; fixed and final rerun passed.
- pnpm.cmd lint: passed with approved escalation.
- pnpm.cmd typecheck: passed with approved escalation.
- pnpm.cmd test: passed with approved escalation.
- pnpm.cmd build: passed with approved escalation.
- pnpm.cmd verify: passed with approved escalation.
- rg "Riot|LCU|DataDragon|champion-select|SummonerSpell" packages/core-match: passed with no matches.
- git diff --check: passed with line-ending warnings only.

Verification:
- Passed: pnpm.cmd --filter @mmbt/core-match test.
- Passed: pnpm.cmd --filter @mmbt/core-match typecheck.
- Passed: pnpm.cmd lint.
- Passed: pnpm.cmd typecheck.
- Passed: pnpm.cmd test.
- Passed: pnpm.cmd build.
- Passed: pnpm.cmd verify.
- Passed: core-match forbidden-term guardrail search returned no matches.
- Passed: git diff --check found no whitespace errors.
- Failed: initial non-escalated pnpm commands failed because Corepack pnpm cache access is outside the workspace sandbox.
- Failed: first escalated core-match test run failed on an over-broken invalid bundle fixture; fixed before final verification.
- Failed: first escalated core-match typecheck run failed on `Array.prototype.toSorted` and ID lookup narrowing; fixed before final verification.
- Not run / unavailable: none.

Manual rehearsal:
- Required: no
- Result: Not applicable

Scope guardrails checked:
- Universal Ban/Pick remains game-agnostic.
- LoL In-game HUD remains future plugin.
- Production Control remains above Universal Draft and game-specific plugins.
- v0.1 remains local-first, manual-first, production-safe.
- Overlay routes remain read-only.
- No player-side automation.
- No auto-pick.
- No auto-ban.
- No hidden competitive information exposure.
- No internet/cloud/OBS WebSocket/vMix API requirement added.

Notes / risks:
- Validation is intentionally structural and local to the shared match contracts. It does not implement tournament policy, draft lifecycle behavior, server persistence, audit logging, or game-specific adapter behavior.
- `GameCode` remains open-ended through shared types; core-match only checks that a match game code is enabled for the event when event game codes are provided.
- Existing repository state already tracks dist build outputs across packages even though root `.gitignore` ignores `dist/`; the required build updated tracked core-match dist files. No node_modules or new ignored build outputs were added to Git.
- The core-match package stays UI-free and does not import from `/games`.

Suggested next task:
- TQ-030 - Create Detailed Ban/Pick Rules Harness Document.
