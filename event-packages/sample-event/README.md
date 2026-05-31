# Sample Event Package

This folder is a portable local rehearsal package for the Multi-MOBA Esports Broadcast Toolkit v0.1.

It contains one sample event, two fictional teams, ten fictional players, one sample sponsor, four manual draft rulesets, a default theme, and local placeholder assets. The package is setup data only; live runtime loading, panels, overlays, and audit writing are handled by later tasks.

## Contents

- `event.json` defines event metadata and default match, game, ruleset, theme, and log paths.
- `teams.json`, `players.json`, and `sponsors.json` define sample show data.
- `matches.json` includes a Generic MOBA BO3 plus LoL, AOV, and HoK BO1 sample matches.
- `rulesets/*.json` contains static manual draft rulesets matching the current sample adapters.
- `themes/default-theme.json` uses only local asset references.
- `assets/` contains local placeholder graphics and fallbacks.
- `logs/.gitkeep` preserves the future runtime audit log folder.

## Boundaries

This package does not include runtime services, file watching, official client sync, player-side automation, automatic selection behavior, remote assets, or external service credentials.
