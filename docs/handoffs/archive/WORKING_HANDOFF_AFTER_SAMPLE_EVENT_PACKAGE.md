Summary:
- Completed TQ-060 by creating a local-first sample event package under `event-packages/sample-event`.
- Added event metadata, two fictional sample teams, ten fictional sample players, one fictional sponsor, four sample matches, four static manual draft rulesets, a default theme, local placeholder SVG assets, fallback assets, and a logs folder marker.
- The sample matches cover one Generic MOBA BO3 plus LoL, AOV, and HoK BO1 examples using the existing v0.1 adapter `gameCode` values.
- The sample rulesets are static/manual only and use the current adapter ruleset IDs: `generic-moba-standard-5v5`, `lol-sample-standard-5v5`, `aov-sample-standard-5v5`, and `hok-sample-global-bp-5v5`.
- Added a lightweight static validation workspace under `tests/sample-event` and included it in the pnpm workspace so root verification covers sample event JSON parsing, entity linkages, local-only asset references, known adapter IDs, and unsafe future-scope field guardrails.
- Did not implement server loading, Socket.IO, UI, overlays, file watching, runtime APIs, database persistence, official game integrations, player-side automation, or automatic draft actions.

Files changed:
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `event-packages/sample-event/event.json`
- `event-packages/sample-event/teams.json`
- `event-packages/sample-event/players.json`
- `event-packages/sample-event/sponsors.json`
- `event-packages/sample-event/matches.json`
- `event-packages/sample-event/rulesets/generic-standard.json`
- `event-packages/sample-event/rulesets/lol-standard.json`
- `event-packages/sample-event/rulesets/aov-standard.json`
- `event-packages/sample-event/rulesets/hok-standard.json`
- `event-packages/sample-event/themes/default-theme.json`
- `event-packages/sample-event/README.md`
- `event-packages/sample-event/assets/team-logos/blue-meteors.svg`
- `event-packages/sample-event/assets/team-logos/red-titans.svg`
- `event-packages/sample-event/assets/sponsor-logos/local-lan-studios.svg`
- `event-packages/sample-event/assets/backgrounds/default-background.svg`
- `event-packages/sample-event/assets/frames/draft-frame.svg`
- `event-packages/sample-event/assets/frames/sponsor-frame.svg`
- `event-packages/sample-event/assets/fallbacks/team-logo.svg`
- `event-packages/sample-event/assets/fallbacks/player-photo.svg`
- `event-packages/sample-event/assets/fallbacks/hero-icon.svg`
- `event-packages/sample-event/assets/hero-icons/.gitkeep`
- `event-packages/sample-event/assets/player-photos/.gitkeep`
- `event-packages/sample-event/logs/.gitkeep`
- `tests/sample-event/package.json`
- `tests/sample-event/tsconfig.json`
- `tests/sample-event/src/index.ts`
- `tests/sample-event/src/sample-event.test.js`
- `WORKING_HANDOFF_AFTER_SAMPLE_EVENT_PACKAGE.md`

Commands run:
- command: Read required source documents (`AGENTS.md`, `docs/TASK_QUEUE.md`, `docs/ACCEPTANCE_CRITERIA.md`, `docs/EVENT_PACKAGE_SPEC.md`, `docs/BAN_PICK_RULES.md`, `Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md`, `IMPLEMENTATION_PROMPT_FOR_CODEX.md`, `WORKING_HANDOFF_AFTER_AOV_HOK_SAMPLE_ADAPTERS.md`); result: succeeded.
- command: Repository inspection (`Get-ChildItem`, `rg --files`, `git status --short`, package/workspace reads, shared type/core/adapter/theme source reads); result: succeeded.
- command: `pnpm.cmd install`; result: failed once in sandbox with Corepack EPERM, then passed with approved escalation.
- command: `pnpm.cmd --filter @mmbt/sample-event-tests test`; result: failed once due an overly broad asset-path assertion, then passed after the test was corrected.
- command: `pnpm.cmd --filter @mmbt/sample-event-tests lint`; result: passed.
- command: `pnpm.cmd --filter @mmbt/sample-event-tests typecheck`; result: passed.
- command: `pnpm.cmd --filter @mmbt/sample-event-tests build`; result: passed.
- command: `pnpm.cmd lint`; result: passed.
- command: `pnpm.cmd typecheck`; result: passed.
- command: `pnpm.cmd test`; result: passed.
- command: `pnpm.cmd build`; result: passed.
- command: `pnpm.cmd verify`; result: passed.
- command: `rg "https://|http://|autoPick|autoBan|LCU|DataDragon|Data Dragon|Riot API|Garena API|Tencent API|TiMi API|WebSocket|Socket.IO|OBS WebSocket|vMix|Prisma|SQLite|login|cloud" event-packages packages games`; result: matched only standard SVG namespace strings (`http://www.w3.org/2000/svg`) in local placeholder SVG assets.
- command: `rg "https://|http://|autoPick|autoBan|LCU|DataDragon|Data Dragon|Riot API|Garena API|Tencent API|TiMi API|WebSocket|Socket.IO|OBS WebSocket|vMix|Prisma|SQLite|login|cloud" event-packages packages games --glob "!**/*.svg"`; result: no matches.
- command: requested `git ls-files -- "<path>/dist"` checks for `event-packages/sample-event`, `games/aov`, `games/hok`, `games/lol`, `packages/game-adapters`, `games/generic-moba`, `packages/theme-engine`, `packages/core-production`, `packages/core-draft`, `packages/core-match`, `packages/shared-types`; result: no tracked files.
- command: `git ls-files -- "node_modules"`; result: no tracked files.
- command: `git diff --check`; result: passed with Windows LF-to-CRLF warnings for `pnpm-lock.yaml` and `pnpm-workspace.yaml`.
- command: `git status --short` and `git diff --stat`; result: reviewed changed files.

Verification:
- Passed: sample event static validation tests, 6 tests.
- Passed: `pnpm.cmd --filter @mmbt/sample-event-tests lint`.
- Passed: `pnpm.cmd --filter @mmbt/sample-event-tests typecheck`.
- Passed: `pnpm.cmd --filter @mmbt/sample-event-tests build`.
- Passed: `pnpm.cmd lint`.
- Passed: `pnpm.cmd typecheck`.
- Passed: `pnpm.cmd test`.
- Passed: `pnpm.cmd build`.
- Passed: `pnpm.cmd verify`.
- Passed: requested tracked-output checks found no tracked `node_modules` or requested `dist` outputs.
- Failed: none remaining.
- Not run / unavailable: manual server loading and UI/overlay rehearsal are not applicable to TQ-060 and are blocked on later runtime/UI tasks.

Manual rehearsal:
- Required: no
- Result: Not applicable

Scope guardrails checked:
- Event package remains local-first and portable.
- Universal Ban/Pick remains game-agnostic.
- Game adapters remain static/manual/sample-only.
- LoL In-game HUD remains future plugin.
- Production Control remains above Universal Draft and game-specific plugins.
- v0.1 remains local-first, manual-first, production-safe.
- Overlay routes remain read-only.
- No official game API / client / live sync integration added.
- No player-side automation.
- No auto-pick.
- No auto-ban.
- No hidden competitive information exposure.
- No internet/cloud/OBS WebSocket/vMix API requirement added.
- No node_modules or dist build outputs tracked.

Notes / risks:
- The sample event includes local SVG placeholders only; the broad static URL search matches SVG namespace declarations, not external asset dependencies.
- The event package rule filenames follow `docs/EVENT_PACKAGE_SPEC.md` (`generic-standard.json`, `lol-standard.json`, `aov-standard.json`, `hok-standard.json`) while the rule IDs match the current adapter rule IDs. Future validation may warn if it expects filename and ID equality, but this preserves adapter linkage.
- `matches.json` includes `rulesetId`, `themeId`, `sponsorSlotIds`, and nested `games` as package metadata ahead of server loading; current core-match validators tolerate these unknown fields.
- No `production-log.jsonl` was created because runtime audit writing belongs to later server tasks.

Suggested next task:
- TQ-061 - Add or expand sample event validation tests through core draft/theme validation and future server package-loading expectations.
