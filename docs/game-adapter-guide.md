# Game Adapter Developer Guide

## 1. Purpose

This guide explains how developers and future AI agents should add or maintain a game adapter for the Multi-MOBA Esports Broadcast Toolkit v0.1.

The audience is developers working on local manual draft support for a new MOBA or maintaining the current Generic MOBA, LoL sample, AOV sample, and HoK sample adapters. It is a boundary guide, not an implementation request.

The goal is to let new games provide game-specific data without contaminating universal packages such as `packages/core-draft`, `packages/core-match`, `packages/core-production`, or `packages/shared-types`.

## 2. v0.1 Adapter Principles

Game adapters preserve the v0.1 architecture:

- The universal core stays game-agnostic.
- The adapter owns game-specific public/manual data.
- The universal draft engine owns draft lifecycle, actions, phase advancement, timer behavior, undo, reset, and complete.
- Adapter data and assets are local-first.
- Operation remains manual-first.
- No player-side automation exists in adapter work.
- No auto-pick behavior exists in adapter work.
- No auto-ban behavior exists in adapter work.

An adapter may describe game metadata, heroes, rulesets, capabilities, and safe local asset references. It must not become a hidden production controller, game-client reader, player-client controller, or copy of the universal draft engine.

## 3. Current Adapter Locations

Current v0.1 adapter folders:

- `games/generic-moba`
- `games/lol`
- `games/aov`
- `games/hok`

Shared adapter registry and validation helpers live in:

- `packages/game-adapters`

Generic shared contracts live in:

- `packages/shared-types`

Universal draft lifecycle and action behavior lives in:

- `packages/core-draft`

## 4. GameAdapter Responsibilities

A v0.1 `GameAdapter` is responsible for exposing local, serializable, public-safe game data through the shared interface.

Required responsibilities:

- Expose `gameCode`, `displayName`, optional `version`, and metadata through normal exports.
- Expose a hero list through `loadHeroes()`.
- Expose default manual rulesets through `loadDefaultRulesets()`.
- Expose lookup helpers such as `getHeroById(heroId)` and `searchHeroes(query)`.
- Expose capability flags through `capabilities`.
- Expose asset and fallback lookup through `getAssetUrl(assetType, id)` where implemented.
- Provide adapter-level validation through `validateDraftAction(state, action)` where public/manual adapter data can validate the action.
- Keep all returned data serializable as JSON.
- Avoid mutating live draft, match, production, overlay, or server state directly.

The adapter may validate that a hero exists in its local hero pool. It must not decide draft lifecycle transitions. Start, pause, resume, hover, lock, phase advancement, timer calculation, undo, reset, and complete belong to `packages/core-draft` and the server/UI layers that call it.

## 5. What Belongs in `/games/<game>`

A game folder may contain:

- Adapter implementation.
- Game metadata.
- Sample hero or champion data.
- Default manual draft rulesets.
- Asset lookup helpers.
- Local fallback asset references.
- Capability declarations.
- Adapter-level validation helpers.
- Adapter tests.

Examples:

- `games/<game>/src/adapter.ts`
- `games/<game>/src/data.ts`
- `games/<game>/src/rulesets.ts`
- `games/<game>/src/validation.ts`
- `games/<game>/src/index.test.ts`

Game folders should import generic types from `@mmbt/shared-types` and registry helpers from `@mmbt/game-adapters` where needed. They should not define incompatible duplicate copies of `Hero`, `DraftRuleset`, `GameAdapter`, or `GameAdapterCapabilities`.

## 6. What Must Stay Out of `/games/<game>` in v0.1

For v0.1, do not add active runtime systems for:

- Official game API clients.
- LoL LCU readers.
- Active runtime Data Dragon sync or show-time remote asset dependency.
- Player PC software.
- Game-client sync.
- Hidden competitive data extraction.
- Auto-pick.
- Auto-ban.
- OBS or vMix control.
- Cloud, database, or auth requirements.

Future-facing comments are acceptable only when they are specific, clearly outside v0.1 runtime behavior, and do not introduce dependencies or executable code paths.

## 7. Hero Data Guidelines

Hero data should use the shared `Hero` type.

Required approach:

- Use stable generic hero IDs, such as `generic-vanguard`, `lol-ahri`, `aov-butterfly`, or `hok-luban-no7`.
- Set `gameCode` to the adapter game code.
- Include `displayName`.
- Include `localizedNames` only when local public data is available.
- Include `roleTags` or class tags only when they are public, useful for operators, and not used as hidden competitive data.
- Include local `iconUrl`, `splashUrl`, or `squareUrl` paths when available, or explicit fallback metadata when artwork is intentionally not packaged.
- Use adapter-level fallback behavior when an asset is missing.
- Avoid remote CDN dependencies.
- Avoid hidden, private, or player-client-only metadata.

Keep IDs game-specific but still generic to the shared model. For example, a LoL sample champion can be represented as a `Hero` with `id: "lol-ahri"` and metadata marking it as a local static sample, while the universal draft core still sees only a generic hero ID.

Hero data must not make the show depend on the internet, official game APIs, or private game-client state.

### LoL Champion Data Standard

The LoL adapter may be richer than the generic adapter.

For usable v0.1 LoL draft rehearsal, the LoL adapter is expected to provide a full practical local champion roster, not a tiny sample list. It may use pre-event/static Data Dragon import tooling to generate local public champion metadata and approved local icon path conventions, as long as the live show runtime does not require Data Dragon, Riot API, LCU, or internet.

Allowed LoL adapter data/workflow:

- Generated local champion metadata.
- Full champion display names.
- Stable local IDs.
- Data Dragon IDs for local asset mapping, such as `MonkeyKing` for Wukong.
- Local icon path convention such as `assets/hero-icons/lol/<ChampionDataId>.png`.
- Approved local icon packages prepared before rehearsal.

LoL search normalization should handle apostrophes, periods, ampersands, spaces, roman numerals, punctuation, case, and aliases.

## 8. Ruleset Guidelines

Rulesets should use the shared `DraftRuleset` shape and generic draft phase semantics.

Required approach:

- Use `DraftRuleset`.
- Use generic `BAN` and `PICK` phase semantics.
- Set `gameCode` to the adapter game code.
- Use `count` to describe how many action slots are in a phase.
- Use `timeSeconds` to describe the phase timer.
- Use `allowDuplicateHeroes` to control duplicate hero blocking.
- Use `allowHover` to allow or disallow temporary hover state for a phase.
- Use `autoAdvance` to allow normal phase advancement after all slots in a phase complete.
- Keep lifecycle logic out of the ruleset and out of the adapter.
- Do not infer side selection from hidden data.

`count > 1` means one phase contains multiple action slots for the same team and action type. The phase timer applies to the whole phase. The phase is complete only after all generated slots in that phase are locked or explicitly skipped by a deliberate manual override.

`timeSeconds: 0` may be used for operator-controlled phases with no countdown. Timer expiry must never cause automatic pick, automatic ban, or automatic phase completion by itself.

Avoid game-specific lifecycle code in `packages/core-draft`. If a game needs a different order, express that order as a `DraftRuleset` under the adapter or event package.

## 9. Asset and Fallback Guidelines

Assets must be local-first and safe to resolve.

Required approach:

- Use local relative asset paths.
- Avoid remote URLs.
- Avoid absolute filesystem paths.
- Avoid path traversal such as `..`, `../`, or `..\`.
- Provide missing logo, icon, splash, and square fallback references where practical.
- Treat missing optional assets as warnings with fallback rendering, not fatal show failures.
- Keep asset references serializable.

Allowed examples:

```text
assets/generic-moba/hero-icons/generic-vanguard.svg
assets/hero-icons/lol/Ahri.png
assets/aov-sample/fallbacks/hero-icon.svg
assets/hok-sample/fallbacks/hero-square.svg
```

Disallowed examples:

```text
https://example.invalid/hero.png
file:///C:/show/hero.png
C:\show\hero.png
../outside-package/hero.png
```

If `getAssetUrl("HERO_ICON", heroId)` cannot find a hero-specific icon, it should return a local fallback path or `null` when the asset type is unsupported.

## 10. Capabilities Flags

Capabilities describe what a v0.1 adapter can support locally and manually.

Current shared flags include:

```ts
supportsManualDraft: boolean;
supportsClientReader: boolean;
supportsIngameHud: boolean;
supportsPostGameStats: boolean;
supportsAssetSync: boolean;
supportsLocalization?: boolean;
supportsCustomRulesets?: boolean;
```

For v0.1 sample adapters, expected capability meaning:

- `supportsManualDraft: true` means the adapter can provide local hero data and manual draft rulesets.
- `supportsClientReader: false` means the adapter does not run a game-client reader as an active v0.1 feature.
- `supportsIngameHud: false` means the adapter does not provide an in-game HUD runtime feature in v0.1.
- `supportsPostGameStats: false` means the adapter does not collect live post-game stats in v0.1.
- `supportsAssetSync: false` means the adapter does not run automatic external asset sync in v0.1.
- `supportsLocalization: true` may be used when local `localizedNames` are available.
- `supportsCustomRulesets: true` may be used when the adapter can safely load compatible local rulesets.

Capability flags must not imply active external API integration. If a future plugin changes a capability, that plugin must remain isolated and manual fallback must still work.

## 11. Required Adapter Tests

Adapter behavior should be covered with focused tests whenever adapter code changes.

Required adapter test coverage:

- Adapter loads and validates through `validateGameAdapter`.
- Hero list is non-empty.
- Ruleset list is non-empty.
- Rulesets validate through the universal draft ruleset validation path.
- Rulesets can create draft state through `packages/core-draft` where practical.
- Assets and fallbacks are local-safe.
- Capabilities are serializable.
- Capability flags do not advertise future runtime features as active v0.1 behavior.
- Hero/ruleset data is cloned or treated immutably so callers cannot mutate adapter constants.
- Forbidden future-scope strings are not active runtime behavior.

Helpful negative checks:

- Unknown hero lookup returns `null`.
- Unsupported asset type returns `null`.
- Unknown hero asset lookup returns a local fallback where supported.
- Wrong-game ruleset validation fails.
- Adapter validation fails for empty game code, empty display name, missing capabilities, or missing required methods.

## 12. Universal Core Boundaries

Universal packages must remain game-agnostic.

`packages/core-draft` may contain:

- Draft state creation.
- Ruleset validation.
- Draft lifecycle transitions.
- Hover and lock behavior.
- Phase advancement.
- Timer calculation.
- Undo, reset, complete, and manual override helpers when scoped.
- Generic draft errors and tests.

`packages/core-draft` must not contain:

- Specific hero or champion names.
- Official game API assumptions.
- LoL LCU assumptions.
- Data Dragon assumptions.
- AOV-only or HoK-only draft assumptions.
- Adapter imports from `/games/*`.
- Server, Socket.IO, REST, file system, overlay, OBS, or vMix logic.
- Auto-pick or auto-ban.

`packages/core-match` must stay focused on event, match, game, team, player, score, and sponsor concepts without game-specific runtime logic.

`packages/core-production` must own production state, Preview, Program, Take, Clear, and Emergency behavior above draft and game adapters. It must not move inside a game adapter.

`packages/shared-types` may contain generic types only. It may represent `Hero`, `DraftRuleset`, `GameAdapter`, and capability flags, but it must not contain LoL-only runtime contracts or game-client-specific payloads.

## 13. LoL Adapter and Future Plugin Boundary

The v0.1 LoL adapter is local/manual data only, but it should be practical enough for LoL draft rehearsal.

Allowed in `games/lol` for v0.1:

- Full practical static local champion roster.
- Generated local champion metadata.
- Pre-event/static Data Dragon import script for public metadata and approved local icon preparation.
- LoL-style manual sample ruleset.
- Local placeholder/fallback asset references and local icon path conventions.
- Adapter validation and tests.
- Specific future-scope notes that do not run as v0.1 behavior.

Future plugin scope only:

- LCU reader.
- Active runtime Data Dragon sync.
- LoL in-game HUD.
- Objective tracker.
- Champion select mirroring.
- Post-game stats reader.
- Observer-side data mapping.

Any future LoL plugin must preserve manual override and must not contaminate `packages/core-draft`, `packages/core-match`, `packages/core-production`, or generic shared types.

## 14. Adding a New Game - Step-by-step

Use this checklist when adding a new adapter in a future implementation task:

1. Choose a stable `gameCode`, such as `new-moba`.
2. Create `games/<game>` using existing adapter folder conventions.
3. Add package metadata if the workspace package needs it.
4. Add local sample hero data using shared `Hero`.
5. Add at least one local manual `DraftRuleset`.
6. Add the adapter implementation using shared `GameAdapter`.
7. Add local/fallback asset references.
8. Add adapter-level validation helpers.
9. Add adapter tests for loading, heroes, rulesets, capabilities, validation, and local-safe assets.
10. Register or load the adapter through the established registry/server path only when the task scope allows code changes.
11. Run package and root verification commands required by the task.
12. Run forbidden-scope guardrail checks.
13. Update documentation and handoff notes.

For a docs-only task, stop at documentation. Do not add the folder, code, tests, dependencies, or registration path.

## 15. Example Folder Skeleton

This is an example layout for a future adapter. It is not an instruction to create a new adapter during this docs-only task.

```text
games/new-moba
├── package.json
├── tsconfig.json
└── src
    ├── adapter.ts
    ├── data.ts
    ├── rulesets.ts
    ├── validation.ts
    ├── index.ts
    └── index.test.ts
```

Suggested file responsibilities:

- `adapter.ts`: exports the `GameAdapter`.
- `data.ts`: exports local sample hero data and clone/normalization helpers.
- `rulesets.ts`: exports local manual `DraftRuleset` values.
- `validation.ts`: validates adapter metadata, hero data, ruleset compatibility, and local-safe asset references.
- `index.ts`: re-exports public adapter symbols.
- `index.test.ts`: proves adapter loading, hero/ruleset validation, capabilities, and guardrails.

## 16. Future Agent Review Checklist

Before approving a new or changed adapter, review:

- Does the adapter use shared generic types instead of duplicating contracts?
- Are hero IDs stable and game-scoped?
- Is the hero list non-empty and local/manual?
- Are rulesets non-empty and generic `BAN`/`PICK` phase definitions?
- Does `count > 1` mean multiple action slots in one phase?
- Does `timeSeconds` describe the phase timer?
- Does the adapter avoid lifecycle logic that belongs in `packages/core-draft`?
- Are assets local relative paths with fallbacks?
- Are path traversal and remote URLs rejected or avoided?
- Are capability flags serializable and honest for v0.1?
- Are future integrations clearly out of active v0.1 runtime behavior?
- Are LoL-specific features isolated to `games/lol` or a future plugin?
- Do universal packages contain no game-specific imports or assumptions?
- Do tests cover adapter loading, heroes, rulesets, capabilities, assets, and guardrails?
- Did verification commands run, or were unavailable commands reported honestly?

## 17. Known Limitations

- This guide is documentation-only and does not add a new adapter.
- This guide does not change adapter code, shared types, server loading, dashboard behavior, overlay behavior, or tests.
- v0.1 adapters are local/manual sample adapters.
- Real official game integrations remain future plugin work and must preserve manual fallback.
- Adapter asset paths may point to local placeholder assets until a future asset package task expands them.
- Full live rehearsal of a new adapter belongs to later testing and rehearsal tasks, not this guide.
