# LoL Draft Overlay — APPROVED Design Spec (v1, locked)

Approved by user: 2026-07-05 (Figma `BanPick-UI` → page `02_Design`, frames F1/F2/F3 + ICON_WORKBENCH).
This document is the binding source for implementation (ADR-005). Implementers change NOTHING visually beyond it. Supersedes the geometry-only spec (`LOL_DRAFT_OVERLAY_LCK_INSPIRED_IMPLEMENTATION_SPEC.md`) by extending it; geometry is identical.

## 1. Canvas & geometry (1920×1080, browser source)

| Element | Geometry |
|---|---|
| Canvas | 1920×1080, fully transparent background, no scrollbars, overflow hidden |
| Fearless row (post-MVP, hidden in MVP) | y=700, squares 30×30, gap 6, 5 per side, aligned like ban strip; label "SERIES LOCKED" 9px, letter-spacing 24%, white 35%, left-aligned after blue group |
| Ban strip | squares 66×66, gap 8, vertically centered in y=742..824 (square y=750); blue group starts x=65 (grows rightward); red group ends x=1855 (grows leftward, slot 0 outermost) |
| Timer bar | x=65, y=827, w=1790, h=9, radius 4.5; width scales with remaining/total of the CURRENT TURN, anchored center (shrinks toward x=960 symmetrically); hidden when timer stopped/draft complete |
| Bottom rail | y=838, h=242 (to 1080), full width |
| Blue zone | x=0..788 (5 slots × 157.6) |
| Center block | x=788..1132 (w=344) |
| Red zone | x=1132..1920 (5 slots × 157.6) |
| Side accent lines | 3px tall at y=838: blue x=0..788, red x=1132..1920 |
| Slot dividers | 1px, white 8%, y=848..1070, at slot boundaries (not at outer edges) |

## 2. Design tokens

Colors (hex + opacity):

- rail background: vertical gradient `#0F1421` @94% → `#090D17` @97%
- center block background: `#080B1A` @97%; 1px white 10% edges left/right
- blue accent: `#216BF2` · red accent: `#E63B3D`
- gold (patch label): `#C9A86B`
- timer bar: white @96%, glow drop-shadow white 50% blur 10
- ban done square: gradient `#474D5C` → `#1F2129` (placeholder tint under champion icon)
- pick fallback gradients (used ONLY when splash asset missing): blue side `#1A293D`→`#05080D`, red side `#291A33`→`#05080D`
- name band (picked slots): bottom 46px, black gradient 0%→78%
- role icon: bright parts white 72%, dim parts white 18–26%

Typography (all Inter; uppercase via content, not CSS):

- Player name: 17px Semi Bold, white 92%, letter-spacing 8%, centered, y=1046 block (both empty and picked states)
- Match label (center): 13px Medium, white 65%, letter-spacing 22%, y=854, format `{matchLabel} · GAME {gameNumber}`
- First-pick tag: 92×20 box radius 2, fill side-color @22%, text 11px Semi Bold white 90% `◀ 1ST PICK` (blue, box at x=806) or `1ST PICK ▶` (red, box right-aligned at x=1022), y=880
- Score digits: 26px Bold white 95%, centered under each crest (centers x=896 / x=1024), y=976
- Patch label: 12px Medium gold 95%, letter-spacing 18%, centered, y=1044

Center block composition: match label → fp tag → two team logos 54×54 (centers x=896 & x=1024, cy=934; source `Team.logoAssetPath`, fallback = template crest outline) → small caret 10×6 white 55% between (x=955, y=930) → per-side scores → patch label.

## 3. State matrix

Ban slot: `empty` black 45% fill + 1px white 14% stroke → `active` (current turn) adds 2px side-color stroke + side-color glow (blur 12, 55%) → `done` champion square icon (desaturated ~60%, dark tint) + ONE diagonal line "\" (top-left→bottom-right), white 75%, 2px, inset 10px → `skipped` (T-002) permanent empty style, no line, no label.

Pick slot: `empty` white 1.5% fill + role icon (36×36, centered x, icon center y=938) + player name → `hover` champion art at 45% opacity + 2px white 60% border + name (uses engine hover state; no extra label text) → `picked` full-bleed champion splash (vertical crop, `HERO_SPLASH` via adapter; fallback = side gradient + centered square icon at 64px) + bottom name band + name → confirmed lineup = picked everywhere + timer hidden.

Global: NO text labels anywhere except: player names, center block fields, (post-MVP) fearless row label. Banned/forbidden strings on air: "PENDING", "PICK n", "P1..P5", "BLUE BAN", phase names, debug text.

## 4. Data binding

- Slots L→R blue = `playerDisplayOrderBySide` (design intent: SUP BOT MID JGL TOP), red = mirrored (TOP JGL MID BOT SUP). TOP slots flank the center block on both sides (LCK convention).
- Mid-draft picks fill slots in pick order (existing engine behavior); final lineup phase reorders (existing feature, unchanged).
- Timer per TURN including shared double-pick windows (ADR-003) — never per individual pick.
- Center block fields ← presentation metadata: `matchLabel`, `gameNumber`, `firstPickSide`, `scoreBySide`, `patchLabel`, team short names/logo paths.
- Fearless row: render only when series-lock data exists (post-MVP; ADR-004). MVP: row absent.

## 5. Assets (all local, no runtime network)

- Role icons: official Riot position SVGs (org is Riot-licensed) at `event-packages/sample-event/assets/role-icons/lol/position-{top,jungle,middle,bottom,utility}.svg`, prepared pre-event by T-004 script. Until present, fall back to inline v2 glyphs (geometry in Figma ICON_WORKBENCH).
- Champion squares: existing 172 local PNGs (already in repo).
- Champion splashes: `event-packages/sample-event/assets/hero-splashes/lol/{ChampionId}.jpg`, prepared pre-event by T-004; overlay must render correctly with ZERO splashes present (fallback path).
- Team logos: `Team.logoAssetPath` (existing pipeline); fallback = neutral crest outline (white 88% stroke shield, geometry in Figma).
