# LoL Draft Overlay Design Research

## Status Note

This research document is now an implementation reference for LoL draft overlay UX. It should guide broadcast hierarchy, slot layout, fallback behavior, and visual QA expectations, not sit as background reading only.

It does not authorize copying third-party code, assets, branding, exact layouts, sponsor treatments, screenshots, or trade dress.

## 1. Purpose

This document is a research and design brief for redesigning the League of Legends draft overlay in the Multi-MOBA Esports Broadcast Toolkit v0.1.

The goal is to make the LoL draft overlay feel suitable for a live OBS/vMix program feed while preserving the project constraints:

- Local-first runtime.
- Manual-first operation.
- Read-only overlay routes.
- No player-side automation.
- No runtime dependency on Riot API, LCU, Data Dragon, cloud services, OBS WebSocket, vMix API, database, or login.
- Universal draft logic remains game-agnostic.
- LoL-specific presentation belongs in the overlay/presentation layer, theme, adapter data, or sample package, not in `packages/core-draft`.

This is not an implementation document and does not modify application code.

## 2. Current Problems Observed

Manual browser inspection and light source review indicate the current LoL draft overlay is technically functional but not production-suitable.

- The visual hierarchy resembles an engineering/debug panel more than a mainstream LoL broadcast graphic.
- The route uses large opaque panels across the screen, which limits alpha-friendly compositing over player cameras, game feed, or production backgrounds.
- Pick cards and ban rows are serviceable but do not yet resemble modern LoL champion select broadcast treatment.
- Normal output includes labels such as "Draft Status", "Active Side", and standby text that feel operator-facing rather than program-facing.
- Champion visual URLs in the LoL sample adapter point to local sample paths such as `assets/lol-sample/champion-icons/...`, but matching assets were not found in the sample event package during this research pass.
- Missing champion art must never produce broken browser image icons on air.
- The existing local fallback asset `event-packages/sample-event/assets/fallbacks/hero-icon.svg` is available, but the final design should make fallback cards look intentional rather than damaged.
- Debug diagnostics must remain available through `?debug=1`, but the normal route should contain no debug or internal-state text.

## 3. Reference Sources Reviewed

| Source | URL | What was learned | Status / licensing note |
|---|---|---|---|
| RCVolus `lol-pick-ban-ui` | https://github.com/RCVolus/lol-pick-ban-ui | Web-based champion select UI built for esports tournaments. It includes a Europe/LEC-like template, team/color configuration, replay data for design testing, and custom HTML/CSS/JS layout support. It also shows common expectations: team identity, picks, bans, timer, and configurable broadcast styling. | Open source, MIT. Reference only. Do not copy code or design. It relies on LCU and Data Dragon behavior that is out of scope for v0.1. It also uses Riot-owned assets under Riot's community legal policy, which must not be copied into this repo without approval. |
| RCVolus `league-prod-toolkit` | https://github.com/RCVolus/league-prod-toolkit | Larger LoL production toolkit with champion select, in-game events, and OBS/vMix browser-source integration. Its docs describe a dedicated server with observer/client data feeding overlays and note browser-source cache behavior. | Open source, MIT. Reference only. Do not adopt the architecture as the toolkit foundation because it is LoL-first and uses future-scope data integrations. |
| Prod Toolkit wiki: Using Prod Toolkit | https://github-wiki-see.page/m/RCVolus/league-prod-toolkit/wiki/2.-Using-Prod-Toolkit | The champselect module is described as transparent until champion select starts and similar to the LEC-style pick/ban UI. It notes OBS cache refresh issues and separates overlay display from other team-name overlays. | Reference only. Do not copy code or assets. Useful for browser-source failure expectations. |
| floh22 `LeagueBroadcast` | https://github.com/floh22/LeagueBroadcast | Shows OBS browser-source URL patterns for Pick/Ban and in-game scenes, component enable/disable behavior, and the risks of Data Dragon cache, live game install paths, memory offsets, and patch-day fragility. | Open source, MIT. Reference only. Its runtime dependencies and memory-reading approach are not allowed in v0.1. |
| Sky-CSC `OSL` | https://github.com/Sky-CSC/OSL | Provides multiple champselect browser-source views and documents OBS URL usage. Its roadmap explicitly mentions improving team logo display and fixing square/splash art display, reinforcing that asset handling is a common broadcast reliability issue. | Open source, MIT. Reference only. LoL client/API/CDragon behavior and Riot assets remain out of scope for v0.1. |
| OblivionDraft | https://github.com/OblivionEsport/OblivionDraft | A small LoL picks/bans overlay with admin screen, editable HTML/CSS/JS overlay, and OBS web URL usage. It shows the value of simple local web routes for draft graphics. | Public GitHub project. License was not confirmed from the reviewed page. Reference only. Do not copy code, layout, or assets. |
| BlueBottle LeagueBroadcast site | https://bluebottle.gg/ | Public commercial examples show pre-game champion select overlays, style editing, and custom broadcast graphics for LoL. It reinforces that modern tools treat champion select as a broadcast graphic, not an operator panel. | Commercial/reference-only. Do not copy screenshots, UI, code, or proprietary concepts beyond general layout observations. |
| BlueBottle LeagueBroadcast pricing page | https://bluebottle.gg/leaguebroadcast-pricing/ | Lists pre-game Champion Select, Bottom Row, Fearless Ban left/right, team/player database, and customizable overlay features. This supports a bottom-anchored draft rail as a recognizable modern pattern. | Commercial/reference-only. Do not copy assets or exact layouts. |
| LHM.gg League of Legends integration guide | https://guide.lhm.gg/docs/lhm-basics/league-of-legends-integration/ | Lists draft overlay features expected in a LoL HUD package: team bars, picks, bans, score, best-of info, timer, pick/ban indicators, player avatars, and position icons. | Commercial/reference documentation. Do not copy assets or exact UI. Use only as a feature checklist reference. |
| RiftBroadcast public site | https://riftbroadcast.de/ | Public copy describes professional LoL broadcast tools and a classic horizontal champion select layout with picks, bans, and timers. | Reference-only. Licensing unclear from reviewed page. Do not copy visuals, assets, or implementation. |
| uDrafter | https://www.udrafter.eu/ | A LoL draft simulator with blue/red team naming, picks, bans, correction phase, role assignment, and draft result views. It is useful for understanding draft state clarity, not broadcast compositing. | Public website/reference-only. Do not copy UI or assets. |
| Leaguepedia Champ Select article | https://lol.fandom.com/wiki/New_To_League/Gameplay/Champ_Select | Confirms standard pro draft structure: blue/red sides, first and second ban sets, five picks per team, hover versus lock terminology, and the usual pick order. | Reference information. Content license is CC BY-SA unless otherwise noted by the site. Use for draft-order understanding only. |
| OBS Browser Source documentation | https://obsproject.com/kb/browser-source | OBS browser sources use URL/local file input, explicit width/height, transparent default CSS, hidden overflow, optional refresh/cache controls, and Chromium Embedded Framework. | Official OBS documentation. Safe to use as technical requirement reference. |
| vMix Web Browser documentation | https://www.vmix.com/help28/WebBrowser.html | vMix browser inputs support width/height configuration, custom CSS, transparent backgrounds/alpha channel, and Chromium Embedded Framework. | Official vMix documentation. Safe to use as technical requirement reference. |
| Behance LoL pick/ban overlays 1920x1080 | https://www.behance.net/gallery/104490793/LoL-pickban-overlays-%281920x1080%29 | Public visual reference for 1920x1080 LoL pick/ban composition and the importance of broadcast-scale framing. | Reference-only. License unclear for reuse. Do not copy artwork, layout, colors, or assets. |

## 4. Common LoL Draft Overlay Layout Patterns

Modern LoL draft overlays generally share these patterns:

- Blue side is visually on the left; red side is visually on the right.
- Each side has five pick slots with champion portraits/cards large enough to read at program resolution.
- Bans are smaller than picks and usually appear as compact square icons, often desaturated, dimmed, or marked with a slash/ban treatment.
- The timer and phase state sit near the center, so both teams read as competing around a shared draft clock.
- Active side is indicated with a strong blue/red accent, glow, underline, or animated border.
- Hovered champions are visually distinct from locked champions. A hover should feel provisional; a lock should feel final.
- Team identity is persistent: short name, logo, side color, and sometimes series score.
- Event or sponsor branding is present but subordinate to draft readability.
- The graphic is designed as an overlay layer, not a full admin screen. Transparent regions allow cameras, stage shots, or production backgrounds to remain visible.
- The normal output avoids internal IDs, connection state, JSON status, action IDs, or implementation labels.
- Debug diagnostics, when present, are small, public-safe, and hidden behind a debug query parameter.

Two common composition families appeared in references:

1. Bottom-row / lower-third champion select rail:
   - Picks, bans, team names, timer, and sponsor fit into a wide bottom graphic.
   - The upper two-thirds of the frame remains available for cameras, stage, gameplay, or a production background.
   - This is the best fit for v0.1 because it is alpha-friendly and does not require a full scene redesign.

2. Side-pillar champion select:
   - Blue picks/bans stack down the left, red picks/bans stack down the right, with timer/status near top or center.
   - This resembles older or game-client-like champion select presentations.
   - It can work well over a center stage/camera background, but it risks blocking player camera columns and is less flexible for mixed OBS/vMix scenes.

For v0.1, prefer the bottom-row rail as the primary implementation target, with a future theme variant allowed for side pillars.

## 5. OBS/vMix Browser Source Requirements

The redesigned overlay should satisfy these browser-source requirements:

- Default canvas is 1920x1080.
- `html`, `body`, `#root`, and the overlay canvas remain transparent outside the graphic.
- No page scrollbars at 1920x1080.
- No reliance on OBS/vMix custom CSS to make the page usable.
- Browser-source width/height should be documented as 1920x1080.
- All assets load from local event package paths, local game adapter assets, or bundled overlay fallback assets.
- No remote images, remote fonts, remote JavaScript, remote CSS, CDN URLs, analytics, or external API calls are required at runtime.
- Missing or failed images fall back locally without changing slot dimensions.
- The route is read-only and must not render mutation controls or emit mutation socket events.
- Socket.IO reconnect should restore the latest public state.
- Standard route should show clean program graphics only.
- `?debug=1` may show route, match ID, socket status, last state timestamp, missing asset warnings, and safe state diagnostics.
- Debug mode must not reveal private notes, credentials, hidden competitive information, absolute filesystem paths, stack traces, or operator-only controls.
- Text and cards must fit within stable boxes at 1920x1080 and should remain acceptable at 1280x720 preview scale.

## 6. Recommended v0.1 LoL Draft Overlay Layout

Use a transparent 1920x1080 overlay with a bottom-anchored "LoL broadcast draft rail".

Primary design:

- Keep approximately the top 65 percent of the canvas transparent.
- Place all required draft information in the lower 300 to 340 pixels.
- Use blue side on the left and red side on the right.
- Use five large pick cards per team in a horizontal row.
- Use five compact ban icons per team in a row below or above the pick cards.
- Put timer, phase label, active side, and sponsor/event branding in the center column.
- Use team short names, team logos, side colors, and series score if available.
- Use local fallback visuals for every missing champion, team, and sponsor asset.
- Use a restrained, high-contrast palette with neutral dark translucent panels, blue/red side accents, and one accent color for active state.
- Avoid a single-color theme. Blue and red side identity should be clear, but neutral blacks/greys and sponsor/event colors should balance the graphic.
- Avoid decorative full-screen backgrounds in this route. The composited scene should provide the background.
- Keep animation minimal: active slot pulse or border transition only. No animation should obscure readability.

Recommended normal-route copy:

- Phase: "Ban Phase 1", "Pick Phase 1", "Ban Phase 2", "Pick Phase 2", or ruleset label.
- Active side: "Blue Ban", "Red Pick", or similar.
- Status when complete: "Draft Complete".
- Empty slots: no engineering text; use clean placeholders such as "P1", "B1", or a subtle empty frame.

Avoid normal-route copy such as:

- "Draft Status"
- "Active Side: NONE"
- "CurrentPhaseIndex"
- "Missing draft linkage"
- action IDs
- route names
- socket status

## 7. 1920x1080 Wireframe Description

Canvas:

```text
1920 x 1080 transparent browser source
safe margin: 48 to 64 px
top area: mostly transparent for cameras/game/stage/background
main draft rail: bottom anchored, approximately y=704 to y=1016
```

Coordinate-oriented wireframe:

```text
x=0                                                            x=1920
y=0   --------------------------------------------------------------
      |                                                            |
      |         transparent scene area for cameras/game/feed        |
      |                                                            |
      |          optional small event bug, if theme requires        |
      |                                                            |
y=704 |  BLUE TEAM BAR      |   TIMER / PHASE   |      RED TEAM BAR |
      |  5 BLUE PICK CARDS  |   ACTIVE SIDE     |  5 RED PICK CARDS |
      |  5 BLUE BAN ICONS   |   SPONSOR SLOT    |  5 RED BAN ICONS  |
y=1016 --------------------------------------------------------------
      bottom safe margin
```

Suggested dimensions:

- Main rail: x=64, y=704, width=1792, height=312.
- Blue zone: x=64, width about 626.
- Center zone: x=742, width about 436.
- Red zone: x=1230, width about 626.
- Team bars: height 56 to 64.
- Pick cards: five per side, about 118 to 124 px wide and 168 to 184 px tall, with 8 to 10 px gaps.
- Ban icons: five per side, about 48 to 56 px square.
- Timer block: about 180 to 240 px wide inside the center zone, with number text around 56 to 72 px high.
- Sponsor/event slot: center column, about 220 to 320 px wide and 32 to 44 px high.

Slot ordering:

- Blue pick cards read left to right as blue pick slots 1 to 5.
- Red pick cards should visually mirror the blue side while keeping text horizontal and readable. If reversed order is used for symmetry, each card must include a small slot label so viewers can still understand draft order.
- Ban rows should preserve visible order and include phase distinction through small labels or spacing where possible.

## 8. Champion Visual Strategy

The redesign must make missing champion artwork look intentional.

Asset priority:

1. Use a locally served event package override if present.
2. Use local game adapter assets if present.
3. Use bundled overlay fallback assets.
4. Use a CSS fallback card generated from public hero/champion metadata.

Rules:

- Do not load champion art from the internet at runtime.
- Do not run Data Dragon sync in v0.1.
- Do not require Riot API, LCU, or game client access.
- Do not copy official Riot assets into the repo unless separately approved.
- Do not show broken browser image icons.
- Image failures must preserve card dimensions.
- Fallbacks must work in OBS/vMix and in ordinary browser rehearsal.

Preferred pick card visual:

- If art exists: use a locally served splash or square image cropped with `object-fit: cover`.
- If art is missing: show a dark translucent card with side accent, champion display name, two-letter initials, role tags when available, and a subtle generic hero mark.
- Locked state: full-opacity card with clear champion name.
- Hover state: same card size, highlighted accent border, "Hover" or provisional treatment that is visually different from locked.
- Pending state: empty slot frame with slot label such as "P1".

Preferred ban icon visual:

- If art exists: use square icon, desaturated/dimmed, with small ban slash treatment.
- If art is missing: use local fallback icon or initials with a ban slash.
- Locked ban should be clearly final.
- Pending ban should be subtle and not look like a selected champion.

The existing `event-packages/sample-event/assets/fallbacks/hero-icon.svg` can be used as a base fallback, but the card should also include text so viewers can identify the selection even without art.

## 9. State / Realtime Update Requirements

The redesigned overlay must remain a pure renderer of public state.

Required behavior:

- Resolve match, current game, draft, ruleset, teams, sponsor, and theme from public runtime state.
- Derive blue/red picks and bans from `DraftState.actions` or the existing overlay summary actions.
- Do not require duplicated `bluePicks`, `redPicks`, `blueBans`, or `redBans` arrays in core state.
- Render `PENDING`, `HOVER`, `LOCKED`, `SKIPPED`, and `CANCELLED` distinctly where public-safe.
- Do not present hover as a final lock.
- Use the server-provided timer state. The overlay must never auto-pick, auto-ban, or locally advance phase when time reaches zero.
- When disconnected, preserve the last known state and show stale/disconnected diagnostics only in debug mode.
- On refresh or reconnect, request/receive latest full state and render the current draft.
- Completed drafts should preserve final picks and bans and replace the active timer treatment with a final-state indicator.
- Missing match or draft should render transparent standby or a clean shell in normal mode, with detailed diagnostics only in debug mode.
- The route must not call mutation REST endpoints or emit mutation Socket.IO events.

## 10. Out-of-Scope Items

Do not include these in the visual redesign:

- LoL LCU reader.
- LoL champion select auto-sync.
- Runtime Data Dragon automatic sync.
- Runtime Riot API dependency.
- LoL in-game HUD.
- Live summoner spell, rune, objective, item, gold, XP, or player stat integration.
- Player-side software.
- Auto-pick.
- Auto-ban.
- OBS WebSocket integration.
- vMix API integration.
- Bitfocus Companion or Stream Deck integration.
- Cloud sync.
- Database persistence.
- User login system.
- Sponsor scheduling automation.
- AI draft analysis or match report generation.
- Copying third-party source code, screenshots, UI layouts, animations, or copyrighted graphic assets.

## 11. Implementation Plan for Next Codex Task

Recommended next task scope: visual overlay redesign only.

1. Re-check working tree cleanliness.
2. Read `AGENTS.md`, the technical spec, `IMPLEMENTATION_PROMPT_FOR_CODEX.md`, `docs/OVERLAY_SPEC.md`, `docs/BAN_PICK_RULES.md`, and this design brief.
3. Inspect `apps/overlay/src/overlays/DraftOverlay.tsx`, `apps/overlay/src/styles.css`, `apps/overlay/src/routes/selectors.ts`, and overlay tests.
4. Keep universal state and draft logic unchanged.
5. Add or improve a safe image/fallback path for hero, team, and sponsor visuals if current fallback handling can still show broken image icons.
6. Redesign the draft overlay presentation into the bottom-anchored 1920x1080 draft rail.
7. Preserve all required public state: teams, logos/fallbacks, five picks per team, five bans per team, timer, phase, active side, sponsor, hover/lock status, complete state, standby state, and debug mode.
8. Ensure normal route contains no diagnostics or operator controls.
9. Keep debug diagnostics behind `?debug=1` and public-safe.
10. Update or add focused overlay tests for slot rendering, missing assets, hover versus locked display, debug gating, and no mutation behavior.
11. Run relevant verification commands, likely `pnpm --filter @mmbt/overlay test`, `pnpm --filter @mmbt/overlay typecheck`, and root verification if practical.
12. Perform a browser/Playwright 1920x1080 visual check if available. Confirm no scrollbars, transparent background, readable slots, and no broken images.

## 12. Acceptance Criteria for the Visual Redesign

The LoL draft overlay visual redesign should be accepted only when:

- `/overlay/draft/:matchId` remains read-only.
- Normal route renders no mutation controls.
- Normal route renders no debug panel, route diagnostics, socket diagnostics, action IDs, or internal warnings.
- `?debug=1` renders public-safe diagnostics.
- Canvas is 1920x1080 browser-source compatible.
- Transparent background works outside the draft rail.
- No scrollbars appear at 1920x1080.
- Blue side is clearly left and red side is clearly right.
- Five pick slots per team are visible and readable.
- Five ban slots per team are visible and readable.
- Pick cards are large enough to identify champion name and status from a program monitor.
- Ban icons are compact but identifiable.
- Timer, phase label, and active side are central and readable.
- Hover and locked states are visually distinct.
- Pending slots look intentional.
- Missing champion art never produces broken image icons.
- Missing champion art still displays useful text fallback.
- Missing team/sponsor assets have stable local fallbacks.
- Overlay updates from Socket.IO state without local draft mutation.
- Refresh/reconnect restores latest state.
- Completed draft state preserves final picks and bans.
- No remote runtime asset or API dependency is introduced.
- No LoL-specific behavior is added to `packages/core-draft`.
- Visual tests or browser screenshots confirm the design at 1920x1080.

## 13. Risks and Licensing Notes

- Public broadcast screenshots, Behance projects, and commercial product pages are visual references only. Do not copy their exact layouts, frames, colors, animations, logos, or artwork.
- Open-source LoL tools can inform architecture and failure modes, but their code should not be copied into this project.
- Several LoL tools rely on LCU, Riot APIs, Data Dragon, memory reading, or observer tooling. These are explicitly out of scope for v0.1.
- Official Riot champion artwork and logos are copyrighted/trademarked. Do not add or download Riot assets for v0.1 unless the project owner explicitly approves the legal source and packaging plan.
- A fallback-only design will look less official than a fully art-directed LoL broadcast package, but it is preferable to broken images and preserves local-first reliability.
- The next implementation task should avoid turning the generic draft overlay into a LoL-only component. The layout can be LoL-style, but generic slot rendering, image fallback, timer rendering, and browser-source safety should remain reusable.
- Real event use will eventually require an approved local asset package with champion art, team logos, sponsor logos, and theme files prepared before rehearsal.
