# LoL Draft Overlay Lower-Third Implementation Spec

## Purpose

This spec defines the original LCK-inspired lower-third draft overlay skin for the Multi-MOBA Esports Broadcast Toolkit.

Reference use is structural only: lower-third proportions, ban-strip relationship, timer placement, center-score hierarchy, thin divider discipline, and restrained broadcast feel. No LCK, Riot, team, player, sponsor, chair, hardware, artwork, logos, textures, screenshots, or distinctive branding are copied.

## Canvas

| Element | x | y | w | h | Notes |
|---|---:|---:|---:|---:|---|
| DraftOverlayFrame | 0 | 0 | 1920 | 1080 | OBS/vMix browser source, transparent outside overlay graphics |
| Transparent camera-safe area | 0 | 0 | 1920 | 742 | No overlay panels or operator diagnostics |
| BanStripBlue | 0 | 742 | 475 | 82 | Five compact ban slots |
| BanStripRed | 1445 | 742 | 475 | 82 | Five compact ban slots |
| TimerBar | 64 | 827 | 1792 | 10 | Long thin broadcast draft clock line |
| BottomRail | 0 | 838 | 1920 | 242 | Main lower-third rail |
| Blue pick region | 0 | 838 | 790 | 242 | Five 158 x 242 pick/player slots |
| CenterScoreBlock | 790 | 838 | 340 | 242 | Match, side marks, score, side labels, patch |
| Red pick region | 1130 | 838 | 790 | 242 | Five 158 x 242 pick/player slots |

## Slots

| Component | Size | Treatment |
|---|---:|---|
| PickSlotEmpty | 158 x 242 | Dark glass, subtle side tint, original role watermark, no text labels |
| PickSlotLocked | 158 x 242 | Image-led hero art, bottom player name matte, 1px inner divider |
| BanSlotEmpty | 95 x 82 | Dark glass with low-opacity diagonal slash |
| BanSlotLocked | 95 x 82 | Dimmed icon/art with diagonal slash and final locked treatment |

## Color Tokens

| Token | Value | Opacity | CSS variable |
|---|---|---:|---|
| surface/rail-glass | #06081A | 0.88 | --mmbt-overlay-rail-glass |
| surface/rail-violet | #12002E | 0.72 | --mmbt-overlay-rail-violet |
| surface/slot-empty | #071027 | 0.64 | --mmbt-overlay-slot-empty |
| surface/center-block | #16003E | 0.92 | --mmbt-overlay-center-block |
| side/blue-tint | #2563EB | 0.18 | --mmbt-overlay-side-blue-tint |
| side/red-tint | #E11D48 | 0.18 | --mmbt-overlay-side-red-tint |
| accent/blue-active | #58A6FF | 1.00 | --mmbt-overlay-accent-blue-active |
| accent/red-active | #FF5C7A | 1.00 | --mmbt-overlay-accent-red-active |
| accent/urgent | #FFCF5A | 1.00 | --mmbt-overlay-accent-urgent |
| line/divider | #FFFFFF | 0.28 | --mmbt-overlay-line-divider |
| line/hairline | #DDE7FF | 0.72 | --mmbt-overlay-line-hairline |
| timer/base | #F8FAFC | 1.00 | --mmbt-overlay-timer-base |
| text/primary | #F8FAFC | 1.00 | --mmbt-overlay-text-primary |
| text/secondary | #C7D2FE | 0.72 | --mmbt-overlay-text-secondary |
| text/muted | #94A3B8 | 0.62 | --mmbt-overlay-text-muted |

## Typography

Use local/system sans-serif fonts only. No remote font dependency.

| Role | CSS |
|---|---|
| Player name | 21px / 26px Inter Semi Bold, letter-spacing 0 |
| Center match label | 15px / 18px Inter Extra Bold, uppercase, letter-spacing 0 |
| Center score | 31px / 36px Inter Extra Bold, letter-spacing 0 |
| Center metadata / patch | 13px / 16px Inter Semi Bold, letter-spacing 0 |
| Spec/document body | 18px / 28px Inter Regular, letter-spacing 0 |

## Borders, Shadows, Glow

| Element | Spec |
|---|---|
| Pick dividers | 1px solid rgba(255,255,255,0.24) |
| Ban dividers | 1px solid rgba(255,255,255,0.20) |
| Center block side dividers | 2px solid rgba(255,255,255,0.34) |
| Slot radius | 0-2px, square broadcast rail feel |
| Rail depth | 0 -8px 28px rgba(0,0,0,0.34), inset highlights |
| Active blue glow | #58A6FF at 0.48-0.62 opacity, 20-24px blur |
| Active red glow | #FF5C7A at 0.48-0.62 opacity, 20-24px blur |
| Urgent timer glow | #FFCF5A at 0.72 opacity, 18px blur |

## States

| State | Visual behavior |
|---|---|
| Normal | White timer line, subtle blue/red side tint, dark violet glass rail |
| Active side | Soft side wash and slot edge glow; no bulky web progress/card treatment |
| Hover | Same slot dimensions as locked, highlighted border/glow, never presented as final |
| Locked | Full-opacity hero art/icon where available; stable name/fallback text |
| Empty | No PENDING, P1, P2, PICK 1, or diagnostic labels; role watermark only |
| Urgent timer | Timer segment shifts to urgent accent with glow for <= 5 seconds |
| Complete | Preserve final picks/bans and show a compact final-state indicator |
| Missing asset | Local fallback only; no broken image icon; slot dimensions remain fixed |

## React/CSS Mapping

| Figma component | Current implementation |
|---|---|
| DraftOverlayFrame | `.draft-overlay`, `.overlay-canvas--draft` |
| BottomRail | `.draft-broadcast-rail::before`, `.draft-broadcast-rail::after` |
| BanStripBlue | `.ban-strip--blue` |
| BanStripRed | `.ban-strip--red` |
| TimerBar | `.draft-broadcast-rail__timer-bars` |
| PickSlotEmpty | `.pick-card--empty`, `.pick-card--pending` |
| PickSlotLocked | `.pick-card--locked` |
| BanSlotEmpty | `.ban-card--empty`, `.ban-card--pending` |
| BanSlotLocked | `.ban-card--locked` |
| CenterScoreBlock | `.center-draft-status` |
| ActiveSideGlow | `.team-draft-rail--active`, `.pick-card--active`, `.ban-card--active` |
| UrgentTimerState | `[data-timer-urgency="danger"]`, `[data-timer-state="expired"]` |

## Implementation Notes

- Normal overlay route must remain read-only and render no mutation controls.
- Debug diagnostics stay behind `?debug=1`.
- Overlay must not require remote images, web fonts, Riot APIs, Data Dragon, LCU, OBS WebSocket, vMix API, or cloud services at runtime.
- The timer is visual only. It must never advance draft phases, auto-pick, or auto-ban.
- Pick and ban groups are derived from generic `DraftState.actions`; no LoL-specific draft logic belongs in universal core packages.
- Fallback rendering is safety behavior, not the target production asset path.

