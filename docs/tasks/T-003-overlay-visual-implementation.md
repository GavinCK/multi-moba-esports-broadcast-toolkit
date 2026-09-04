# T-003: Draft overlay visual implementation (approved design)

Status: IMPLEMENTATION PRESERVED 2026-09-04 — automated checks green; visual/user acceptance pending · Owner: Codex · Reviewer: planner + user

## Why

The overlay's current visuals never passed acceptance. The design is now approved and locked in `docs/design/LOL_DRAFT_OVERLAY_APPROVED_DESIGN_SPEC.md` (ADR-005 pipeline). This task implements that spec exactly — implementation, not design.

## Binding inputs

1. `docs/design/LOL_DRAFT_OVERLAY_APPROVED_DESIGN_SPEC.md` — every number, color, and state.
2. ADR-003 (timer per turn, shared double-pick window — do NOT change timer logic).
3. Existing view model (`selectDraftOverlayViewModel`) and presentation view model — extend mapping only where the spec requires (e.g., hover exposure, skipped state, role icon path); do not change server contracts.

## Codex prompt (copy verbatim)

```text
TASK: T-003 — Implement approved LoL draft overlay design

READ FIRST
- AGENTS.md; CLAUDE.md (guardrails)
- docs/design/LOL_DRAFT_OVERLAY_APPROVED_DESIGN_SPEC.md — BINDING: implement it exactly; if code reality conflicts with the spec, stop and flag instead of improvising
- docs/decisions/ADR-003 and ADR-005
- apps/overlay/src/overlays/DraftOverlay.tsx, apps/overlay/src/styles.css, apps/overlay/src/state/presentationViewModel.ts

GOAL
The /overlay/draft route renders the approved LCK-inspired broadcast design: transparent canvas, bottom rail with 10 slots (mirrored role order), flank ban strips with single-line strikes, center match block with team logos and per-side scores, center-shrinking timer bar — for every state in the spec's state matrix.

SCOPE — IN
1. Rebuild DraftOverlay presentation (JSX structure + CSS) to the spec geometry/tokens/typography, 1920×1080 fixed, fully transparent page background.
2. State rendering per spec matrix: ban empty/active/done/skipped; pick empty/hover/picked; confirmed lineup; timer hidden when stopped.
3. Asset binding with mandatory fallbacks: role icon SVGs from event package path (fallback: inline glyphs matching the spec's workbench geometry); champion splash from hero-splashes path (fallback: side gradient + centered 64px square icon); team logo from logoAssetPath (fallback: neutral crest outline).
4. Remove every text label banned by the spec (no PENDING/phase/slot-number strings anywhere on the route).
5. Update overlay tests to the new DOM while preserving all guardrail assertions (read-only, no debug leakage on normal route).

SCOPE — OUT (do not do any of these)
- No changes to packages/core-draft, server code, socket contracts, or timer logic (ADR-003).
- No new data fetching; use existing socket/state pipeline and view models (extend selectors/mapping only, additively).
- No mutation capability of any kind on overlay routes.
- No runtime network/CDN access; assets resolve from local event-package paths only, and every asset class has a working fallback.
- No animation framework dependencies; CSS transitions only, keep them subtle (≤200ms fades).
- Do not touch other overlay routes (Program/Preview/Emergency/ScoreBug).
- Do not run git add/commit/push.

FILES EXPECTED TO CHANGE
- apps/overlay/src/overlays/DraftOverlay.tsx (+ its test)
- apps/overlay/src/styles.css
- apps/overlay/src/state/presentationViewModel.ts (additive mapping only, + test) — only if needed
- apps/overlay/src/App.test.tsx if selectors changed

ACCEPTANCE CRITERIA
1. Side-by-side with the Figma frames (F1 ban phase / F2 pick+hover / F3 complete), a screenshot of the running overlay at the same draft states matches geometry, colors, and typography per spec.
2. Draft with zero splash/role-icon/logo assets present renders cleanly on fallbacks (no broken images, no layout shift).
3. Full draft run-through: bans (including a skipped ban if T-002 landed), double-pick turns (single shared timer bar per turn), hover display, final lineup confirm (timer disappears) — all correct against the state matrix.
4. Page background fully transparent; no scrollbars at 1920×1080; no debug text on the normal route; ?debug=1 behavior unchanged.
5. pnpm lint, pnpm typecheck, pnpm test all pass.

TESTING
- Unit tests for state mapping (ban states incl. SKIPPED, hover, picked fallback selection, timer width calculation per turn).
- Existing guardrail tests must still pass unchanged in intent.

REPORT FORMAT (produce this at the end, then STOP)
1. Summary. 2. File-by-file change list with line counts. 3. Test output summary. 4. Spec conflicts found (if any). 5. Open questions.
Do not start follow-up work after the report.
```

## Review checklist (planner fills after Codex run)

- ☑ Diff limited to overlay app (DraftOverlay implementation/tests/CSS plus ProgramOverlay integration test)
- ☑ No server/core changes
- ☑ Banned on-air strings absent from the normal rendered route (component assertions); debug-only phase data remains allowed
- ☑ Missing splash/role/logo fallback markup covered by component tests
- ☐ Browser asset routing verified (`apps/overlay/vite.config.ts` does not currently proxy `/assets`; see root `HANDOFF.md`)
- ☐ Transparent background + no scrollbars verified in a real 1920×1080 browser/OBS surface
- ☐ Exact spec differences resolved (separator, first-pick glyphs, and player/side ordering called out in root `HANDOFF.md`)
- ☐ User visual check vs Figma F1/F2/F3 frames
- ☑ Build-first `pnpm verify` passes (lint, typecheck, 320 tests, build; 2026-09-04)
