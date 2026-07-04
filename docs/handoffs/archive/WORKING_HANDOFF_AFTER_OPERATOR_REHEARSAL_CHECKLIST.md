# Working Handoff — After Completing `docs/OPERATOR_REHEARSAL_CHECKLIST.md`

## Current Task Completed

Created the next harness documentation file:

```text
docs/OPERATOR_REHEARSAL_CHECKLIST.md
```

This was a documentation / rehearsal harness planning task only.

No application code was written. No test fixtures were generated. The Technical Spec, `AGENTS.md`, `docs/ACCEPTANCE_CRITERIA.md`, `docs/TASK_QUEUE.md`, `docs/BAN_PICK_RULES.md`, `docs/API_SOCKET_CONTRACT.md`, `docs/EVENT_PACKAGE_SPEC.md`, and `docs/OVERLAY_SPEC.md` were not modified.

No actual rehearsal was executed. The checklist is intended for a future implementation/rehearsal task.

---

## Source Documents Used

The new Operator Rehearsal Checklist harness was based on:

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
docs/BAN_PICK_RULES.md
docs/API_SOCKET_CONTRACT.md
docs/EVENT_PACKAGE_SPEC.md
docs/OVERLAY_SPEC.md
WORKING_HANDOFF_AFTER_OVERLAY_SPEC.md
```

The following locked principles were preserved:

```text
Universal Ban/Pick must be game-agnostic.
LoL In-game HUD must remain a future plugin.
Production Control must sit above both Universal Draft and game-specific plugins.
v0.1 must be local-first, manual-first, and production-safe.
Overlay routes must be read-only.
No player-side automation.
No auto-pick.
No auto-ban.
No hidden competitive information exposure.
System must not require internet or cloud assets.
System must not require OBS WebSocket or vMix API.
System must not require LCU, Data Dragon automatic sync, game client reader, player PC software, SQLite, cloud sync, or user login.
```

---

## What Was Completed

Created:

```text
docs/OPERATOR_REHEARSAL_CHECKLIST.md
```

The document defines a repeatable end-to-end v0.1 rehearsal process for:

```text
Technical Director
Producer
Draft Operator
Graphics Operator
Caster / read-only reviewer
OBS/vMix operator
Codex / AI QA or release validation agent
```

It is designed to support task queue items such as:

```text
TQ-130 — Create Operator Rehearsal Checklist
TQ-131 — Perform Full Local Manual Rehearsal
TQ-140 — Final v0.1 Release Validation and Handoff
```

Task IDs should be verified against the latest `docs/TASK_QUEUE.md` before execution because numbering may evolve.

---

## What `docs/OPERATOR_REHEARSAL_CHECKLIST.md` Covers

The file covers:

```text
Document purpose
Source documents
Non-negotiable v0.1 principles
Rehearsal status / not executed warning
Rehearsal purpose and scope
Roles and stations
Pre-rehearsal setup
Local LAN assumptions
Required machines and browser windows
Automated verification preconditions
Static scope guardrail checks
Server startup checklist
Admin dashboard checklist
Draft operator checklist
Producer panel checklist
Caster/read-only panel checklist
OBS/vMix browser-source checklist
Overlay route checklist
Sample event loading checklist
Full manual draft rehearsal steps
Hover / lock / timer / pause / resume / undo / reset / complete checks
Preview / Program take-clear checks
Emergency trigger-clear checks
Socket.IO reconnect checks
Browser-source refresh checks
Missing asset fallback checks
Theme/sponsor checks
Health dashboard checks
Audit log checks
Offline/no-internet checks
Failure handling and rollback notes
Pass/fail criteria
Handoff format after rehearsal
Out-of-scope guardrails
Final operator checklist summary
```

---

## Key Decisions Locked in `docs/OPERATOR_REHEARSAL_CHECKLIST.md`

### 1. Rehearsal Checklist Is Not a Rehearsal Result

The document explicitly states that the checklist is:

```text
NOT EXECUTED
```

until a real human operator or future AI agent actually runs the implemented system.

Future agents must not claim:

```text
passed
validated
confirmed in OBS
confirmed in vMix
confirmed offline
```

unless they actually executed those steps.

### 2. Minimum Roles and Stations Are Defined

Minimum roles:

```text
Technical Director / Admin
Draft Operator
Producer
Graphics Operator
Caster / Read-only Reviewer
OBS/vMix Operator
```

Minimum stations:

```text
Server / Control Machine
Admin Dashboard Browser
Draft Operator Browser
Producer / Graphics Browser
Caster / Read-only Browser
OBS/vMix Machine or Browser-source-style Browser Window
```

One person may combine roles, but the rehearsal handoff must record which roles were combined.

### 3. Local LAN and Offline Assumptions Are Explicit

The checklist defines the expected local production LAN shape:

```text
server machine
admin/draft/producer/caster browsers
OBS/vMix machine
local LAN switch/router
no internet
```

The offline test must disconnect WAN/internet only, while keeping local LAN active.

Required behavior:

```text
local HTTP routes continue loading
Socket.IO updates continue on LAN
local assets continue rendering
draft and production controls keep working
audit log keeps writing
```

### 4. Automated Verification Is a Precondition, Not a Substitute

The checklist tells future agents to run, where available:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify
```

Optional:

```bash
pnpm test:e2e
pnpm test:guardrails
pnpm test:visual
```

If commands are unavailable, the agent must record them as unavailable rather than claiming pass.

### 5. Static Guardrail Checks Are Included

The checklist includes static searches to detect:

```text
LoL-first leakage into universal core
overlay mutation calls
active OBS WebSocket / vMix / SQLite / Prisma / cloud / LCU / Data Dragon runtime dependencies
```

Matches must be reviewed and accepted only if they are documentation, comments, or non-executed guardrail tests.

### 6. Full Manual Draft Rehearsal Is Step-Based

The checklist covers:

```text
Draft start
Hover
Lock ban
Lock pick
Phase count > 1
Timer expiry
Pause
Resume
Undo
Reset
Complete
```

Important locked behavior:

```text
Hover is not lock.
Timer expiry does not auto-pick or auto-ban.
count > 1 phase does not advance until all slots complete.
Undo must rollback the latest reversible locked action safely.
Reset requires confirmation and must not delete audit logs.
Complete requires deliberate action and must not infer winner.
```

### 7. Preview / Program Must Stay State-Separated

The checklist verifies:

```text
Preview payload appears on /overlay/preview.
Program does not show Preview until Take.
Take is deliberate.
Clear Program is deliberate.
Overlay routes do not perform Take/Clear.
No OBS WebSocket/vMix API is required.
```

### 8. Emergency Must Be Public-Safe and Asset-Independent

Emergency rehearsal requires:

```text
emergency trigger from Producer/Admin only
confirmation required
public-safe message
/overlay/emergency displays full-screen emergency
/overlay/program honors emergency override if documented
health dashboard shows emergency active
audit log records trigger/clear
emergency renders even if normal draft/theme/sponsor assets are missing
```

Emergency overlay must not display:

```text
private network passwords
internal panic notes
legal disputes
medical details
player-client hidden state
technical stack traces
operator blame
```

### 9. Overlay Routes Remain Read-Only During Rehearsal

The checklist confirms each overlay route has no mutation controls, including:

```text
/overlay/draft/:matchId
/overlay/scorebug/:matchId
/overlay/preview
/overlay/program
/overlay/emergency
```

Browser-source refresh must not:

```text
start draft
hover
lock
undo
reset
complete
take
clear
trigger emergency
write audit log directly
```

### 10. Pass/Fail Criteria Are Release-Oriented

The checklist defines global pass criteria and blocker fail criteria.

Blockers include:

```text
System requires internet/cloud.
System requires OBS WebSocket/vMix API for Preview/Program.
System requires player-side software.
System performs auto-pick or auto-ban.
Timer expiry auto-locks a hero.
Universal draft core is LoL-first.
Overlay route can mutate live state.
Overlay exposes hidden competitive information.
Full manual draft cannot complete.
Emergency overlay cannot display.
Socket reconnect cannot recover current state.
Browser-source refresh causes mutation or stale on-air state.
Important live actions are not logged.
Audit log is not append-only or not parseable.
Missing optional asset crashes overlay.
Health dashboard cannot show critical failures.
```

---

## How It Supports `docs/TASK_QUEUE.md`

### TQ-130 — Create Operator Rehearsal Checklist

This task is now completed by creating:

```text
docs/OPERATOR_REHEARSAL_CHECKLIST.md
```

The checklist includes all required TQ-130 coverage:

```text
Start server
Open admin dashboard
Open draft operator panel
Open producer panel
Open caster panel
Open OBS browser-source-style overlay view
Load sample event
Select active match
Select game adapter
Select ruleset
Start full manual draft
Hover/lock ban and pick
Pause/resume timer
Undo
Complete draft
Draft overlay updates real time
Score bug displays team/score
Preview/Program Take/Clear
Emergency overlay trigger
Browser source refresh and state recovery
Audit log review
Health dashboard review
LAN/offline operation
```

### TQ-131 — Perform Full Local Manual Rehearsal

The new checklist is intended to be executed in TQ-131.

Future agent must:

```text
run the automated verification commands where available
start the implemented system locally
execute each checklist section
record pass/fail honestly
create WORKING_HANDOFF_AFTER_REHEARSAL.md or equivalent
not patch code during rehearsal unless explicitly asked
not hide failures
```

### TQ-140 — Final v0.1 Release Validation and Handoff

The checklist supports final validation by producing a structured rehearsal result that can be reviewed against:

```text
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
docs/OPERATOR_REHEARSAL_CHECKLIST.md
```

---

## Current Harness Documentation Package Status

Completed so far:

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
docs/BAN_PICK_RULES.md
docs/API_SOCKET_CONTRACT.md
docs/EVENT_PACKAGE_SPEC.md
docs/OVERLAY_SPEC.md
docs/OPERATOR_REHEARSAL_CHECKLIST.md
WORKING_HANDOFF_AFTER_ACCEPTANCE_CRITERIA.md
WORKING_HANDOFF_AFTER_TASK_QUEUE.md
WORKING_HANDOFF_AFTER_BAN_PICK_RULES.md
WORKING_HANDOFF_AFTER_API_SOCKET_CONTRACT.md
WORKING_HANDOFF_AFTER_EVENT_PACKAGE_SPEC.md
WORKING_HANDOFF_AFTER_OVERLAY_SPEC.md
WORKING_HANDOFF_AFTER_OPERATOR_REHEARSAL_CHECKLIST.md
```

The harness package now has enough detail for a future implementation/rehearsal agent to validate:

```text
universal draft behavior
server REST API behavior
Socket.IO realtime behavior
local event package loading
audit log behavior
health dashboard behavior
admin/draft/producer/caster panels
OBS/vMix browser-source overlay routes
Program/Preview separation
emergency behavior
offline local LAN operation
out-of-scope guardrails
```

without making the system LoL-first or adding unsafe automation.

---

## Recommended Next Step

Recommended next task depends on project phase.

If implementation is not complete yet:

```text
Continue implementation tasks in docs/TASK_QUEUE.md in order.
```

If v0.1 implementation is complete enough to rehearse:

```text
TQ-131 — Perform Full Local Manual Rehearsal
```

Recommended output after TQ-131:

```text
WORKING_HANDOFF_AFTER_REHEARSAL.md
```

That future handoff should record:

```text
PASS / FAIL / CONDITIONAL PASS
commands run
routes tested
manual checklist results
offline test result
audit log review
health review
issues found
blockers
recommended fix tasks
```

---

## Next AI Must Read

The next AI must read:

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
docs/BAN_PICK_RULES.md
docs/API_SOCKET_CONTRACT.md
docs/EVENT_PACKAGE_SPEC.md
docs/OVERLAY_SPEC.md
docs/OPERATOR_REHEARSAL_CHECKLIST.md
WORKING_HANDOFF_AFTER_OPERATOR_REHEARSAL_CHECKLIST.md
```

If the next task is actual rehearsal, it should also read:

```text
docs/operator-guide.md
docs/deployment-guide.md
README.md
```

if those files exist.

---

## Next AI Must Not Do

The next AI must not:

```text
Claim a rehearsal passed unless it was actually executed.
Write application code during a docs-only/rehearsal-report task unless explicitly asked.
Generate new fixtures unless explicitly asked.
Modify AGENTS.md.
Modify the Technical Spec.
Modify ACCEPTANCE_CRITERIA.md.
Modify TASK_QUEUE.md.
Modify BAN_PICK_RULES.md.
Modify API_SOCKET_CONTRACT.md.
Modify EVENT_PACKAGE_SPEC.md.
Modify OVERLAY_SPEC.md.
Add LoL LCU reader.
Add LoL champion select auto-sync.
Add Data Dragon automatic sync.
Add LoL in-game HUD.
Add OBS WebSocket/vMix API dependency.
Add Companion / Stream Deck dependency.
Add SQLite / Prisma dependency.
Add cloud sync.
Add user login as required runtime dependency.
Add player-side automation.
Add auto-pick.
Add auto-ban.
Expose hidden competitive information.
Use remote assets/CDN as required fallback.
Hide failed rehearsal items.
```

---

## Copy Prompt for the Next AI Agent

```text
我正在建立一套「Multi-MOBA Esports Broadcast Toolkit」的 AI Agent harness documentation package / implementation validation workflow。

請先閱讀我上傳或 repo 內已有的文件，特別是：

1. AGENTS.md
2. Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
3. IMPLEMENTATION_PROMPT_FOR_CODEX.md
4. docs/ACCEPTANCE_CRITERIA.md
5. docs/TASK_QUEUE.md
6. docs/BAN_PICK_RULES.md
7. docs/API_SOCKET_CONTRACT.md
8. docs/EVENT_PACKAGE_SPEC.md
9. docs/OVERLAY_SPEC.md
10. docs/OPERATOR_REHEARSAL_CHECKLIST.md
11. WORKING_HANDOFF_AFTER_OPERATOR_REHEARSAL_CHECKLIST.md

今次任務目標：

請根據 docs/OPERATOR_REHEARSAL_CHECKLIST.md 準備或執行下一步工作。

如果 repo implementation 已經存在並可運行，請執行：

TQ-131 — Perform Full Local Manual Rehearsal

並根據 checklist 逐項記錄結果，最後生成：

WORKING_HANDOFF_AFTER_REHEARSAL.md

如果 repo implementation 尚未完成，請不要假裝已經跑過 rehearsal；請改為根據 docs/TASK_QUEUE.md 建議下一個最合適的 implementation task。

必須保留 project 核心原則：

- Universal Ban/Pick must be game-agnostic
- LoL In-game HUD must remain a future plugin
- Production Control must sit above both Universal Draft and game-specific plugins
- v0.1 must be local-first, manual-first, production-safe
- Overlay routes must be read-only
- No player-side automation
- No auto-pick
- No auto-ban
- No hidden competitive information exposure
- System must not require internet or cloud assets
- System must not require OBS WebSocket or vMix API

如果執行 rehearsal，必須清楚記錄：

- commands run
- routes tested
- machines / browsers used
- server/admin/draft/producer/caster/overlay results
- full manual draft result
- hover / lock / timer / pause / resume / undo / reset / complete result
- Preview / Program Take-Clear result
- emergency trigger-clear result
- Socket.IO reconnect result
- browser-source refresh result
- missing asset fallback result
- theme/sponsor result
- health dashboard result
- audit log result
- offline/no-internet result
- pass/fail criteria
- blockers and recommended fix tasks

不處理範圍：

- 不要加入 LoL LCU reader
- 不要加入 LoL champion select auto-sync
- 不要加入 Data Dragon automatic sync
- 不要加入 LoL in-game HUD
- 不要加入 OBS WebSocket / vMix API / Companion / Stream Deck
- 不要加入 SQLite / cloud sync / user login
- 不要加入 player-side automation
- 不要加入 auto-pick / auto-ban
- 不要用 remote asset / CDN dependency 作為 v0.1 必需條件
- 不要假裝已經實際跑過未執行的 rehearsal

最後請同時生成一段「俾再下一手 AI Agent 的 copy prompt」，讓下一位 AI 可以根據你的 handoff 繼續。
```
