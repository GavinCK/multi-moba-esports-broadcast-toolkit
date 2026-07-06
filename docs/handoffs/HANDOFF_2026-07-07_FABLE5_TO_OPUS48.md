# Succession Handoff: Claude Fable 5 → Claude Opus 4.8

Date: 2026-07-07 · Author: outgoing planner (Fable 5) · Approved plan owner: PandiCK

## 0. Prime directive for the incoming planner

**The plan is set and working. Your job is execution of the existing queue, not re-planning.**

Do not re-architect. Do not expand scope. Do not redesign the overlay. Do not touch frozen modules. Do not reopen settled decisions (ADRs are binding). Any scope change requires the user's explicit approval first. Post-MVP items stay parked until all six MVP acceptance items pass. The previous era of this project failed by expanding sideways; the current era succeeds by finishing narrow.

## 1. Mandatory read order (before any work)

1. `CLAUDE.md` (repo root — auto-loaded in Cowork; roles, hard guardrails, working rules)
2. `docs/PROJECT_STATE.md` (live state, MVP checklist, queue — the single source of truth)
3. `docs/decisions/ADR-001..006` (settled decisions — cite them, never relitigate silently)
4. The in-flight task spec under `docs/tasks/` (see §3)
5. When overlay work is involved: `docs/design/LOL_DRAFT_OVERLAY_APPROVED_DESIGN_SPEC.md` (binding pixel/token/state spec)

## 2. Team model (proven over T-001/T-002, keep exactly)

- **User (PandiCK)** — final approver. Runs Codex. Executes ALL git write operations from PowerShell blocks you prepare. Discussion in **Cantonese**; every Codex prompt in **English**.
- **You (planner)** — scope, specs, English Codex prompts, diff review, Figma, LCK-rules audit, PowerShell blocks. You write production code ONLY after the user approves an explicit escalation with stated scope.
- **Codex (implementer)** — one `docs/tasks/T-*.md` per run, then stops. It will pause on dirty trees (by design — AGENTS.md); have the user commit planner-doc changes, then reply confirming a clean tree.
- **Figma** — file `BanPick-UI` key `7mlbl2myYHrTrHj7c4HYhJ`; approved design lives on page `02_Design` (node 41:2, frames F1/F2/F3 + ICON_WORKBENCH). Design changes go to Figma + spec doc first (ADR-005); freeform visual prompts to Codex are banned.

**Per-task rhythm:** Codex runs task → STOP → you review the ACTUAL FILES (Read/Grep on the repo — not sandbox git diff) against the task doc's review checklist → fill the checklist → give the user (a) manual acceptance steps, (b) a scoped commit block that INCLUDES the task doc itself (forgetting it causes Codex dirty-tree pauses — happened twice) → user verifies, commits, pastes output → next task.

## 3. Exact position as of handoff

Committed (local, main): governance layer `eebba12` → pixel spec `5f3c858`(earlier) → T-001 crash recovery `fac2015` → T-002 no-ban path → checklist docs. Remote `origin/main` is behind; pushing is the user's call.

- **T-001 (crash recovery): DONE.** Snapshots at `event-packages/*/runtime/`, restore→PAUSED, `.stale` handling, `restoredFromSnapshot` health flag. Review notes in the task doc.
- **T-002 (no-ban): DONE.** `skipDraftAction` additive in core-draft, per-action skip endpoint, operator "No Ban" + confirm, overlay renders skipped ban empty with zero text.
- **T-003 (overlay visual implementation): IN FLIGHT in Codex at handoff time.** Expect a report + dirty overlay files. Review against the design spec §everything, using the T-003 checklist (banned-strings grep, fallbacks, transparency, no core/server changes). If Codex reported a spec-vs-code conflict, adjudicate with the user before anything else.
- **T-004 (asset prep script): queued after T-003.** User-machine script downloads 172 splashes + 5 official position SVGs (org holds Riot licensing; runtime stays offline).
- **Then:** full rehearsal (operator → producer → overlay → OBS/vMix) → tick the six MVP acceptance items in PROJECT_STATE → only then discuss post-MVP.

## 4. Settled domain decisions (cite, don't reopen)

- **Double-pick turns share ONE ~30s window — the engine's `count: 2` model is CORRECT.** Verified against the official client; the user personally caught an earlier wrong "fix" proposal. Never split phases or add per-pick timers (ADR-003).
- LCK mirrored role order: outer→inner = SUP BOT MID JGL TOP | TOP JGL MID BOT SUP; TOP slots flank the center block (design spec §4).
- Fearless Draft + 2026 First Selection are post-MVP; the approved design already reserves the fearless row and the bidirectional 1ST PICK indicator (ADR-004).
- Timer expiry never auto-acts; No-Ban is a manual operator action only.
- Overlay routes are read-only at BOTH client and server layers; T-001's restore path force-resets `overlaySafety.readOnly` — keep that property in any future change.

## 5. Hard-won environment lessons (believe them, don't rediscover)

- **Never execute git write operations (add/commit/reset/push) from the AI sandbox.** The mounted filesystem zero-fill-corrupted `.git/index` mid-commit on 2026-07-05, creating an empty-tree commit (recovered; full story in ADR-006). The 2026-06-04 overlay "WIP corruption" shares the same signature (ADR-002). Read-only git is allowed for recon but treat results with suspicion; the RELIABLE channel is native file tools (Read/Grep/Write/Edit).
- Sandbox web_fetch strips SVG/XML bodies; the Figma plugin has no `fetch` and its image API is domain-allowlisted. Official Riot assets therefore arrive ONLY via the T-004 script run on the user's machine.
- User's machine: `pnpm.cmd`; fresh installs may need `--ignore-scripts` (pnpm v11 esbuild approval prompt); `pnpm.cmd verify` = lint+typecheck+test+build.
- Codex occasionally has a parallel-run test flake; a rerun that passes is acceptable, note it in review.

## 6. Session-end ritual (non-negotiable)

Update `docs/PROJECT_STATE.md` (position, queue, dates), add/update ADRs for any new decision, fill task-doc checklists, and prepare the user's commit block for those docs. That ritual is what makes YOUR successor's cold start cheap too.

## 7. Opening message for the user to paste to Opus 4.8 (Cantonese)

```text
你係呢個 project 嘅新任 planner(接替上一手)。開工前先讀:
1. CLAUDE.md(你應該已自動載入咗)
2. docs/handoffs/HANDOFF_2026-07-07_FABLE5_TO_OPUS48.md(交接文件,含 prime directive)
3. docs/PROJECT_STATE.md(現況同隊列)

規則:計劃已定,你係執行者,唔好重新規劃、唔好擴 scope、ADR 唔准翻案。
我哋用廣東話傾,Codex prompt 用英文,git 寫入操作全部由我做(你準備 PowerShell block)。
而家 T-003 喺 Codex 跑緊/啱跑完 — 你第一件事係按 docs/tasks/T-003 嘅 checklist review 佢份 report 同 diff。
```
