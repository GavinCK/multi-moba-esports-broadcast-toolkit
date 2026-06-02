# Local LAN Deployment and Browser Source Guide

## 1. Purpose

This guide documents the v0.1 local LAN deployment shape for the Multi-MOBA Esports Broadcast Toolkit.

It explains how to run the local server, open the Admin Dashboard, Draft Operator Panel, Producer Panel, Caster Panel, and configure OBS/vMix browser-source overlay URLs from machines on a private production LAN.

This is a planning and operations guide. It does not claim that OBS, vMix, two-device LAN operation, or offline rehearsal has passed. Actual two-device LAN rehearsal is performed in TQ-131.

## 2. v0.1 Deployment Principles

- Run the system local-first on a private production LAN.
- Keep manual operation as the core workflow.
- Run the server on the control laptop or mini PC.
- Use local JSON event packages and local assets.
- Use Socket.IO realtime sync over local HTTP/WebSocket routes.
- Use browser-source URLs for OBS/vMix output.
- Keep overlay routes read-only.
- OBS WebSocket is not required for v0.1.
- vMix API is not required for v0.1.
- Cloud sync, internet access, external databases, login/auth, official game APIs, player PC software, auto-pick, and auto-ban are not part of the v0.1 live workflow.

## 3. Recommended LAN Roles and Machines

| Machine / Role | Recommended responsibility |
|---|---|
| Control laptop / mini PC | Runs the Node server, loads the event package, owns Socket.IO state, writes audit JSONL, and may also run dashboard/overlay dev apps during v0.1. |
| Graphics PC / OBS or vMix machine | Opens overlay browser-source URLs such as Program, Preview, Draft, Score Bug, and Emergency. |
| Draft operator laptop | Opens the Draft Operator Panel and performs manual draft actions. |
| Producer laptop | Opens the Producer Panel and controls production state, Preview, Take, Clear, and Emergency. |
| Caster tablet/laptop | Opens the read-only Caster Panel for public-safe match and draft context. |

Recommended topology:

```text
Private LAN switch/router
├─ Control machine: server + local event package
├─ Graphics PC: OBS/vMix browser sources
├─ Draft operator laptop
├─ Producer laptop
└─ Caster tablet/laptop
```

All devices should remain on the same production LAN or an intentionally routed VLAN. Disconnecting WAN/internet should not disconnect the local LAN.

## 4. Default Local Development Ports

Current repository defaults:

| Component | Default local URL | Notes |
|---|---|---|
| Server | `http://127.0.0.1:3000` | API and Socket.IO runtime. Server host defaults to `127.0.0.1`; use a LAN-reachable host binding for other devices during rehearsal. |
| Admin Dashboard Vite app | `http://127.0.0.1:5173` | Dashboard, Draft, Producer, and Caster routes. Proxies `/api` and `/socket.io` to the server. |
| Overlay Vite app | `http://127.0.0.1:5174` | OBS/vMix browser-source routes. Proxies `/api` and `/socket.io` to the server. |

The checked-in Vite dev scripts are local development defaults. For other LAN devices to reach these apps, confirm during rehearsal that the server, dashboard app, and overlay app are bound to a LAN-reachable interface and that local firewall rules allow the selected ports.

Useful startup commands:

```bash
pnpm install
pnpm verify
pnpm --filter @mmbt/server dev
pnpm --filter @mmbt/admin-dashboard dev
pnpm --filter @mmbt/overlay dev
```

For LAN access, record the exact host binding and ports used during rehearsal. For the server, the current implementation reads `HOST` and `PORT` from the environment; for example, a control machine may bind the server to a LAN-reachable interface during rehearsal. Confirm the exact command in the local shell before show day.

## 5. Replacing localhost with LAN IP

Use `127.0.0.1` or `localhost` only on the same machine that is running the process.

For any other device, replace `127.0.0.1` with the control machine LAN IP.

Example control machine LAN IP:

```text
192.168.0.50
```

Examples:

```text
Server health:
http://192.168.0.50:3000/api/health

Admin Dashboard:
http://192.168.0.50:5173/admin

Draft Operator Panel:
http://192.168.0.50:5173/draft/match_grand-final

Producer Panel:
http://192.168.0.50:5173/producer/match_grand-final

Caster Panel:
http://192.168.0.50:5173/caster/match_grand-final

Draft browser source:
http://192.168.0.50:5174/overlay/draft/match_grand-final
```

The IP and ports above are examples. Actual IPs, ports, host binding, and firewall rules must be confirmed during rehearsal.

## 6. Admin and Role Panel URLs

Use the Admin Dashboard Vite app host for these routes in v0.1.

Local examples:

```text
http://127.0.0.1:5173/admin
http://127.0.0.1:5173/admin/system-health
http://127.0.0.1:5173/admin/matches
http://127.0.0.1:5173/admin/teams
http://127.0.0.1:5173/admin/players
http://127.0.0.1:5173/admin/sponsors
http://127.0.0.1:5173/admin/themes
```

LAN examples:

```text
http://192.168.0.50:5173/admin
http://192.168.0.50:5173/admin/system-health
http://192.168.0.50:5173/admin/matches
http://192.168.0.50:5173/admin/teams
http://192.168.0.50:5173/admin/players
http://192.168.0.50:5173/admin/sponsors
http://192.168.0.50:5173/admin/themes
```

Role panel route patterns:

```text
/draft
/draft/:matchId
/producer
/producer/:matchId
/caster
/caster/:matchId
```

Role panel LAN examples:

```text
http://192.168.0.50:5173/draft
http://192.168.0.50:5173/draft/match_grand-final
http://192.168.0.50:5173/producer
http://192.168.0.50:5173/producer/match_grand-final
http://192.168.0.50:5173/caster
http://192.168.0.50:5173/caster/match_grand-final
```

## 7. Browser Source Overlay URLs

Use the Overlay Vite app host for OBS/vMix browser sources in v0.1.

Required overlay route patterns:

```text
/overlay/draft/:matchId
/overlay/scorebug/:matchId
/overlay/preview
/overlay/program
/overlay/emergency
```

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

Use debug variants for rehearsal and troubleshooting only. Standard OBS/vMix Program sources should normally use the non-debug URL.

## 8. OBS/vMix Browser Source Setup

Recommended browser-source settings:

| Setting | Value |
|---|---|
| Width | `1920` |
| Height | `1080` |
| URL | Use the overlay URL only. |
| Custom CSS | Not required. |
| Background | Transparent where supported by the route and host app. |
| Refresh on scene activation | Optional; confirm during rehearsal. |

OBS WebSocket is not required for Preview, Program, Draft, Score Bug, or Emergency browser-source output in v0.1.

vMix API is not required for Preview, Program, Draft, Score Bug, or Emergency browser-source output in v0.1.

Companion and Stream Deck integrations are not required for v0.1 browser-source operation.

## 9. Firewall and Network Checklist

Before rehearsal, confirm:

- The control machine LAN IP is known and recorded.
- The server HTTP port is reachable from role machines and graphics machines.
- The dashboard Vite port is reachable if role panels are opened from other devices.
- The overlay Vite port is reachable if OBS/vMix browser sources are opened from another device.
- Socket.IO is reachable through the server or through the dashboard/overlay dev proxy as implemented.
- Local firewall rules allow the selected TCP ports.
- No public DNS, cloud tunnel, or WAN route is needed for the required v0.1 workflow.
- All machines are using the same intended LAN or routed VLAN.

Common ports to check:

```text
3000  server HTTP + Socket.IO
5173  Admin Dashboard Vite app, if used
5174  Overlay Vite app, if used
```

If a route works on the control machine but not from another device, check host binding first, then firewall, then LAN/VLAN routing, then whether the URL still contains `127.0.0.1` or `localhost`.

## 10. Offline Operation Checklist

Before show day:

- Install dependencies while internet is available.
- Run `pnpm verify` before the show.
- Confirm the local event package is present.
- Confirm local assets and fallbacks are present.
- Confirm no required asset path points to a remote URL.
- Confirm the LAN switch/router remains powered and connected.

During offline rehearsal:

- Disconnect WAN/internet only.
- Keep the local LAN connected.
- Keep the control machine, graphics PC, role panels, and browser sources on the LAN.
- Confirm dashboard routes still load.
- Confirm overlay routes still load.
- Confirm Socket.IO updates still propagate locally.
- Confirm local assets still render.
- Confirm audit logging still writes to local JSONL when actions are performed.

This guide does not claim offline rehearsal passed. TQ-131 performs and records the actual offline/two-device LAN rehearsal.

## 11. Emergency Overlay Usage

Emergency mode is controlled from the Producer Panel, not from an overlay route.

Expected usage:

- Producer triggers emergency from `/producer` or `/producer/:matchId`.
- `/overlay/emergency` is the dedicated emergency browser source.
- `/overlay/program` may show the emergency override when emergency is active.
- `/overlay/draft/:matchId` and `/overlay/scorebug/:matchId` remain direct overlay routes unless production state explicitly routes a different payload.
- Emergency overlay output must not depend on a missing match, missing draft, missing hero asset, missing team logo, or missing sponsor logo.

Use public-safe emergency messages such as:

```text
Technical Pause
Broadcast will resume shortly
Stand by
```

Do not place private operator notes, stack traces, passwords, dispute details, or hidden competitive information on emergency output.

## 12. Health Dashboard Verification

Open:

```text
http://127.0.0.1:5173/admin/system-health
```

or the LAN equivalent:

```text
http://192.168.0.50:5173/admin/system-health
```

Use the health dashboard to confirm:

- Server status and uptime.
- Realtime connection state.
- Connected Admin, Draft, Producer, Caster, and Overlay clients where available.
- Loaded event package.
- Adapter status and hero counts.
- Asset warnings and missing assets.
- Current production state.
- Emergency ready/active status.
- Audit log writability, path, and safe error summary.
- Last state update and state revision.

The health dashboard is the pre-show readiness view. It should be opened before the operator panels are trusted for live work.

## 13. Pre-show Startup Sequence

1. Connect all machines to the intended local LAN.
2. Record the control machine LAN IP.
3. Install dependencies if not already installed:

```bash
pnpm install
```

4. Run docs/code verification before show:

```bash
pnpm verify
```

5. Start the server on the control machine and confirm the selected host/port.
6. Start the Admin Dashboard app if using the v0.1 separate Vite app.
7. Start the Overlay app if using the v0.1 separate Vite app.
8. Open `/admin/system-health`.
9. Open `/admin`, `/admin/matches`, `/admin/teams`, `/admin/players`, `/admin/sponsors`, and `/admin/themes`.
10. Open `/draft/:matchId`, `/producer/:matchId`, and `/caster/:matchId`.
11. Open overlay routes for Draft, Score Bug, Preview, Program, and Emergency.
12. Confirm connected client presence in health.
13. Confirm adapter, asset, production, emergency, realtime, and audit log status.
14. Confirm no unexpected sample log pollution before show. If using `event-packages/sample-event`, review `event-packages/sample-event/logs` and avoid starting live work with unexpected `production-log.jsonl` content.
15. Confirm OBS/vMix browser sources use `1920x1080` and the intended LAN URLs.
16. Confirm debug overlays are not used for Program output unless intentionally rehearsing diagnostics.

## 14. Shutdown / Post-show Notes

After rehearsal or show:

- Record exact IPs, ports, and URLs used.
- Record which routes were tested.
- Record whether OBS, vMix, browser-only, two-device LAN, and offline checks were actually performed.
- Parse audit JSONL if a production log was created.
- Archive or copy show logs before clearing or preparing a new rehearsal package.
- Record any failures, stale routes, missing assets, firewall issues, or reconnect issues.
- Do not delete audit logs to hide rehearsal failures.

Suggested audit JSONL parse command when `production-log.jsonl` exists:

```bash
node -e "const fs=require('fs'); const p='event-packages/sample-event/logs/production-log.jsonl'; if(fs.existsSync(p)){ for(const line of fs.readFileSync(p,'utf8').split(/\n/).filter(Boolean)) JSON.parse(line); console.log('audit-log-jsonl-ok'); } else { console.log('audit-log-not-found'); }"
```

## 15. Known Limitations

- This guide is documentation-only and does not perform a live LAN rehearsal.
- TQ-131 is where actual two-device LAN rehearsal is performed.
- This guide does not claim OBS rehearsal passed.
- This guide does not claim vMix rehearsal passed.
- This guide does not claim offline rehearsal passed.
- The default local dev URLs use `127.0.0.1`; other devices need LAN-reachable host binding and firewall access confirmed during rehearsal.
- v0.1 may run dashboard and overlay as separate local Vite dev apps.
- v0.1 does not require OBS WebSocket, vMix API, cloud sync, internet, external database, login/auth, official game APIs, player PC software, auto-pick, or auto-ban.
- LoL LCU, LoL Data Dragon automatic sync, and LoL in-game HUD remain future plugin scope.

## 16. Handoff Checklist for TQ-131

Record the following before starting TQ-131:

- Control machine LAN IP.
- Server URL and port.
- Dashboard URL and port.
- Overlay URL and port.
- Host binding used for each running process.
- Firewall ports opened.
- Match ID used for route testing.
- Admin routes opened.
- Draft, Producer, and Caster routes opened.
- Overlay routes opened.
- Debug overlay routes tested.
- OBS/vMix/browser-only mode used.
- Whether WAN/internet was disconnected while LAN stayed connected.
- Health dashboard client list result.
- Asset warning result.
- Emergency overlay result.
- Program/Preview result.
- Audit log path and parse result if a JSONL log exists.
- Any failures requiring follow-up before v0.1 release validation.
