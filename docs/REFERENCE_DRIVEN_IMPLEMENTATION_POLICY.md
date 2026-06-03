# Reference-Driven Implementation Policy

## Purpose

This document defines how Codex agents and developers should use mature public tools, public documentation, and broadcast examples when implementing the Multi-MOBA Esports Broadcast Toolkit v0.1.

The goal is to improve feature completeness, operator usability, and broadcast quality while preserving the project's local-first, manual-first, game-agnostic architecture.

## Core Position

Reference-driven implementation is encouraged.

Project guardrails are risk controls, not quality ceilings. They prevent unsafe runtime dependencies, copied third-party work, and LoL-specific contamination of the universal core. They do not require the product to be a tiny sample-only tool, a fallback-only overlay, or an incomplete operator experience.

Agents should actively study proven public tools and official browser-source behavior when implementing:

- Champion selector completeness and search behavior.
- Draft operator workflow.
- Asset pipeline shape.
- Broadcast overlay visual hierarchy.
- OBS/vMix browser-source reliability.
- Manual QA and rehearsal expectations.

## Allowed Reference Sources

Acceptable references include:

- `RCVolus/lol-pick-ban-ui`.
- `RCVolus/league-prod-toolkit`.
- LeagueBroadcast or similar public LoL broadcast tooling as conceptual reference only.
- OBS and vMix browser-source behavior documentation.
- Riot Data Dragon public documentation and asset naming conventions.
- Publicly visible broadcast examples, product docs, and design research used as feature or layout expectation references.

Agents may inspect public repositories in temporary or reference-only locations. They must not commit third-party repositories into this project.

## Acceptable Use of References

References may be used to understand:

- What a complete production champion selector should support.
- How professional draft tools group picks, bans, teams, timers, active side, and hover/lock state.
- How public Data Dragon metadata names champions and icon assets.
- How OBS/vMix browser sources handle transparency, dimensions, cache, and refresh behavior.
- What manual rehearsal and missing-asset cases should be tested.

Implementation must be re-created inside this project's own React, TypeScript, Node, Socket.IO, JSON event package, and local asset architecture.

## Forbidden Copying / Legal Boundaries

Reference-driven does not mean copy-driven.

Do not:

- Paste third-party source code wholesale.
- Copy exact proprietary broadcast layouts, branding, sponsor treatments, animations, or trade dress.
- Copy screenshots, artwork, logos, champion art, or bundled assets into this repo without explicit project-owner approval.
- Commit public reference repositories into this repo.
- Commit large artwork bundles unless the project owner explicitly approves the source, licensing posture, and package location.
- Rebrand third-party work as original toolkit code.

When a public repo or product page informs a task, the handoff must state what was referenced and what was reimplemented conceptually.

## Riot / Data Dragon Policy

Data Dragon is allowed and preferred as a pre-event/static import source for LoL public champion metadata and icons. The show runtime must remain local-first and must not require Data Dragon, Riot API, LCU, or internet access.

Allowed:

- Pre-event/static Data Dragon import scripts.
- Generated local LoL champion metadata.
- Approved local LoL champion icon packages.
- Local event-package hero icons derived from approved sources.
- Documentation and specific TODO notes for future optional sync tooling.

Forbidden in active v0.1 show runtime:

- Runtime dependency on the Data Dragon CDN.
- Runtime Riot API dependency.
- Runtime LCU dependency.
- Mandatory internet for champion metadata or icons.
- Automatic show-time sync that changes live assets or data without operator approval.
- Player-side automation.

## Local-First Runtime Boundary

Live show operation must work on a private production LAN after dependencies and approved local assets are prepared.

The runtime may read:

- Local event package JSON.
- Local generated game adapter data.
- Local packaged hero icons.
- Local fallback assets.
- Local append-only JSONL logs.

The runtime must not download missing assets, fetch live champion metadata, call Riot APIs, require game clients, or depend on cloud services during show operation.

## Approved Local Asset Workflow

For LoL production rehearsal, the expected path is:

1. Prepare champion metadata and approved icon assets before the event.
2. Store generated metadata under the LoL adapter or another clearly scoped local data file.
3. Store approved event package icons under:

```text
assets/hero-icons/lol/<ChampionDataId>.png
```

Examples:

```text
assets/hero-icons/lol/Aatrox.png
assets/hero-icons/lol/MonkeyKing.png
assets/hero-icons/lol/KSante.png
```

4. Serve assets locally through the server or overlay asset resolver.
5. Run rehearsal with internet disconnected where practical.

## Fallback UX Principle

Fallback rendering exists to prevent broken show output. It is not the expected production experience.

For LoL draft production use, the expected production path is:

- Full practical LoL champion roster.
- Clear champion search.
- Local champion icon when packaged.
- Full champion display name even if icon is missing.
- No browser broken-image icon.
- No initials-only fallback as the only on-air information.

Fallbacks must be stable, readable, and public-safe, but agents should not treat fallback-only output as the quality target.

## LoL Champion Selector Production Standard

The LoL draft operator UI must be usable for practical rehearsal and production prep.

It should include:

- Full practical LoL champion roster, not a tiny sample list.
- No generic MOBA placeholder names in the LoL selector.
- Search normalization for apostrophes, periods, ampersands, spaces, roman numerals, punctuation, case, and useful aliases.
- Champion cards that show a local icon when available.
- Full champion name always visible.
- Stable fallback when icon art is absent.

Search must handle difficult names such as:

```text
Kai'Sa
Kha'Zix
Cho'Gath
Dr. Mundo
Nunu & Willump
Miss Fortune
Twisted Fate
Jarvan IV
Aurelion Sol
Wukong
Renata Glasc
```

## Overlay Visual QA Standard

Draft overlays are broadcast graphics, not dashboards or operator panels.

LoL draft overlay work should use the design research as an implementation reference:

- Transparent 1920x1080 canvas.
- Bottom-anchored broadcast rail.
- Blue side on the left and red side on the right.
- Five pick cards per team.
- Compact ban strip.
- Central timer, phase, and active-side module.
- No normal-route debug text.
- Debug diagnostics only behind `?debug=1`.
- Full champion names visible when images are missing.
- No broken-image icons.
- Timer visibly counts down from authoritative state when the draft is running.

Manual or screenshot QA at 1920x1080 is required for normal and missing-asset cases before claiming overlay production readiness.

## Required Handoff Notes When References Are Used

When a task uses public references, the handoff must include:

- References inspected.
- What each reference was used to understand.
- Confirmation that no third-party code, assets, branding, exact layouts, or trade dress were copied.
- Whether Data Dragon or Riot documentation was used only for pre-event/static metadata or asset convention work.
- Whether runtime remains local-first and offline-safe.
- Any legal or asset-approval limitations.

## Static Guardrail Guidance

Static guardrails must distinguish forbidden runtime integrations from allowed documentation, scripts, and static generated data.

Do not blindly fail every mention of:

```text
Data Dragon
DataDragon
Riot
```

Allowed matches may appear in:

- Documentation.
- LoL adapter pre-event/static import scripts.
- Generated static LoL champion metadata.
- Tests that prove runtime boundaries.
- Handoff notes describing reference usage.

Guardrails should still fail active forbidden use in universal core or show-runtime paths, including:

- Riot/LCU/Data Dragon dependencies in `packages/core-draft`, `packages/core-match`, or `packages/core-production`.
- Runtime show paths that fetch champion metadata or icons from remote services.
- Overlay or server code that downloads missing assets during show operation.
- Any player-side automation, auto-pick, or auto-ban behavior.
