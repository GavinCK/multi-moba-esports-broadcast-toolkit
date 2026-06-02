# Operator Guide

## 1. Purpose

This guide is for Technical Directors, Admins, Draft Operators, Producers, Graphics Operators, and Caster/read-only reviewers running the Multi-MOBA Esports Broadcast Toolkit v0.1 during a local-first manual show.

It is an operator guide, not a developer API guide and not a rehearsal result. It explains how to operate the current v0.1 workflow safely using local server, dashboard, and overlay routes.

v0.1 principles:

- The show runs local-first on a private production LAN.
- Manual operation is the primary workflow.
- Live-output actions must be deliberate and production-safe.
- Universal Ban/Pick stays game-agnostic.
- Overlay routes are read-only browser-source outputs.
- Player-side automation is not part of the system.
- Auto-pick and auto-ban are not part of the system.
- No player PC software is needed for v0.1 operation.

## 2. Roles and Responsibilities

| Role | Main responsibilities |
|---|---|
| Technical Director / Admin | Start local services, confirm event package, inspect match/team/player/sponsor/theme/adapter setup, watch `/admin/system-health`, and pause live-risk actions when health is unsafe. |
| Draft Operator | Run the manual Ban/Pick from `/draft` or `/draft/:matchId`, including start, hover, lock, timer pause/resume, undo, reset, and complete. |
| Producer | Control production state from `/producer` or `/producer/:matchId`, prepare Preview, Take to Program, Clear Program, and trigger or clear Emergency. |
| Graphics Operator | Monitor overlay browser sources, Preview, Program, Emergency, local assets, sponsor slots, and route/debug health. |
| Caster / Read-only reviewer | Use `/caster` or `/caster/:matchId` as a public-safe match and draft reference with no mutation controls. |

Operators may combine roles for a small show, but live-output responsibility should still be clear before rehearsal or broadcast.

## 3. Before the Show

Install dependencies before show day while internet is available:

```bash
pnpm install
```

Run verification before show day:

```bash
pnpm verify
```

Before going live:

- Confirm the local event package is present at `event-packages/sample-event`.
- Confirm local assets and fallbacks are available.
- Confirm all operator machines are on the intended production LAN.
- Record the control machine IP address, ports, and exact URLs used.
- Open `/admin/system-health` and confirm server, realtime, event package, adapters, assets, emergency readiness, connected clients, and audit log status.
- Do not begin live-risk actions if health shows `ERROR`, audit logging is failing, or required clients cannot connect.

## 4. Startup Commands

Start services from the repository root in separate terminals:

```bash
pnpm --filter @mmbt/server dev
pnpm --filter @mmbt/admin-dashboard dev
pnpm --filter @mmbt/overlay dev
```

Current local development defaults:

| Component | Local URL | Purpose |
|---|---|---|
| Server | `http://127.0.0.1:3000` | API and Socket.IO runtime |
| Admin Dashboard | `http://127.0.0.1:5173` | Admin, Draft, Producer, and Caster panels |
| Overlay App | `http://127.0.0.1:5174` | Browser-source overlay routes |

For another LAN device, replace `127.0.0.1` with the control machine LAN IP and confirm host binding plus firewall access. Example:

```text
http://192.168.0.50:5173/admin/system-health
http://192.168.0.50:5174/overlay/program
```

## 5. Admin Setup Checks

Open:

```text
/admin
/admin/system-health
/admin/matches
/admin/teams
/admin/players
/admin/sponsors
/admin/themes
```

Confirm:

- The sample event package is loaded.
- Matches are present and the intended match is visible.
- Blue and red teams are correct.
- Players are present and assigned to the correct teams.
- Sponsors and local sponsor assets are present where expected.
- The intended theme is loaded and any asset warnings are understood.
- Generic MOBA, LoL sample, AOV sample, and HoK sample adapters are available.
- The selected match, current game, game code, and ruleset are correct before draft starts.

If anything is missing or wrong, stop setup work and resolve it before live operation. Do not use overlay routes to fix setup state.

## 6. Draft Operator Workflow

Open:

```text
/draft
/draft/:matchId
```

Use `/draft/:matchId` when the match ID is known, for example:

```text
/draft/match_grand-final
```

Workflow:

1. Select or confirm the match, game, and draft.
2. If no draft exists and the panel supports draft creation for the selected game/ruleset, create the draft deliberately.
3. Confirm draft status, current phase, active team/side, timer, hero pool, blue/red teams, picks, and bans.
4. Start draft.
5. Hover a hero for the active action slot when useful.
6. Lock the hero only after the live selection is final.
7. Pause and resume the timer when needed.
8. Use undo only for the latest reversible locked action and provide the required reason if prompted.
9. Use redo only if the current panel supports it and the action is safe for the live workflow.
10. Reset draft only with confirmation.
11. Complete draft only with confirmation after all required slots are complete, or with explicit override if the implementation supports incomplete completion override.

If duplicate heroes are disabled by the ruleset, a hero already locked as a pick or ban must be rejected by the system. If an action fails, read the operator-safe error message, check draft status, check the current phase, check the active slot, and check duplicate hero rules. Do not bypass a failed action with auto-pick or auto-ban.

## 7. Hover, Lock, Timer, Undo, Reset, Complete

Hover is temporary:

- Hover is an operator preview.
- Hover may appear on overlays.
- Hover is not final.
- Hover should not be treated as a legal pick or ban.

Lock is final:

- Lock is the deliberate final confirmation for the current pick or ban slot.
- Locked heroes should be treated as on-air final state.
- Lock updates the public draft state and should be logged by the server.

Timer operation:

- The timer is operator/server-driven.
- Timer expiry does not auto-pick.
- Timer expiry does not auto-ban.
- Timer expiry does not auto-advance a draft phase by itself.
- Pause freezes the draft timer and should block normal hover/lock actions while paused.
- Resume continues the same phase from the saved remaining time.

Undo, reset, and complete:

- Undo is for correcting the latest reversible action and may require a reason.
- Reset is dangerous and requires confirmation.
- Complete is dangerous and requires confirmation.
- Reset must not delete audit history.
- Complete must not infer a match winner automatically.

## 8. Producer Preview / Program Workflow

Open:

```text
/producer
/producer/:matchId
```

Workflow:

1. Confirm the current match, game, draft, and production state.
2. Prepare the intended graphic in Preview.
3. Confirm `/overlay/preview` shows the expected Preview payload.
4. Take to Program only after deliberate confirmation.
5. Confirm `/overlay/program` shows the Program payload.
6. Clear Program only after deliberate confirmation.
7. Trigger Emergency only with confirmation.
8. Clear Emergency only when it is safe to return to normal output.

Preview / Program rules:

- Preview is safe preparation.
- Take is deliberate.
- Program is live output.
- Program must not show Preview content until Take occurs.
- Overlay routes only observe state; they do not Take, Clear, or trigger Emergency.
- OBS WebSocket is not required for this workflow.
- vMix API is not required for this workflow.

## 9. Emergency Workflow

Use Emergency when live output needs a public-safe cover state, such as a technical pause, missing critical state, unsafe graphics state, or production issue.

Emergency rules:

- Trigger Emergency from Producer/Admin controls, not from an overlay route.
- Use public-safe language such as `Technical Pause`, `Broadcast will resume shortly`, or `Stand by`.
- Do not put private operator notes, raw errors, stack traces, passwords, dispute details, or hidden competitive information on-air.
- `/overlay/emergency` is the dedicated emergency browser source.
- `/overlay/program` honors the emergency override when emergency is active.
- Emergency output must work even if match, draft, team logos, sponsor logos, theme assets, or hero assets are missing.
- Clear Emergency only when the Producer/TD agrees normal output is safe.

## 10. Caster Read-only Workflow

Open:

```text
/caster
/caster/:matchId
```

Use this as a public-safe reference for match title, teams, players, score, current game, draft status, and picks/bans where available.

Caster/read-only rules:

- No mutation controls.
- No draft Start/Pause/Resume/Hover/Lock/Undo/Reset/Complete controls.
- No Preview/Take/Clear/Emergency controls.
- No hidden competitive information.
- No raw audit paths, socket IDs, private emergency reason text, or stack traces.

## 11. Overlay Browser Source URLs

Use the Overlay app host for OBS/vMix browser sources.

Local examples:

```text
http://127.0.0.1:5174/overlay/draft/match_grand-final
http://127.0.0.1:5174/overlay/scorebug/match_grand-final
http://127.0.0.1:5174/overlay/preview
http://127.0.0.1:5174/overlay/program
http://127.0.0.1:5174/overlay/emergency
```

LAN examples:

```text
http://192.168.0.50:5174/overlay/draft/match_grand-final
http://192.168.0.50:5174/overlay/scorebug/match_grand-final
http://192.168.0.50:5174/overlay/preview
http://192.168.0.50:5174/overlay/program
http://192.168.0.50:5174/overlay/emergency
```

Debug variants add `?debug=1`:

```text
http://192.168.0.50:5174/overlay/draft/match_grand-final?debug=1
http://192.168.0.50:5174/overlay/scorebug/match_grand-final?debug=1
http://192.168.0.50:5174/overlay/preview?debug=1
http://192.168.0.50:5174/overlay/program?debug=1
http://192.168.0.50:5174/overlay/emergency?debug=1
```

Use debug variants for rehearsal and troubleshooting. Do not use debug variants as normal Program output unless the TD intentionally wants diagnostics visible.

## 12. Disconnection and Recovery

If an overlay disconnects or looks stale:

1. Check `/admin/system-health`.
2. Confirm the server is still running.
3. Confirm the overlay app is still running.
4. Confirm LAN connectivity and firewall rules.
5. Confirm Socket.IO reachability.
6. Refresh the browser source or overlay browser window.
7. Open the same route with `?debug=1` if diagnostics are needed.
8. Confirm the overlay receives current state after reconnect.

Do not try to control draft, production, or emergency state from an overlay route. Overlay routes are read-only.

If a dashboard or role panel disconnects, wait for reconnect or refresh the page. Treat stale local state as unsafe until the panel shows current server state again.

## 13. Health and Audit Log Warnings

Use `/admin/system-health` as the TD readiness view.

Watch for:

- Server offline or unreachable.
- Realtime disconnected.
- Missing event package.
- Adapter load failure.
- Missing critical assets.
- Emergency not ready.
- Audit log not writable.
- Audit log last error.
- Connected-client gaps for expected Admin, Draft, Producer, Caster, or Overlay clients.

If audit logging is failing, pause live-risk actions until the TD accepts the risk or the issue is resolved. Do not ignore health errors. Do not ignore audit errors.

If a draft action fails:

- Read the safe error message.
- Check whether the draft is `READY`, `LIVE`, `PAUSED`, or `COMPLETE`.
- Check the current phase and active slot.
- Check whether the hero is already locked.
- Check whether the ruleset blocks duplicates.
- Retry only after the state conflict is understood.

## 14. What Not To Do During Live Show

Do not:

- Use overlay routes as controls.
- Rely on internet, cloud services, remote assets, or cloud sync for live operation.
- Require an external database, SQLite, Prisma, login, or auth provider for v0.1 show operation.
- Use LoL LCU, Data Dragon, Riot API, Garena API, Tencent API, TiMi API, or game-client sync as the required v0.1 workflow.
- Install software on player PCs.
- Use player-side automation.
- Expect auto-pick or auto-ban.
- Bypass confirmation prompts for reset, complete, Take, Clear, or Emergency actions.
- Expose private notes, hidden competitive information, raw errors, stack traces, raw socket IDs, or local file paths on-air.
- Commit runtime `production-log.jsonl` files unless the team explicitly intends to archive that log in source control.

## 15. End-of-show Notes

After the show:

- Stop the server, Admin Dashboard app, and Overlay app.
- Preserve audit JSONL logs if they were created.
- Record issues, operator workarounds, missing assets, disconnects, and unsafe states.
- Record route/IP/port values actually used.
- Record whether OBS, vMix, browser-only, two-device LAN, and offline checks were performed.
- Do not delete audit logs to hide a failure.
- Do not commit runtime logs unless explicitly intended.

Known v0.1 limitations:

- OBS WebSocket is not required.
- vMix API is not required.
- Companion and Stream Deck are not required.
- Official game APIs are not required.
- LoL LCU, Data Dragon automatic sync, and LoL in-game HUD are future plugin scope.
- Cloud sync, external database, SQLite, Prisma, login/auth, and remote asset hosting are not part of the required v0.1 workflow.
- This guide does not claim rehearsal passed. TQ-131 performs and records actual full local manual rehearsal.

## 16. Quick Checklist

Before live:

- [ ] `pnpm install` completed before show day.
- [ ] `pnpm verify` passed before show day, or failures are documented and accepted.
- [ ] Server started with `pnpm --filter @mmbt/server dev`.
- [ ] Admin Dashboard started with `pnpm --filter @mmbt/admin-dashboard dev`.
- [ ] Overlay app started with `pnpm --filter @mmbt/overlay dev`.
- [ ] `/admin/system-health` is open.
- [ ] Sample event package, match, teams, players, sponsors, themes, adapters, game, and ruleset are confirmed.
- [ ] Draft Operator route is open.
- [ ] Producer route is open.
- [ ] Caster/read-only route is open if needed.
- [ ] Draft, Score Bug, Preview, Program, and Emergency overlay URLs are loaded.
- [ ] Connected clients appear in health.
- [ ] Audit log status is healthy.
- [ ] Emergency route is ready.

During live:

- [ ] Hover is treated as temporary.
- [ ] Lock is treated as final.
- [ ] Timer expiry does not auto-pick or auto-ban.
- [ ] Reset, Complete, Take, Clear, and Emergency actions are confirmed deliberately.
- [ ] Overlay disconnects are recovered through health checks, LAN/server checks, and browser-source refresh.
- [ ] Health and audit errors are not ignored.

After live:

- [ ] Stop local services.
- [ ] Preserve audit logs if created.
- [ ] Record IPs, ports, routes, and issues.
- [ ] Do not commit runtime logs unless explicitly intended.
