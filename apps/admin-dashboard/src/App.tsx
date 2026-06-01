import type { ReactNode } from "react";

import type {
  DashboardAdapterSummary,
  DashboardDraftSummary,
  DashboardMatch,
  DashboardRuntimeState
} from "./client/types";
import type { DashboardClientState, DashboardSocketStatus } from "./state/dashboardState";
import {
  formatDateTime,
  formatDuration,
  formatTeamName,
  getCurrentContext
} from "./state/selectors";
import { useDashboardState } from "./state/useDashboardState";

export function DashboardApp(): ReactNode {
  const { state, refresh } = useDashboardState();

  return <DashboardView state={state} onRefresh={() => void refresh()} />;
}

export interface DashboardViewProps {
  state: DashboardClientState;
  onRefresh(): void;
}

function StatusPill(props: {
  tone: "good" | "warn" | "danger" | "neutral";
  children: ReactNode;
}): ReactNode {
  return <span className={`status-pill status-pill--${props.tone}`}>{props.children}</span>;
}

function Section(props: { title: string; children: ReactNode }): ReactNode {
  return (
    <section className="dashboard-section" aria-labelledby={`${props.title.replace(/\s+/g, "-").toLowerCase()}-heading`}>
      <h2 id={`${props.title.replace(/\s+/g, "-").toLowerCase()}-heading`}>{props.title}</h2>
      {props.children}
    </section>
  );
}

function Metric(props: { label: string; value: ReactNode }): ReactNode {
  return (
    <div className="metric">
      <dt>{props.label}</dt>
      <dd>{props.value}</dd>
    </div>
  );
}

function getSocketTone(status: DashboardSocketStatus): "good" | "warn" | "danger" | "neutral" {
  switch (status) {
    case "connected":
      return "good";
    case "connecting":
    case "disconnected":
      return "warn";
    case "error":
      return "danger";
    default:
      return "neutral";
  }
}

function ConnectionSummary(props: { state: DashboardClientState }): ReactNode {
  const health = props.state.health;

  return (
    <Section title="Connection">
      <dl className="metric-grid">
        <Metric
          label="Server"
          value={
            health ? (
              <StatusPill tone={health.status === "OK" ? "good" : health.status === "WARN" ? "warn" : "danger"}>
                {health.status}
              </StatusPill>
            ) : (
              <StatusPill tone="neutral">Unknown</StatusPill>
            )
          }
        />
        <Metric
          label="Realtime"
          value={
            <StatusPill tone={getSocketTone(props.state.socketStatus)}>
              {props.state.socketStatus}
            </StatusPill>
          }
        />
        <Metric label="Connected clients" value={health?.socketClients.length ?? 0} />
        <Metric label="Server started" value={formatDateTime(health?.serverStartedAt)} />
        <Metric label="Uptime" value={formatDuration(health?.uptimeSeconds)} />
        <Metric label="Last update" value={formatDateTime(health?.lastStateUpdateAt)} />
      </dl>
      {props.state.socketError ? <p className="inline-error">{props.state.socketError}</p> : null}
    </Section>
  );
}

function EventSummary(props: { snapshot: DashboardRuntimeState | null }): ReactNode {
  const snapshot = props.snapshot;

  return (
    <Section title="Event Package">
      <dl className="metric-grid">
        <Metric label="Event" value={snapshot?.event?.name ?? "Not loaded"} />
        <Metric label="Package" value={snapshot?.eventPackageId ?? "Not loaded"} />
        <Metric label="Status" value={snapshot ? "Loaded" : "Waiting"} />
        <Metric label="Default game" value={snapshot?.eventPackage?.defaults.gameCode ?? "Not reported"} />
        <Metric label="Default theme" value={snapshot?.eventPackage?.defaults.themeId ?? "Not reported"} />
        <Metric label="Available games" value={snapshot?.event?.gameCodes.join(", ") ?? "None"} />
      </dl>
      {snapshot && snapshot.validationWarnings.eventPackage.length > 0 ? (
        <p className="inline-warning">
          {snapshot.validationWarnings.eventPackage.length} event package warning(s) reported.
        </p>
      ) : null}
    </Section>
  );
}

function MatchSummary(props: { snapshot: DashboardRuntimeState | null }): ReactNode {
  const { match, game, blueTeam, redTeam } = getCurrentContext(props.snapshot);

  return (
    <Section title="Current Match">
      <dl className="metric-grid">
        <Metric label="Match" value={match?.title ?? "No active match"} />
        <Metric label="Match status" value={match?.status ?? "Unknown"} />
        <Metric label="Format" value={match?.format ?? "Unknown"} />
        <Metric label="Current game" value={game ? `Game ${game.gameNumber}` : "Not selected"} />
        <Metric label="Blue team" value={formatTeamName(blueTeam)} />
        <Metric label="Red team" value={formatTeamName(redTeam)} />
        <Metric label="Game code" value={game?.gameCode ?? match?.gameCode ?? "Unknown"} />
        <Metric label="Ruleset" value={game?.rulesetId ?? "Unknown"} />
      </dl>
    </Section>
  );
}

function MatchList(props: { matches: DashboardMatch[] }): ReactNode {
  return (
    <Section title="Matches">
      {props.matches.length === 0 ? (
        <p className="empty-state">No matches are available from the loaded package.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Match</th>
                <th>Status</th>
                <th>Format</th>
                <th>Score</th>
                <th>Games</th>
              </tr>
            </thead>
            <tbody>
              {props.matches.map((match) => (
                <tr key={match.id}>
                  <td>{match.title}</td>
                  <td>{match.status}</td>
                  <td>{match.format}</td>
                  <td>
                    {match.score.blue} - {match.score.red}
                  </td>
                  <td>{match.games.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

function AdapterCard(props: { adapter: DashboardAdapterSummary }): ReactNode {
  const adapter = props.adapter;

  return (
    <article className="summary-card">
      <div className="summary-card__header">
        <h3>{adapter.displayName}</h3>
        <StatusPill tone={adapter.loaded ? "good" : "danger"}>
          {adapter.loaded ? "Loaded" : "Unavailable"}
        </StatusPill>
      </div>
      <dl className="compact-list">
        <Metric label="Game code" value={adapter.gameCode} />
        <Metric label="Heroes" value={adapter.heroCount} />
        <Metric label="Rulesets" value={adapter.rulesetCount} />
        <Metric label="Manual draft" value={adapter.capabilities.supportsManualDraft ? "Yes" : "No"} />
      </dl>
      {adapter.error ? <p className="inline-error">{adapter.error.message}</p> : null}
    </article>
  );
}

function AdapterSummary(props: { snapshot: DashboardRuntimeState | null }): ReactNode {
  const adapters = props.snapshot?.adapters ?? [];

  return (
    <Section title="Adapters">
      {adapters.length === 0 ? (
        <p className="empty-state">No adapters are loaded yet.</p>
      ) : (
        <div className="card-grid">
          {adapters.map((adapter) => (
            <AdapterCard key={adapter.gameCode} adapter={adapter} />
          ))}
        </div>
      )}
    </Section>
  );
}

function DraftCard(props: { draft: DashboardDraftSummary }): ReactNode {
  const draft = props.draft;
  const phaseLabel = draft.currentPhase?.label ?? draft.currentPhase?.id ?? "No active phase";

  return (
    <article className="summary-card">
      <div className="summary-card__header">
        <h3>{draft.id}</h3>
        <StatusPill tone={draft.status === "LIVE" ? "good" : draft.status === "PAUSED" ? "warn" : "neutral"}>
          {draft.status}
        </StatusPill>
      </div>
      <dl className="compact-list">
        <Metric label="Match" value={draft.matchId} />
        <Metric label="Game" value={`Game ${draft.gameNumber}`} />
        <Metric label="Phase" value={phaseLabel} />
        <Metric label="Timer" value={formatDuration(draft.timer.remainingSeconds)} />
        <Metric label="Locked" value={draft.actionCounts.locked} />
        <Metric label="Bans" value={draft.bannedHeroIds.length} />
        <Metric label="Picks" value={draft.pickedHeroIds.length} />
      </dl>
    </article>
  );
}

function DraftSummary(props: { snapshot: DashboardRuntimeState | null }): ReactNode {
  const drafts = Object.values(props.snapshot?.drafts ?? {});

  return (
    <Section title="Drafts">
      {drafts.length === 0 ? (
        <p className="empty-state">No draft summaries are available yet.</p>
      ) : (
        <div className="card-grid">
          {drafts.map((draft) => (
            <DraftCard key={draft.id} draft={draft} />
          ))}
        </div>
      )}
    </Section>
  );
}

function ProductionSummary(props: { snapshot: DashboardRuntimeState | null }): ReactNode {
  const production = props.snapshot?.production ?? null;

  return (
    <Section title="Production">
      <dl className="metric-grid">
        <Metric label="State" value={production?.status ?? "Unknown"} />
        <Metric label="Active match" value={production?.activeMatchId ?? "None"} />
        <Metric label="Active game" value={production?.activeGameNumber ?? "None"} />
        <Metric label="Active draft" value={production?.activeDraftId ?? "None"} />
        <Metric label="Preview" value={production?.graphicTakeState.previewPayload ? "Prepared" : "Empty"} />
        <Metric label="Program" value={production?.graphicTakeState.programPayload ? "On air" : "Empty"} />
        <Metric
          label="Emergency"
          value={
            <StatusPill tone={production?.emergency.active ? "danger" : "good"}>
              {production?.emergency.active ? "Active" : "Ready"}
            </StatusPill>
          }
        />
        <Metric
          label="Overlay safety"
          value={production?.overlaySafety.readOnly ? "Read-only" : "Check required"}
        />
      </dl>
    </Section>
  );
}

function ErrorBanner(props: { state: DashboardClientState }): ReactNode {
  if (!props.state.error) {
    return null;
  }

  return (
    <div className="banner banner--error" role="alert">
      <strong>{props.state.error.code}</strong>
      <span>{props.state.error.message}</span>
    </div>
  );
}

function LoadingBanner(props: { state: DashboardClientState }): ReactNode {
  if (props.state.loadStatus !== "loading") {
    return null;
  }

  return (
    <div className="banner banner--loading" role="status">
      Loading current server state.
    </div>
  );
}

export function DashboardView(props: DashboardViewProps): ReactNode {
  const snapshot = props.state.snapshot;

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Multi-MOBA Broadcast Toolkit v0.1</p>
          <h1>Admin Dashboard</h1>
        </div>
        <button className="refresh-button" type="button" onClick={props.onRefresh}>
          Refresh
        </button>
      </header>

      <ErrorBanner state={props.state} />
      <LoadingBanner state={props.state} />

      <div className="section-grid">
        <ConnectionSummary state={props.state} />
        <EventSummary snapshot={snapshot} />
        <MatchSummary snapshot={snapshot} />
        <ProductionSummary snapshot={snapshot} />
      </div>

      <MatchList matches={snapshot?.matches ?? []} />
      <AdapterSummary snapshot={snapshot} />
      <DraftSummary snapshot={snapshot} />
    </main>
  );
}
