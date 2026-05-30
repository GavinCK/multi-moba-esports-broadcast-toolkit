Summary:
- Completed TQ-011: added baseline TypeScript, lint, test, and build tooling for the existing pnpm workspace skeleton.
- Added real root verification flow for `dev`, `build`, `test`, `lint`, `typecheck`, and `verify`.
- Added root ESLint flat config and workspace package lint scripts.
- Added Vitest as the baseline test runner and one minimal skeleton-export test per workspace package.
- Updated package TypeScript configs to exclude `*.test.ts` files from build output while preserving `src/**/*.ts` compilation.
- Updated README status from TQ-010 skeleton to TQ-011 baseline tooling.
- Did not implement feature logic, server runtime, REST APIs, Socket.IO, dashboard UI, overlay routes, draft engine behavior, or game adapters.

Files changed:
- package.json: added ESLint, TypeScript ESLint, and Vitest dev dependencies while preserving standard root scripts.
- pnpm-lock.yaml: updated by `pnpm.cmd install` for the new dev dependencies.
- .gitignore: added baseline ignores for node_modules, dist, coverage, and TypeScript build info.
- eslint.config.js: added minimal TypeScript ESLint flat config.
- README.md: updated current status and verification command notes for TQ-011.
- apps/server/package.json, apps/admin-dashboard/package.json, apps/overlay/package.json: replaced placeholder lint/test scripts with ESLint and Vitest scripts.
- apps/server/tsconfig.json, apps/admin-dashboard/tsconfig.json, apps/overlay/tsconfig.json: added test/dist/node_modules excludes.
- apps/server/src/index.test.ts, apps/admin-dashboard/src/index.test.ts, apps/overlay/src/index.test.ts: added minimal Vitest skeleton-export tests.
- packages/shared-types/package.json, packages/core-match/package.json, packages/core-draft/package.json, packages/core-production/package.json, packages/core-overlay/package.json, packages/theme-engine/package.json: replaced placeholder lint/test scripts with ESLint and Vitest scripts.
- packages/shared-types/tsconfig.json, packages/core-match/tsconfig.json, packages/core-draft/tsconfig.json, packages/core-production/tsconfig.json, packages/core-overlay/tsconfig.json, packages/theme-engine/tsconfig.json: added test/dist/node_modules excludes.
- packages/shared-types/src/index.test.ts, packages/core-match/src/index.test.ts, packages/core-draft/src/index.test.ts, packages/core-production/src/index.test.ts, packages/core-overlay/src/index.test.ts, packages/theme-engine/src/index.test.ts: added minimal Vitest skeleton-export tests.
- games/generic-moba/package.json, games/lol/package.json, games/aov/package.json, games/hok/package.json: replaced placeholder lint/test scripts with ESLint and Vitest scripts.
- games/generic-moba/tsconfig.json, games/lol/tsconfig.json, games/aov/tsconfig.json, games/hok/tsconfig.json: added test/dist/node_modules excludes.
- games/generic-moba/src/index.test.ts, games/lol/src/index.test.ts, games/aov/src/index.test.ts, games/hok/src/index.test.ts: added minimal Vitest skeleton-export tests.
- node_modules/.modules.yaml, node_modules/.pnpm/lock.yaml, and tracked workspace mirror files under node_modules/.pnpm/node_modules/@mmbt/*: updated by `pnpm.cmd install` because node_modules is currently tracked in this repository.
- WORKING_HANDOFF_AFTER_BASELINE_TOOLING.md: created this handoff.

Commands run:
- Get-Content -Raw -LiteralPath AGENTS.md: succeeded.
- Get-Content -Raw -LiteralPath Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md: succeeded.
- Get-Content -Raw -LiteralPath IMPLEMENTATION_PROMPT_FOR_CODEX.md: succeeded.
- Get-Content -Raw -LiteralPath docs\TASK_QUEUE.md: succeeded.
- Get-Content -Raw -LiteralPath docs\ACCEPTANCE_CRITERIA.md: succeeded.
- Get-Content -Raw -LiteralPath WORKING_HANDOFF_AFTER_MONOREPO_SKELETON.md: succeeded.
- Get-ChildItem / rg inspection commands: succeeded; inspected root, workspace files, package scripts, TypeScript configs, and existing tracked files.
- pnpm.cmd install: failed inside the sandbox with `EPERM: operation not permitted, opendir 'C:\Users\Gavin\AppData\Local\node\corepack\v1\pnpm'`.
- pnpm.cmd install with approved escalation: passed; installed baseline dev dependencies.
- pnpm.cmd lint: failed inside the sandbox with the same Corepack cache EPERM.
- pnpm.cmd lint with approved escalation: passed.
- pnpm.cmd typecheck with approved escalation: passed.
- pnpm.cmd test with approved escalation: passed; 13 workspace packages each ran 1 Vitest baseline test.
- pnpm.cmd build with approved escalation: passed.
- pnpm.cmd verify with approved escalation: passed; ran lint, typecheck, test, and build.
- PowerShell JSON manifest parse check: passed.
- Get-ChildItem -Recurse -Filter *.test.js under apps/packages/games: passed with no output; tests were not emitted to dist.
- rg "LCU|Data Dragon|DataDragon|OBSWebSocket|vMix API|Companion|StreamDeck|sqlite|prisma|auto-pick|auto-ban|player-side automation" apps packages games event-packages tests package.json pnpm-workspace.yaml tsconfig.base.json eslint.config.js: passed with no matches.

Verification:
- Passed: `pnpm.cmd install` after approved escalation.
- Passed: `pnpm.cmd lint` after approved escalation.
- Passed: `pnpm.cmd typecheck` after approved escalation.
- Passed: `pnpm.cmd test` after approved escalation.
- Passed: `pnpm.cmd build` after approved escalation.
- Passed: `pnpm.cmd verify` after approved escalation.
- Passed: JSON manifests parse successfully.
- Passed: package builds exclude `*.test.ts` files from emitted JavaScript.
- Failed: initial non-escalated `pnpm.cmd install` and `pnpm.cmd lint` attempts failed because Corepack/pnpm cache access is outside the workspace sandbox.
- Not run / unavailable: none of the requested verification commands remained unavailable after approved escalation.

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
- This remains tooling/baseline setup only. Feature packages still export placeholder skeleton markers.
- `dev` scripts still intentionally report placeholder status because server, dashboard, and overlay runtimes are not implemented in TQ-011.
- `pnpm.cmd install` required approved escalation because Corepack stores pnpm data under `C:\Users\Gavin\AppData\Local\node\corepack\v1\pnpm`, outside the writable workspace.
- The repository currently tracks `node_modules`, so installing dependencies updated tracked node_modules metadata and workspace mirror files. The new `.gitignore` prevents future untracked generated dependency/build files from appearing, but it does not untrack files that are already tracked.
- No Prettier config was added because ESLint was sufficient for stable baseline verification and formatting enforcement is not yet required by this task.

Suggested next task:
- TQ-020 - Implement Shared Types Package.
