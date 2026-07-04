# CLAUDE.md — Operating Guide for AI Planner Sessions

Project: **Multi-MOBA Esports Broadcast Toolkit** — local-first, manual-first esports broadcast control system (React/TS + Node, pnpm monorepo, Socket.IO, OBS/vMix browser-source overlays).

Current mission: **LoL-first MVP**. Multi-MOBA architecture is preserved but all non-LoL expansion is frozen. See `docs/PROJECT_STATE.md`.

## Session bootstrap — do this first, every session

1. Read `docs/PROJECT_STATE.md` (current baseline, tracks, queue).
2. Run read-only baseline check: `git log --oneline -5`, `git status --short`.
3. If the working tree is unexpectedly dirty → STOP, classify with the user before any work.
4. Work only on queued items. Any new scope requires explicit user approval first.
5. At session end: update `docs/PROJECT_STATE.md` (and add ADRs for new decisions).

## Roles

- **User (PandiCK)** — final approver. Approves designs, diffs, and scope; runs Codex; executes ALL git write operations (add/commit/reset/push) in PowerShell using command blocks prepared by Claude. Decides budget trade-offs.
- **Claude (planner)** — plans, scopes, writes task specs + English Codex prompts, reviews Codex diffs, drives Figma, audits against LCK rules, prepares exact PowerShell git blocks for the user. Does NOT write production code unless the user approves an explicit escalation ("this part needs me, scope is X files / ~Y lines").
- **Codex (implementer)** — implements one task spec (`docs/tasks/T-*.md`) per run, then stops for human review.
- **Figma (design surface)** — file `BanPick-UI` (key `7mlbl2myYHrTrHj7c4HYhJ`), operated by Claude via MCP.

## Hard guardrails — never violate

- Overlay routes are **read-only**: no mutation controls, no mutation REST calls, no mutation socket emits (server also rejects; keep both layers).
- No runtime Riot API / Data Dragon CDN / LCU / internet dependency. Local assets only.
- No auto-pick / auto-ban / player-side automation. Manual-first.
- Do not modify passed core (draft engine, timer, final lineup) unless an ADR documents a confirmed bug. Read `docs/decisions/ADR-003` before touching anything timer-related.
- Draft core stays game-agnostic; LoL specifics live in `games/lol` + adapter/presentation layers.
- No third-party code/assets/branding without explicit license review (see reference-driven policy in `docs/`).

## Working rules

- Discussion with the user: **Cantonese**. All Codex prompts: **English**.
- **git write operations (add/commit/reset/push): user's machine ONLY.** Hard lesson 2026-07-05: an AI sandbox mount zero-corrupted `.git/index` mid-commit, producing an empty-tree commit (recovered via `git reset --mixed`; see ADR-006). AI sessions may run read-only git (log/status/diff) for reconnaissance but must treat results with suspicion and must NEVER write to `.git` through a mounted filesystem. Claude prepares the exact PowerShell block; the user executes and pastes output back. Codex never commits. Never use `git add .` — always scoped paths.
- After each Codex task: STOP. User manually checks UI/workflow before deciding to commit.
- Never commit runtime logs, patch files, or rejected WIP.
- Overlay visuals follow the design-first pipeline (`docs/decisions/ADR-005`): approved design artifact → locked implementation prompt. No freeform visual prompts, ever.

## Map

| What | Where |
|---|---|
| Live project state + queue | `docs/PROJECT_STATE.md` |
| Decision records (read before proposing changes) | `docs/decisions/ADR-*.md` |
| Task specs + Codex prompts | `docs/tasks/T-*.md` |
| Codex prompt template | `docs/templates/CODEX_TASK_PROMPT_TEMPLATE.md` |
| Overlay design specs | `docs/design/` |
| Codex conventions + full guardrails | `AGENTS.md` |
| Historical handoffs (archive, don't extend) | `docs/handoffs/archive/` |
