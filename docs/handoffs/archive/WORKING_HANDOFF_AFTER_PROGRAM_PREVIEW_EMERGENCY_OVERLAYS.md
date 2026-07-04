Summary:
- Implemented TQ-093 Program, Preview, and Emergency overlay rendering inside `apps/overlay`.
- `/overlay/program` now renders the current Program payload, supports existing `DRAFT_OVERLAY`, `SCORE_BUG`, and `EMERGENCY` graphic types, and honors active emergency override.
- `/overlay/preview` now renders the current Preview payload independently from Program and stays standby when Preview is empty.
- `/overlay/emergency` now renders a full-screen active emergency graphic, safe inactive/loading standby, and built-in fallback styling without requiring match, draft, team, sponsor, theme, or asset data.
- Added public-safe diagnostics for `?debug=1`, safe unsupported/missing-payload handling, and stronger overlay read-only guardrail tests.

Files changed:
- `README.md`
- `apps/overlay/src/App.test.tsx`
- `apps/overlay/src/guardrails.test.ts`
- `apps/overlay/src/routes/OverlayRouteView.tsx`
- `apps/overlay/src/styles.css`
- `apps/overlay/src/overlays/ProductionGraphicRenderer.tsx`
- `apps/overlay/src/overlays/ProgramOverlay.tsx`
- `apps/overlay/src/overlays/ProgramOverlay.test.tsx`
- `apps/overlay/src/overlays/PreviewOverlay.tsx`
- `apps/overlay/src/overlays/PreviewOverlay.test.tsx`
- `apps/overlay/src/overlays/EmergencyOverlay.tsx`
- `apps/overlay/src/overlays/EmergencyOverlay.test.tsx`
- `WORKING_HANDOFF_AFTER_PROGRAM_PREVIEW_EMERGENCY_OVERLAYS.md`

Commands run:
- `git status --short`: clean before edits; final status contains only intended TQ-093 changes.
- `git branch --show-current`: `main`.
- `git log --oneline -5`: inspected latest commits before editing.
- `pnpm.cmd install --frozen-lockfile`: first sandbox attempt failed with Corepack `EPERM`; escalated rerun passed. Final rerun passed with existing Node `url.parse()` deprecation warning.
- `pnpm.cmd verify`: passed before implementation and passed again after final edits.
- `pnpm.cmd --filter @mmbt/overlay lint`: passed before and after implementation.
- `pnpm.cmd --filter @mmbt/overlay typecheck`: passed before and after implementation.
- `pnpm.cmd --filter @mmbt/overlay test`: passed before implementation; during implementation failed on stale fixture/debug-label expectations and then a local fixture typo; final reruns passed with 9 files / 53 tests.
- `pnpm.cmd --filter @mmbt/overlay build`: passed before and after implementation.
- `pnpm.cmd lint`: passed.
- `pnpm.cmd typecheck`: passed.
- `pnpm.cmd test`: passed.
- `pnpm.cmd build`: passed.
- `rg` overlay mutation REST scan: first quote-sensitive PowerShell form failed to parse; split equivalent scans passed with only guardrail-test matches.
- `rg` overlay socket mutation scan: reviewed matches; only negative tests, guardrail strings, existing read-only `client:hello` / `state:request-full` emits, and server-to-client listener constants.
- `rg` overlay controls scan: reviewed matches; only negative tests plus existing draft overlay status labels, not controls.
- `rg` future-scope scan: reviewed matches; only negative/guardrail tests and existing adapter tests that assert forbidden APIs are absent.
- `git ls-files -- "node_modules" "apps/*/node_modules" "packages/*/node_modules" "games/*/node_modules" "apps/*/dist" "packages/*/dist" "games/*/dist" ".turbo" ".vite" "coverage"`: no tracked generated artifacts.
- `Get-ChildItem -Force event-packages\sample-event\logs`: only `.gitkeep`; no audit log created by this task.
- `git diff --check`: passed.
- Local dev server smoke: server and overlay dev servers started, then stopped; route HTTP checks returned `200` and root HTML for `/overlay/program`, `/overlay/program?debug=1`, `/overlay/preview`, `/overlay/preview?debug=1`, `/overlay/emergency`, and `/overlay/emergency?debug=1`.

Verification:
- Passed: overlay lint, overlay typecheck, overlay tests, overlay build.
- Passed: root lint, root typecheck, root test, root build, root verify.
- Passed: frozen install after implementation.
- Passed: explicit guardrail scans after reviewing acceptable matches.
- Passed: repository hygiene checks for whitespace, generated artifacts, and sample-event logs.
- Failed first, then passed or worked around: Corepack sandbox access, implementation-phase overlay tests, PowerShell quote-sensitive scan command, first dev-server start attempt with duplicate stdout/stderr redirection.
- Not run / unavailable: visual in-app Browser inspection. The Browser `node_repl` runtime failed twice with a Windows sandbox startup issue, so only automated render tests plus HTTP smoke were used for route smoke.

Manual rehearsal:
- Required: no full OBS/vMix or live rehearsal was required by TQ-093.
- Result: not performed. A non-mutating local HTTP smoke was performed for all three routes and debug variants. No Producer Panel workflow, Take/Clear/Emergency mutation rehearsal, OBS/vMix rehearsal, or full live rehearsal was claimed.

Scope guardrails checked:
- `/overlay/program` is read-only.
- `/overlay/preview` is read-only.
- `/overlay/emergency` is read-only.
- No mutation REST endpoints are called from `apps/overlay`.
- No mutation Socket.IO events are emitted from `apps/overlay`; overlay emits remain limited to read-only `client:hello` and `state:request-full`.
- No draft controls were added.
- No production controls were added.
- No Take, Clear Program, Trigger Emergency, or Clear Emergency controls were added.
- No OBS WebSocket, vMix, Companion, Stream Deck, database, SQLite, Prisma, cloud sync, auth/login, official game API, Riot/LCU/Data Dragon, Garena/Tencent/TiMi, player automation, auto-pick, auto-ban, LoL in-game HUD, objective tracker, sponsor automation, ad serving, analytics beacon, or remote sponsor inventory features were added.
- This is TQ-093 only; it does not implement TQ-100 audit hardening, TQ-101 health hardening, TQ-120 guardrail expansion, or TQ-130 rehearsal docs.

Notes / risks:
- Emergency on-air messages are normalized through a public-safe fallback so raw private emergency reason text is not rendered.
- Program/Preview unsupported graphic types render safe standby in normal mode and only public-safe diagnostics in debug mode.
- Direct `/overlay/draft/:matchId` and `/overlay/scorebug/:matchId` behavior remains unchanged by emergency override, as required.
- The optional visual browser inspection could not be completed because the in-app Browser runtime failed in this Windows sandbox; automated static render tests cover the expected visible states.
- The final working tree was not committed or pushed.

Suggested next task:
- TQ-100 - Harden Audit Logging and Surface Log Failures in Health
