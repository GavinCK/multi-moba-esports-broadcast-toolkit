import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Player, Sponsor, Team } from "@mmbt/shared-types";

import type {
  DashboardAdapterSummary,
  DashboardDraftSummary,
  DashboardGame,
  DashboardHealthResponse,
  DashboardMatch,
  DashboardRuntimeState,
  DashboardValidationWarning
} from "./client/types";
import type { DashboardClientState, DashboardSocketStatus } from "./state/dashboardState";
import {
  createDashboardHealthSummary,
  findTeam,
  formatDateTime,
  formatDuration,
  formatTeamName,
  getAdapterForGameCode,
  getCurrentContext,
  getDraftForGame,
  getMatchSetupWarnings,
  getPlayersForTeam,
  getRulesetLabel,
  getSelectedMatch,
  getSponsorsForMatch,
  getThemeLabel
} from "./state/selectors";
import { useDashboardState } from "./state/useDashboardState";

export type AdminSectionId =
  | "overview"
  | "matches"
  | "teams"
  | "players"
  | "sponsors"
  | "themes"
  | "system-health";

const ADMIN_SECTIONS: Array<{ id: AdminSectionId; label: string; path: string }> = [
  { id: "overview", label: "Overview", path: "/admin" },
  { id: "matches", label: "Matches", path: "/admin/matches" },
  { id: "teams", label: "Teams", path: "/admin/teams" },
  { id: "players", label: "Players", path: "/admin/players" },
  { id: "sponsors", label: "Sponsors", path: "/admin/sponsors" },
  { id: "themes", label: "Themes", path: "/admin/themes" },
  { id: "system-health", label: "System Health", path: "/admin/system-health" }
];

export function DashboardApp(): ReactNode {
  const { state, refresh } = useDashboardState();

  return <DashboardView state={state} onRefresh={() => void refresh()} />;
}

export interface DashboardViewProps {
  state: DashboardClientState;
  onRefresh(): void;
  initialSection?: AdminSectionId;
  initialSelectedMatchId?: string | null;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getAdminSectionFromPath(pathname: string): AdminSectionId {
  const normalizedPath = pathname.replace(/\/+$/u, "") || "/admin";
  const matchingSection = ADMIN_SECTIONS.find((section) => section.path === normalizedPath);

  return matchingSection?.id ?? "overview";
}

function getPathForSection(sectionId: AdminSectionId): string {
  return ADMIN_SECTIONS.find((section) => section.id === sectionId)?.path ?? "/admin";
}

function getInitialSection(override: AdminSectionId | undefined): AdminSectionId {
  if (override) {
    return override;
  }

  return isBrowser() ? getAdminSectionFromPath(window.location.pathname) : "overview";
}

function StatusPill(props: {
  tone: "good" | "warn" | "danger" | "neutral";
  children: ReactNode;
}): ReactNode {
  return <span className={`status-pill status-pill--${props.tone}`}>{props.children}</span>;
}

function Section(props: { title: string; children: ReactNode; actions?: ReactNode }): ReactNode {
  const headingId = `${props.title.replace(/\s+/gu, "-").toLowerCase()}-heading`;

  return (
    <section className="dashboard-section" aria-labelledby={headingId}>
      <div className="section-title-row">
        <h2 id={headingId}>{props.title}</h2>
        {props.actions ? <div className="section-actions">{props.actions}</div> : null}
      </div>
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

function getServerTone(status: DashboardHealthResponse["status"] | "UNKNOWN"): "good" | "warn" | "danger" | "neutral" {
  switch (status) {
    case "OK":
      return "good";
    case "WARN":
      return "warn";
    case "ERROR":
      return "danger";
    default:
      return "neutral";
  }
}

function DashboardNav(props: {
  activeSection: AdminSectionId;
  onSectionChange(sectionId: AdminSectionId): void;
}): ReactNode {
  return (
    <nav className="dashboard-nav" aria-label="Admin sections">
      {ADMIN_SECTIONS.map((section) => (
        <button
          key={section.id}
          aria-current={props.activeSection === section.id ? "page" : undefined}
          className="nav-tab"
          type="button"
          onClick={() => props.onSectionChange(section.id)}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}

function WarningCodeList(props: { warnings: DashboardValidationWarning[]; emptyLabel: string }): ReactNode {
  if (props.warnings.length === 0) {
    return <p className="empty-state">{props.emptyLabel}</p>;
  }

  const codes = Array.from(new Set(props.warnings.map((warning) => warning.code))).sort();

  return (
    <div className="warning-code-list">
      {codes.map((code) => (
        <span className="warning-code" key={code}>
          {code}
        </span>
      ))}
    </div>
  );
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
              <StatusPill tone={getServerTone(health.status)}>{health.status}</StatusPill>
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

function MatchList(props: {
  matches: DashboardMatch[];
  selectedMatchId: string | null;
  onSelect(matchId: string): void;
}): ReactNode {
  if (props.matches.length === 0) {
    return <p className="empty-state">No matches are available from the loaded package.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Match</th>
            <th>Status</th>
            <th>Format</th>
            <th>Score</th>
            <th>Games</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {props.matches.map((match) => (
            <tr key={match.id}>
              <td>
                <strong>{match.title}</strong>
                <span className="subtle-id">{match.id}</span>
              </td>
              <td>{match.status}</td>
              <td>{match.format}</td>
              <td>
                {match.score.blue} - {match.score.red}
              </td>
              <td>{match.games.length}</td>
              <td>
                <button
                  aria-pressed={props.selectedMatchId === match.id}
                  className="secondary-button"
                  type="button"
                  onClick={() => props.onSelect(match.id)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
      {adapter.error ? <p className="inline-error">Adapter error: {adapter.error.code}</p> : null}
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
        <Metric label="Finalized" value={draft.actionCounts.locked} />
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

function TeamRoster(props: { title: string; team: Team | null; players: Player[] }): ReactNode {
  return (
    <article className="summary-card">
      <h3>{props.title}</h3>
      <dl className="compact-list">
        <Metric label="Team" value={formatTeamName(props.team)} />
        <Metric label="Players" value={props.players.length} />
      </dl>
      {props.players.length === 0 ? (
        <p className="empty-state">No players are linked to this team.</p>
      ) : (
        <ul className="roster-list">
          {props.players.map((player) => (
            <li key={player.id}>
              <span>{player.displayName}</span>
              <span>{player.role ?? "Role not set"}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function MatchGamesTable(props: { snapshot: DashboardRuntimeState; games: DashboardGame[] }): ReactNode {
  if (props.games.length === 0) {
    return <p className="empty-state">No game instances are configured for this match.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Game</th>
            <th>Status</th>
            <th>Adapter</th>
            <th>Ruleset</th>
            <th>Theme</th>
            <th>Draft</th>
          </tr>
        </thead>
        <tbody>
          {props.games.map((game) => {
            const adapter = getAdapterForGameCode(props.snapshot, game.gameCode);
            const draft = getDraftForGame(props.snapshot, game);

            return (
              <tr key={game.id}>
                <td>
                  <strong>Game {game.gameNumber}</strong>
                  <span className="subtle-id">{game.id}</span>
                </td>
                <td>{game.status}</td>
                <td>
                  {adapter?.displayName ?? game.gameCode}{" "}
                  <StatusPill tone={adapter?.loaded ? "good" : "warn"}>
                    {adapter?.loaded ? "Loaded" : "Missing"}
                  </StatusPill>
                </td>
                <td>{getRulesetLabel(props.snapshot, game.rulesetId)}</td>
                <td>{getThemeLabel(props.snapshot, game.themeId)}</td>
                <td>{draft ? `${draft.id} (${draft.status})` : game.draftId ?? "None"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SponsorList(props: { sponsors: Sponsor[] }): ReactNode {
  if (props.sponsors.length === 0) {
    return <p className="empty-state">No sponsor references are linked to this match.</p>;
  }

  return (
    <ul className="detail-list">
      {props.sponsors.map((sponsor) => (
        <li key={sponsor.id}>
          <strong>{sponsor.name}</strong>
          <span>{sponsor.slots.join(", ")}</span>
        </li>
      ))}
    </ul>
  );
}

function MatchSetupPanel(props: {
  snapshot: DashboardRuntimeState | null;
  selectedMatchId: string | null;
  onSelectMatch(matchId: string): void;
}): ReactNode {
  const snapshot = props.snapshot;
  const selectedMatch = getSelectedMatch(snapshot, props.selectedMatchId);

  if (!snapshot) {
    return (
      <Section title="Match Setup">
        <p className="empty-state">Waiting for server state before showing match setup.</p>
      </Section>
    );
  }

  const blueTeam = findTeam(snapshot, selectedMatch?.teams.blue);
  const redTeam = findTeam(snapshot, selectedMatch?.teams.red);
  const bluePlayers = getPlayersForTeam(snapshot, selectedMatch?.teams.blue);
  const redPlayers = getPlayersForTeam(snapshot, selectedMatch?.teams.red);
  const sponsors = getSponsorsForMatch(snapshot, selectedMatch);
  const warnings = getMatchSetupWarnings(snapshot, selectedMatch);

  return (
    <>
      <Section title="Matches">
        <MatchList
          matches={snapshot.matches}
          selectedMatchId={selectedMatch?.id ?? null}
          onSelect={props.onSelectMatch}
        />
      </Section>

      <Section title="Selected Match">
        {!selectedMatch ? (
          <p className="empty-state">No match is selected.</p>
        ) : (
          <div className="stack">
            <dl className="metric-grid">
              <Metric label="Title" value={selectedMatch.title} />
              <Metric label="Match ID" value={selectedMatch.id} />
              <Metric label="Status" value={selectedMatch.status} />
              <Metric label="Format" value={selectedMatch.format} />
              <Metric label="Score" value={`${selectedMatch.score.blue} - ${selectedMatch.score.red}`} />
              <Metric label="Current game" value={`Game ${selectedMatch.currentGameNumber}`} />
              <Metric label="Game code" value={selectedMatch.gameCode} />
              <Metric label="Theme" value={getThemeLabel(snapshot, selectedMatch.themeId)} />
            </dl>

            <div className="card-grid card-grid--two">
              <TeamRoster title="Blue Side" team={blueTeam} players={bluePlayers} />
              <TeamRoster title="Red Side" team={redTeam} players={redPlayers} />
            </div>

            <div>
              <h3 className="subsection-title">Games</h3>
              <MatchGamesTable snapshot={snapshot} games={selectedMatch.games} />
            </div>

            <div>
              <h3 className="subsection-title">Sponsors</h3>
              <SponsorList sponsors={sponsors} />
            </div>

            {warnings.length > 0 ? (
              <div className="warning-panel" role="status">
                <h3>Setup Warnings</h3>
                <ul>
                  {warnings.map((warning) => (
                    <li key={`${warning.code}-${warning.message}`}>
                      <strong>{warning.code}</strong>
                      <span>{warning.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="inline-success">Selected match setup references resolve cleanly.</p>
            )}
          </div>
        )}
      </Section>
    </>
  );
}

function TeamsPanel(props: { snapshot: DashboardRuntimeState | null }): ReactNode {
  const snapshot = props.snapshot;

  return (
    <Section title="Teams">
      {!snapshot || snapshot.teams.length === 0 ? (
        <p className="empty-state">No teams are available from the loaded package.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Team</th>
                <th>Short name</th>
                <th>Players</th>
                <th>Country</th>
                <th>Colors</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.teams.map((team) => (
                <tr key={team.id}>
                  <td>
                    <strong>{team.name}</strong>
                    <span className="subtle-id">{team.id}</span>
                  </td>
                  <td>{team.shortName}</td>
                  <td>{getPlayersForTeam(snapshot, team.id).length}</td>
                  <td>{team.countryCode ?? "Not set"}</td>
                  <td>
                    <span className="color-chip" style={{ backgroundColor: team.primaryColor ?? "#e5e7eb" }} />
                    <span className="color-chip" style={{ backgroundColor: team.secondaryColor ?? "#cbd5e1" }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

function PlayersPanel(props: { snapshot: DashboardRuntimeState | null }): ReactNode {
  const snapshot = props.snapshot;

  return (
    <Section title="Players">
      {!snapshot || snapshot.players.length === 0 ? (
        <p className="empty-state">No players are available from the loaded package.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th>Role</th>
                <th>Nationality</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.players.map((player) => (
                <tr key={player.id}>
                  <td>
                    <strong>{player.displayName}</strong>
                    <span className="subtle-id">{player.id}</span>
                  </td>
                  <td>{formatTeamName(findTeam(snapshot, player.teamId))}</td>
                  <td>{player.role ?? "Not set"}</td>
                  <td>{player.nationality ?? "Not set"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

function SponsorsPanel(props: { snapshot: DashboardRuntimeState | null }): ReactNode {
  const snapshot = props.snapshot;

  return (
    <Section title="Sponsors">
      {!snapshot || snapshot.sponsors.length === 0 ? (
        <p className="empty-state">No sponsors are available from the loaded package.</p>
      ) : (
        <div className="card-grid card-grid--two">
          {snapshot.sponsors.map((sponsor) => (
            <article className="summary-card" key={sponsor.id}>
              <h3>{sponsor.name}</h3>
              <dl className="compact-list">
                <Metric label="Sponsor ID" value={sponsor.id} />
                <Metric label="Slots" value={sponsor.slots.join(", ")} />
              </dl>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}

function ThemesPanel(props: { snapshot: DashboardRuntimeState | null }): ReactNode {
  const snapshot = props.snapshot;

  return (
    <div className="stack">
      <Section title="Themes">
        {!snapshot || snapshot.themes.length === 0 ? (
          <p className="empty-state">No themes are available from the loaded package.</p>
        ) : (
          <div className="card-grid card-grid--two">
            {snapshot.themes.map((theme) => (
              <article className="summary-card" key={theme.id}>
                <h3>{theme.name ?? theme.id}</h3>
                <dl className="compact-list">
                  <Metric label="Theme ID" value={theme.id} />
                  <Metric label="Version" value={theme.version ?? "Not reported"} />
                </dl>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section title="Rulesets">
        {!snapshot || snapshot.rulesets.length === 0 ? (
          <p className="empty-state">No rulesets are available from the loaded package.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ruleset</th>
                  <th>Game code</th>
                  <th>Version</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.rulesets.map((ruleset) => (
                  <tr key={ruleset.id}>
                    <td>
                      <strong>{ruleset.name}</strong>
                      <span className="subtle-id">{ruleset.id}</span>
                    </td>
                    <td>{ruleset.gameCode}</td>
                    <td>{ruleset.version ?? "Not reported"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

function SystemHealthPanel(props: { state: DashboardClientState }): ReactNode {
  const summary = createDashboardHealthSummary({
    snapshot: props.state.snapshot,
    health: props.state.health,
    socketStatus: props.state.socketStatus,
    loadStatus: props.state.loadStatus
  });
  const health = props.state.health;
  const adapterStatuses = Object.entries(health?.adapterStatus ?? {});
  const eventWarnings = health?.validationWarnings?.eventPackage ?? [];
  const adapterWarnings = health?.validationWarnings?.adapters ?? [];

  return (
    <div className="stack">
      <Section title="System Health">
        <dl className="metric-grid">
          <Metric
            label="Server"
            value={<StatusPill tone={getServerTone(summary.serverStatus)}>{summary.serverStatus}</StatusPill>}
          />
          <Metric label="REST state" value={summary.restStatus} />
          <Metric
            label="Realtime"
            value={<StatusPill tone={getSocketTone(summary.socketStatus)}>{summary.socketStatus}</StatusPill>}
          />
          <Metric label="Loaded package" value={summary.loadedEventPackageId} />
          <Metric label="Runtime revision" value={summary.revision ?? "Not reported"} />
          <Metric label="Production state" value={summary.productionState} />
          <Metric
            label="Emergency"
            value={
              <StatusPill tone={summary.emergencyStatus === "ACTIVE" ? "danger" : "good"}>
                {summary.emergencyStatus}
              </StatusPill>
            }
          />
          <Metric label="Last snapshot" value={formatDateTime(summary.latestSnapshotAt)} />
          <Metric label="API source" value="Same-origin /api" />
          <Metric label="Missing assets" value={summary.missingAssetCount} />
          <Metric label="Health warnings" value={summary.healthWarningCount} />
          <Metric
            label="Audit logging"
            value={
              health?.auditLogStatus?.writable ? (
                <StatusPill tone="good">Writable</StatusPill>
              ) : (
                <StatusPill tone="warn">Needs review</StatusPill>
              )
            }
          />
        </dl>
        {health?.auditLogStatus?.error ? (
          <p className="inline-warning">Audit log writer reports an error. Check the server console before show.</p>
        ) : null}
      </Section>

      <Section title="Client Presence">
        <dl className="metric-grid">
          <Metric label="Connected clients" value={summary.connectedClientCount} />
          <Metric label="Reported groups" value={summary.connectedClientGroups.length} />
        </dl>
        {summary.connectedClientGroups.length === 0 ? (
          <p className="empty-state">No client roles or panels have reported yet.</p>
        ) : (
          <ul className="detail-list">
            {summary.connectedClientGroups.map((group) => (
              <li key={group}>
                <strong>{group}</strong>
                <span>Connected</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Adapter Health">
        <dl className="metric-grid">
          <Metric label="Loaded adapters" value={`${summary.loadedAdapterCount} / ${summary.knownAdapterCount}`} />
          <Metric label="Known IDs" value={props.state.snapshot?.availableAdapterIds.join(", ") ?? "Not reported"} />
        </dl>
        {adapterStatuses.length === 0 ? (
          <p className="empty-state">No adapter health has been reported.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Adapter</th>
                  <th>Status</th>
                  <th>Heroes</th>
                  <th>Rulesets</th>
                </tr>
              </thead>
              <tbody>
                {adapterStatuses.map(([adapterId, adapter]) => (
                  <tr key={adapterId}>
                    <td>{adapter.displayName ?? adapterId}</td>
                    <td>
                      <StatusPill tone={adapter.loaded ? "good" : "danger"}>
                        {adapter.loaded ? "Loaded" : "Unavailable"}
                      </StatusPill>
                    </td>
                    <td>{adapter.heroCount}</td>
                    <td>{adapter.rulesetCount ?? "Not reported"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Warnings">
        <div className="card-grid card-grid--two">
          <article className="summary-card">
            <h3>Event package</h3>
            <WarningCodeList warnings={eventWarnings} emptyLabel="No event package warnings reported." />
          </article>
          <article className="summary-card">
            <h3>Adapters</h3>
            <WarningCodeList warnings={adapterWarnings} emptyLabel="No adapter warnings reported." />
          </article>
        </div>
      </Section>
    </div>
  );
}

function OverviewPanel(props: { state: DashboardClientState }): ReactNode {
  return (
    <div className="stack">
      <div className="section-grid">
        <ConnectionSummary state={props.state} />
        <EventSummary snapshot={props.state.snapshot} />
        <MatchSummary snapshot={props.state.snapshot} />
        <ProductionSummary snapshot={props.state.snapshot} />
      </div>

      <AdapterSummary snapshot={props.state.snapshot} />
      <DraftSummary snapshot={props.state.snapshot} />
    </div>
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
  const [activeSection, setActiveSection] = useState<AdminSectionId>(() =>
    getInitialSection(props.initialSection)
  );
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(
    props.initialSelectedMatchId ?? null
  );
  const selectedMatch = useMemo(
    () => getSelectedMatch(snapshot, selectedMatchId),
    [snapshot, selectedMatchId]
  );

  useEffect(() => {
    if (!selectedMatch) {
      return;
    }

    if (!selectedMatchId || selectedMatch.id !== selectedMatchId) {
      setSelectedMatchId(selectedMatch.id);
    }
  }, [selectedMatch, selectedMatchId]);

  useEffect(() => {
    if (props.initialSection || !isBrowser()) {
      return undefined;
    }

    function handlePopState(): void {
      setActiveSection(getAdminSectionFromPath(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [props.initialSection]);

  function handleSectionChange(sectionId: AdminSectionId): void {
    setActiveSection(sectionId);

    if (isBrowser() && !props.initialSection) {
      window.history.pushState(null, "", getPathForSection(sectionId));
    }
  }

  function renderActiveSection(): ReactNode {
    switch (activeSection) {
      case "matches":
        return (
          <MatchSetupPanel
            snapshot={snapshot}
            selectedMatchId={selectedMatch?.id ?? selectedMatchId}
            onSelectMatch={setSelectedMatchId}
          />
        );
      case "teams":
        return <TeamsPanel snapshot={snapshot} />;
      case "players":
        return <PlayersPanel snapshot={snapshot} />;
      case "sponsors":
        return <SponsorsPanel snapshot={snapshot} />;
      case "themes":
        return <ThemesPanel snapshot={snapshot} />;
      case "system-health":
        return <SystemHealthPanel state={props.state} />;
      default:
        return <OverviewPanel state={props.state} />;
    }
  }

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

      <DashboardNav activeSection={activeSection} onSectionChange={handleSectionChange} />

      <ErrorBanner state={props.state} />
      <LoadingBanner state={props.state} />

      {renderActiveSection()}
    </main>
  );
}
