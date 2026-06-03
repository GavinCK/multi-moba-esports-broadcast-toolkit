import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { DraftAction, Hero, Player, Team } from "@mmbt/shared-types";

import type { DashboardApiClient } from "../client/apiClient";
import { toDashboardApiError } from "../client/apiClient";
import type {
  DashboardAdapterDetail,
  DashboardDraftSnapshot,
  DashboardDraftSummary,
  DashboardGame,
  DashboardMatch,
  DashboardRuntimeState
} from "../client/types";
import { useDisplayedDraftTimer } from "../draft/useDisplayedDraftTimer";
import type { DashboardClientState, DashboardSocketStatus } from "../state/dashboardState";
import {
  findTeam,
  formatDateTime,
  formatDuration,
  formatTeamName,
  getDraftForGame,
  getMatchById,
  getPlayersForTeam,
  getRulesetLabel,
  getSelectedMatch
} from "../state/selectors";

type AsyncStatus = "idle" | "loading" | "ready" | "error";

export interface CasterPanelProps {
  state: DashboardClientState;
  apiClient: DashboardApiClient;
  onRefresh(): void | Promise<void>;
  routeMatchId?: string | null;
}

function StatusPill(props: {
  tone: "good" | "warn" | "danger" | "neutral";
  children: ReactNode;
}): ReactNode {
  return <span className={`status-pill status-pill--${props.tone}`}>{props.children}</span>;
}

function Metric(props: { label: string; value: ReactNode }): ReactNode {
  return (
    <div className="metric">
      <dt>{props.label}</dt>
      <dd>{props.value}</dd>
    </div>
  );
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

function getDraftTone(status: string | undefined): "good" | "warn" | "danger" | "neutral" {
  switch (status) {
    case "LIVE":
      return "good";
    case "READY":
    case "PAUSED":
      return "warn";
    case "CANCELLED":
      return "danger";
    default:
      return "neutral";
  }
}

function formatSide(side: DraftAction["team"] | string | undefined): string {
  switch (side) {
    case "BLUE":
      return "Blue";
    case "RED":
      return "Red";
    default:
      return "Unassigned";
  }
}

function findPreferredGame(
  snapshot: DashboardRuntimeState,
  match: DashboardMatch,
  selectedGameId: string | null
): DashboardGame | null {
  const selectedGame = match.games.find((game) => game.id === selectedGameId);

  if (selectedGame) {
    return selectedGame;
  }

  const currentRuntimeGame = match.games.find((game) => game.id === snapshot.currentGameId);

  if (currentRuntimeGame) {
    return currentRuntimeGame;
  }

  return match.games.find((game) => game.gameNumber === match.currentGameNumber) ?? match.games[0] ?? null;
}

function findPreferredDraft(
  snapshot: DashboardRuntimeState,
  match: DashboardMatch,
  game: DashboardGame | null
): DashboardDraftSummary | null {
  const gameDraft = getDraftForGame(snapshot, game);

  if (gameDraft) {
    return gameDraft;
  }

  const activeDraft =
    snapshot.production.activeMatchId === match.id && snapshot.production.activeDraftId
      ? snapshot.drafts[snapshot.production.activeDraftId]
      : null;

  if (activeDraft) {
    return activeDraft;
  }

  return Object.values(snapshot.drafts).find((draft) => draft.matchId === match.id) ?? null;
}

function getHeroLabel(heroById: Map<string, Hero>, heroId: string | null | undefined): string {
  if (!heroId) {
    return "Empty";
  }

  return heroById.get(heroId)?.displayName ?? heroId;
}

function getLockedSelections(input: {
  draftDetail: DashboardDraftSnapshot | null;
  side: "BLUE" | "RED";
  type: "BAN" | "PICK";
  heroById: Map<string, Hero>;
}): string[] {
  const actions = input.draftDetail?.draft.actions.filter(
    (action) => action.type === input.type && action.team === input.side && action.status === "LOCKED"
  );

  if (actions && actions.length > 0) {
    return actions.map((action) => getHeroLabel(input.heroById, action.heroId));
  }

  if (input.draftDetail) {
    return [];
  }

  return [];
}

function getReportedSelections(input: {
  summary: DashboardDraftSummary | null;
  type: "BAN" | "PICK";
  heroById: Map<string, Hero>;
}): string[] {
  if (!input.summary) {
    return [];
  }

  const fallbackHeroIds = input.type === "BAN" ? input.summary.bannedHeroIds : input.summary.pickedHeroIds;

  return fallbackHeroIds.map((heroId) => getHeroLabel(input.heroById, heroId));
}

function SelectionList(props: { title: string; items: string[] }): ReactNode {
  return (
    <article className="summary-card caster-selection-card">
      <h3>{props.title}</h3>
      {props.items.length === 0 ? (
        <p className="empty-state">No selections reported.</p>
      ) : (
        <ol className="caster-selection-list">
          {props.items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ol>
      )}
    </article>
  );
}

function TeamReadout(props: { title: string; team: Team | null; players: Player[] }): ReactNode {
  return (
    <article className="summary-card">
      <h3>{props.title}</h3>
      <dl className="compact-list">
        <Metric label="Team" value={formatTeamName(props.team)} />
        <Metric label="Players" value={props.players.length} />
      </dl>
      {props.players.length === 0 ? (
        <p className="empty-state">No public player list is available.</p>
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

function MatchSelector(props: {
  snapshot: DashboardRuntimeState;
  selectedMatch: DashboardMatch | null;
  onMatchChange(matchId: string): void;
}): ReactNode {
  return (
    <label className="field-label field-label--narrow">
      Match
      <select
        value={props.selectedMatch?.id ?? ""}
        onChange={(event) => props.onMatchChange(event.currentTarget.value)}
        disabled={props.snapshot.matches.length === 0}
      >
        {props.selectedMatch ? null : <option value="">Select a match</option>}
        {props.snapshot.matches.map((match) => (
          <option key={match.id} value={match.id}>
            {match.title}
          </option>
        ))}
      </select>
    </label>
  );
}

function CompletedDrafts(props: {
  drafts: DashboardDraftSummary[];
  heroById: Map<string, Hero>;
}): ReactNode {
  const completedDrafts = props.drafts.filter((draft) => draft.status === "COMPLETE");

  if (completedDrafts.length === 0) {
    return <p className="empty-state">No completed draft summaries are available in current state.</p>;
  }

  return (
    <div className="card-grid card-grid--two">
      {completedDrafts.map((draft) => (
        <article className="summary-card" key={draft.id}>
          <div className="summary-card__header">
            <h3>Game {draft.gameNumber}</h3>
            <StatusPill tone="neutral">{draft.status}</StatusPill>
          </div>
          <dl className="compact-list">
            <Metric label="Draft" value={draft.id} />
            <Metric label="Game code" value={draft.gameCode} />
            <Metric label="Bans" value={draft.bannedHeroIds.map((heroId) => getHeroLabel(props.heroById, heroId)).join(", ") || "None"} />
            <Metric label="Picks" value={draft.pickedHeroIds.map((heroId) => getHeroLabel(props.heroById, heroId)).join(", ") || "None"} />
            <Metric label="Updated" value={formatDateTime(draft.updatedAt)} />
          </dl>
        </article>
      ))}
    </div>
  );
}

export function CasterPanel(props: CasterPanelProps): ReactNode {
  const snapshot = props.state.snapshot;
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(props.routeMatchId ?? null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [draftDetail, setDraftDetail] = useState<DashboardDraftSnapshot | null>(null);
  const [adapterDetail, setAdapterDetail] = useState<DashboardAdapterDetail | null>(null);
  const [draftStatus, setDraftStatus] = useState<AsyncStatus>("idle");
  const [adapterStatus, setAdapterStatus] = useState<AsyncStatus>("idle");
  const [panelErrorCode, setPanelErrorCode] = useState<string | null>(null);

  useEffect(() => {
    if (props.routeMatchId) {
      setSelectedMatchId(props.routeMatchId);
    }
  }, [props.routeMatchId]);

  const routeMatchMissing = Boolean(
    snapshot && props.routeMatchId && !getMatchById(snapshot, props.routeMatchId)
  );

  const selectedMatch = useMemo(() => {
    if (!snapshot || routeMatchMissing) {
      return null;
    }

    return getMatchById(snapshot, selectedMatchId) ?? getSelectedMatch(snapshot, selectedMatchId);
  }, [routeMatchMissing, selectedMatchId, snapshot]);

  const selectedGame = useMemo(() => {
    if (!snapshot || !selectedMatch) {
      return null;
    }

    return findPreferredGame(snapshot, selectedMatch, selectedGameId);
  }, [selectedGameId, selectedMatch, snapshot]);

  const selectedDraft = useMemo(() => {
    if (!snapshot || !selectedMatch) {
      return null;
    }

    return findPreferredDraft(snapshot, selectedMatch, selectedGame);
  }, [selectedGame, selectedMatch, snapshot]);

  useEffect(() => {
    if (selectedMatch && selectedMatch.id !== selectedMatchId) {
      setSelectedMatchId(selectedMatch.id);
    }
  }, [selectedMatch, selectedMatchId]);

  useEffect(() => {
    if (selectedGame && selectedGame.id !== selectedGameId) {
      setSelectedGameId(selectedGame.id);
    }
  }, [selectedGame, selectedGameId]);

  useEffect(() => {
    if (!selectedDraft?.id) {
      setDraftDetail(null);
      setDraftStatus("idle");
      return undefined;
    }

    let isCancelled = false;
    setDraftStatus("loading");
    setPanelErrorCode(null);

    props.apiClient
      .get<{ revision: number; draft: DashboardDraftSnapshot }>(`/api/drafts/${selectedDraft.id}`)
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setDraftDetail(response.draft);
        setDraftStatus("ready");
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }

        setDraftDetail(null);
        setDraftStatus("error");
        setPanelErrorCode(toDashboardApiError(error).code);
      });

    return () => {
      isCancelled = true;
    };
  }, [props.apiClient, selectedDraft?.id, snapshot?.revision]);

  useEffect(() => {
    if (!selectedGame?.gameCode) {
      setAdapterDetail(null);
      setAdapterStatus("idle");
      return undefined;
    }

    let isCancelled = false;
    setAdapterStatus("loading");
    setPanelErrorCode(null);

    props.apiClient
      .get<DashboardAdapterDetail>(`/api/adapters/${selectedGame.gameCode}`)
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setAdapterDetail(response);
        setAdapterStatus("ready");
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }

        setAdapterDetail(null);
        setAdapterStatus("error");
        setPanelErrorCode(toDashboardApiError(error).code);
      });

    return () => {
      isCancelled = true;
    };
  }, [props.apiClient, selectedGame?.gameCode]);

  const displayedTimer = useDisplayedDraftTimer(selectedDraft?.timer);

  async function refreshPanel(): Promise<void> {
    await Promise.resolve(props.onRefresh());
  }

  if (!snapshot) {
    return (
      <Section title="Caster Panel">
        <p className="empty-state">Waiting for server state before showing public match information.</p>
      </Section>
    );
  }

  if (snapshot.matches.length === 0) {
    return (
      <Section title="Caster Panel">
        <p className="empty-state">No matches are available from the loaded package.</p>
      </Section>
    );
  }

  if (routeMatchMissing) {
    return (
      <div className="stack">
        <Section title="Caster Panel">
          <div className="operator-status-row">
            <StatusPill tone={props.state.loadStatus === "ready" ? "good" : "warn"}>
              REST {props.state.loadStatus}
            </StatusPill>
            <StatusPill tone={getSocketTone(props.state.socketStatus)}>
              Realtime {props.state.socketStatus}
            </StatusPill>
            <StatusPill tone={props.state.health?.status === "OK" ? "good" : "warn"}>
              Server {props.state.health?.status ?? "UNKNOWN"}
            </StatusPill>
          </div>
          <p className="empty-state">Requested match is not available in the loaded event package.</p>
        </Section>
      </div>
    );
  }

  const blueTeam = findTeam(snapshot, selectedGame?.blueTeamId ?? selectedMatch?.teams.blue);
  const redTeam = findTeam(snapshot, selectedGame?.redTeamId ?? selectedMatch?.teams.red);
  const bluePlayers = getPlayersForTeam(snapshot, blueTeam?.id);
  const redPlayers = getPlayersForTeam(snapshot, redTeam?.id);
  const matchDrafts = Object.values(snapshot.drafts).filter(
    (draft) => draft.matchId === selectedMatch?.id && draft.id !== selectedDraft?.id
  );
  const heroById = new Map((adapterDetail?.heroes ?? []).map((hero) => [hero.id, hero]));
  const phaseLabel =
    selectedDraft?.currentPhase?.label ??
    selectedDraft?.currentPhase?.id ??
    "No active phase";
  const blueBans = getLockedSelections({
    draftDetail,
    side: "BLUE",
    type: "BAN",
    heroById
  });
  const redBans = getLockedSelections({
    draftDetail,
    side: "RED",
    type: "BAN",
    heroById
  });
  const bluePicks = getLockedSelections({
    draftDetail,
    side: "BLUE",
    type: "PICK",
    heroById
  });
  const redPicks = getLockedSelections({
    draftDetail,
    side: "RED",
    type: "PICK",
    heroById
  });
  const reportedBans = getReportedSelections({
    summary: selectedDraft,
    type: "BAN",
    heroById
  });
  const reportedPicks = getReportedSelections({
    summary: selectedDraft,
    type: "PICK",
    heroById
  });

  return (
    <div className="stack">
      <Section
        title="Caster Panel"
        actions={
          <button className="refresh-button" type="button" onClick={() => void refreshPanel()}>
            Refresh
          </button>
        }
      >
        <div className="operator-status-row">
          <StatusPill tone={props.state.loadStatus === "ready" ? "good" : "warn"}>
            REST {props.state.loadStatus}
          </StatusPill>
          <StatusPill tone={getSocketTone(props.state.socketStatus)}>
            Realtime {props.state.socketStatus}
          </StatusPill>
          <StatusPill tone={props.state.health?.status === "OK" ? "good" : "warn"}>
            Server {props.state.health?.status ?? "UNKNOWN"}
          </StatusPill>
          <StatusPill tone={draftStatus === "error" || adapterStatus === "error" ? "warn" : "good"}>
            Detail {draftStatus === "error" || adapterStatus === "error" ? "Partial" : "Ready"}
          </StatusPill>
        </div>
        <dl className="metric-grid">
          <Metric label="Event" value={snapshot.event?.name ?? "Not loaded"} />
          <Metric label="Package" value={snapshot.eventPackageId ?? "Not loaded"} />
          <Metric label="Connected clients" value={props.state.health?.socketClients.length ?? 0} />
          <Metric label="Last update" value={formatDateTime(snapshot.timestamp)} />
        </dl>
        {props.state.socketError ? <p className="inline-warning">{props.state.socketError}</p> : null}
        {panelErrorCode ? (
          <p className="inline-warning">Detailed public draft data is partially unavailable ({panelErrorCode}).</p>
        ) : null}
      </Section>

      <Section title="Match Selection">
        <MatchSelector
          snapshot={snapshot}
          selectedMatch={selectedMatch}
          onMatchChange={(matchId) => {
            setSelectedMatchId(matchId);
            setSelectedGameId(null);
          }}
        />
      </Section>

      <Section title="Match Readout">
        <dl className="metric-grid">
          <Metric label="Match" value={selectedMatch?.title ?? "No match selected"} />
          <Metric label="Format" value={selectedMatch?.format ?? "Unknown"} />
          <Metric label="Status" value={selectedMatch?.status ?? "Unknown"} />
          <Metric
            label="Score"
            value={selectedMatch ? `${selectedMatch.score.blue} - ${selectedMatch.score.red}` : "Unknown"}
          />
          <Metric label="Current game" value={selectedGame ? `Game ${selectedGame.gameNumber}` : "Not selected"} />
          <Metric label="Game status" value={selectedGame?.status ?? "Unknown"} />
          <Metric label="Game code" value={selectedGame?.gameCode ?? selectedMatch?.gameCode ?? "Unknown"} />
          <Metric label="Ruleset" value={getRulesetLabel(snapshot, selectedGame?.rulesetId ?? selectedDraft?.rulesetId)} />
        </dl>
      </Section>

      <div className="card-grid card-grid--two">
        <TeamReadout title="Blue Team" team={blueTeam} players={bluePlayers} />
        <TeamReadout title="Red Team" team={redTeam} players={redPlayers} />
      </div>

      <Section title="Current Draft Summary">
        {!selectedDraft ? (
          <p className="empty-state">No public draft summary is available for the selected match.</p>
        ) : (
          <dl className="metric-grid">
            <Metric
              label="Draft status"
              value={<StatusPill tone={getDraftTone(selectedDraft.status)}>{selectedDraft.status}</StatusPill>}
            />
            <Metric label="Draft" value={selectedDraft.id} />
            <Metric label="Phase" value={phaseLabel} />
            <Metric label="Turn" value={formatSide(selectedDraft.currentPhase?.team)} />
            <Metric label="Timer" value={formatDuration(displayedTimer.remainingSeconds)} />
            <Metric label="Finalized actions" value={`${selectedDraft.actionCounts.locked} / ${selectedDraft.actionCounts.total}`} />
            <Metric label="Bans reported" value={selectedDraft.bannedHeroIds.length} />
            <Metric label="Picks reported" value={selectedDraft.pickedHeroIds.length} />
          </dl>
        )}
        {draftStatus === "loading" || adapterStatus === "loading" ? (
          <p className="empty-state">Loading public draft labels.</p>
        ) : null}
      </Section>

      <Section title="Picks and Bans">
        {!selectedDraft ? (
          <p className="empty-state">No picks or bans are available yet.</p>
        ) : !draftDetail ? (
          <div className="card-grid card-grid--two">
            <SelectionList title="Reported Bans" items={reportedBans} />
            <SelectionList title="Reported Picks" items={reportedPicks} />
          </div>
        ) : (
          <div className="card-grid">
            <SelectionList title="Blue Bans" items={blueBans} />
            <SelectionList title="Red Bans" items={redBans} />
            <SelectionList title="Blue Picks" items={bluePicks} />
            <SelectionList title="Red Picks" items={redPicks} />
          </div>
        )}
      </Section>

      <Section title="Completed Drafts">
        <CompletedDrafts drafts={matchDrafts} heroById={heroById} />
      </Section>
    </div>
  );
}
