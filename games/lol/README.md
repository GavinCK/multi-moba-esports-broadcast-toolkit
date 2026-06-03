# LoL Static Champion Roster

This package exposes a local-first League of Legends champion roster through the shared `Hero` model. It remains manual-first and does not run LCU, Riot API, Data Dragon, or champion-select sync at runtime.

## Champion Data

Runtime data is generated into:

```text
games/lol/src/generated-champions.ts
```

The checked-in roster was generated from Riot Data Dragon static `champion.json` metadata for version `16.11.1`, using `en_US` for stable English display names and `zh_TW` for Traditional Chinese Taiwan localized names. Runtime code imports this local TypeScript file only.

## Updating Before An Event

From the repository root:

```bash
pnpm --filter @mmbt/game-lol-sample champions:import
```

For offline or controlled updates, download both Data Dragon files during event prep and run:

```bash
pnpm --filter @mmbt/game-lol-sample champions:import -- --input-en-us ./en_US/champion.json --input-zh-tw ./zh_TW/champion.json --version 16.11.1
```

The script updates champion IDs, English display names, Traditional Chinese Taiwan localized names, Riot numeric keys, and public class tags. It does not download or package champion artwork.

## Local Champion Icons

Approved local champion icons can be placed in the event package using this convention:

```text
event-packages/sample-event/assets/hero-icons/lol/<ChampionDataId>.png
```

Examples:

```text
assets/hero-icons/lol/Ahri.png
assets/hero-icons/lol/LeeSin.png
assets/hero-icons/lol/MonkeyKing.png
```

To prepare a local icon package from Riot Data Dragon static champion square images before an event, run:

```bash
pnpm --filter @mmbt/game-lol-sample champions:icons
```

The icon script reads the current generated champion metadata, uses each champion Data Dragon ID, writes PNGs to `event-packages/sample-event/assets/hero-icons/lol/<ChampionDataId>.png`, skips existing useful files unless `--force` is provided, and prints downloaded/skipped/failed counts. It is a pre-event helper only and is not run by live server startup.

Official Riot champion artwork is not fetched by runtime code. Until an approved local icon package is prepared, overlays and operator panels render stable text fallbacks and hide failed local image loads.
