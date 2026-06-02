import type { CSSProperties, ReactNode } from "react";
import type { Sponsor, Team, ThemeConfig } from "@mmbt/shared-types";

import type { OverlayClientState, OverlayMatch, OverlayRuntimeState } from "../client/types";

type ScoreBugOverlayState = "loading" | "missing-match" | "ready";
type ScoreBugSide = "blue" | "red";

interface ScoreBugTeamView {
  side: ScoreBugSide;
  sideLabel: "Blue" | "Red";
  team: Team | null;
  teamId: string | null;
  displayName: string;
  fullName: string;
  initials: string;
  logoUrl: string | null;
  scoreText: string;
}

export interface ScoreBugOverlayViewModel {
  state: ScoreBugOverlayState;
  routeMatchId: string;
  resolvedMatchId: string | null;
  match: OverlayMatch | null;
  blueTeam: ScoreBugTeamView;
  redTeam: ScoreBugTeamView;
  scoreText: string;
  scoreSource: "match.score" | "unavailable";
  gameLabel: string;
  formatLabel: string;
  statusLabel: string;
  contextLabel: string;
  eventLabel: string;
  sponsor: Sponsor | null;
  theme: ThemeConfig | null;
  connectionLabel: "connected" | "connecting" | "disconnected" | "error" | "stale";
  revision: number | null;
  lastUpdatedAt: string | null;
  warnings: string[];
}

const DEFAULT_THEME: ThemeConfig = {
  id: "overlay-scorebug-default",
  name: "Overlay Score Bug Default",
  version: "0.1.0",
  colors: {
    background: "transparent",
    primary: "#2563eb",
    secondary: "#dc2626",
    accent: "#facc15",
    blueTeam: "#2563eb",
    redTeam: "#dc2626",
    textPrimary: "#f8fafc",
    textSecondary: "#cbd5e1"
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    numberFont: "Roboto Mono"
  },
  layout: {
    safeMarginPx: 64,
    borderRadiusPx: 8,
    animationSpeedMs: 250
  },
  assets: {}
};

function formatStatus(value: string | null | undefined): string {
  if (!value) {
    return "Standby";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isSafeLocalAssetPath(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();

  return (
    trimmed.length > 0 &&
    !/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) &&
    !trimmed.startsWith("//") &&
    !trimmed.includes("\\") &&
    !trimmed.includes("..")
  );
}

function toBrowserLocalAssetPath(value: string | undefined): string | null {
  if (!isSafeLocalAssetPath(value)) {
    return null;
  }

  return value.startsWith("/") ? value : `/${value}`;
}

function getTeamDisplayName(team: Team | null, fallback: string): string {
  return team?.shortName || team?.name || fallback;
}

function getTeamFullName(team: Team | null, fallback: string): string {
  return team?.name || team?.shortName || fallback;
}

function getTeamInitials(team: Team | null, fallback: string): string {
  const source = team?.shortName || team?.name || fallback;
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return initials || fallback;
}

function findTeam(state: OverlayRuntimeState, teamId: string | undefined): Team | null {
  return state.teams.find((team) => team.id === teamId) ?? null;
}

function findTheme(state: OverlayRuntimeState, match: OverlayMatch): ThemeConfig | null {
  if (match.themeId) {
    const theme = state.themes.find((candidate) => candidate.id === match.themeId);

    if (theme) {
      return theme;
    }
  }

  return state.themes[0] ?? null;
}

function findSponsor(state: OverlayRuntimeState, match: OverlayMatch): Sponsor | null {
  const linkedSponsorIds = new Set(match.sponsorSlotIds ?? []);
  const linkedSponsor = state.sponsors.find(
    (sponsor) =>
      linkedSponsorIds.has(sponsor.id) &&
      (sponsor.slots.includes("SCORE_BUG") || sponsor.slots.includes("PRESENTED_BY"))
  );

  if (linkedSponsor) {
    return linkedSponsor;
  }

  return (
    state.sponsors.find(
      (sponsor) => sponsor.slots.includes("SCORE_BUG") || sponsor.slots.includes("PRESENTED_BY")
    ) ?? null
  );
}

function readScoreValue(value: unknown): string {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? String(value) : "-";
}

function scoreHasInvalidValue(match: OverlayMatch): boolean {
  const score = (match as { score?: { blue?: unknown; red?: unknown } }).score;

  return readScoreValue(score?.blue) === "-" || readScoreValue(score?.red) === "-";
}

function getFormatMaxGames(format: string | undefined): number | null {
  const match = /^BO(\d+)$/i.exec(format ?? "");

  if (!match) {
    return null;
  }

  const value = Number(match[1]);

  return Number.isInteger(value) && value > 0 ? value : null;
}

function getGameLabel(match: OverlayMatch): string {
  const currentGameNumber = match.currentGameNumber;

  if (!Number.isInteger(currentGameNumber) || currentGameNumber <= 0) {
    return "Game -";
  }

  const maxGames = getFormatMaxGames(match.format);

  return maxGames ? `Game ${currentGameNumber} of ${maxGames}` : `Game ${currentGameNumber}`;
}

function getEventLabel(snapshot: OverlayRuntimeState): string {
  return snapshot.event?.shortName || snapshot.event?.name || "Local Event";
}

function getConnectionLabel(
  clientState: OverlayClientState,
  hasSnapshot: boolean
): ScoreBugOverlayViewModel["connectionLabel"] {
  if (
    hasSnapshot &&
    (clientState.socketStatus === "disconnected" || clientState.socketStatus === "error")
  ) {
    return "stale";
  }

  return clientState.socketStatus;
}

function createTeamView({
  side,
  team,
  teamId,
  scoreText
}: {
  side: ScoreBugSide;
  team: Team | null;
  teamId: string | null;
  scoreText: string;
}): ScoreBugTeamView {
  const sideLabel = side === "blue" ? "Blue" : "Red";
  const fallback = side === "blue" ? "BLU" : "RED";

  return {
    side,
    sideLabel,
    team,
    teamId,
    displayName: getTeamDisplayName(team, fallback),
    fullName: getTeamFullName(team, `${sideLabel} Team`),
    initials: getTeamInitials(team, fallback),
    logoUrl: toBrowserLocalAssetPath(team?.logoUrl),
    scoreText
  };
}

function createEmptyTeamView(side: ScoreBugSide): ScoreBugTeamView {
  return createTeamView({
    side,
    team: null,
    teamId: null,
    scoreText: "-"
  });
}

export function selectScoreBugOverlayViewModel(
  clientState: OverlayClientState,
  matchId: string | undefined
): ScoreBugOverlayViewModel {
  const routeMatchId = matchId ?? "";
  const snapshot = clientState.snapshot;

  if (!snapshot) {
    return {
      state: "loading",
      routeMatchId,
      resolvedMatchId: null,
      match: null,
      blueTeam: createEmptyTeamView("blue"),
      redTeam: createEmptyTeamView("red"),
      scoreText: "-",
      scoreSource: "unavailable",
      gameLabel: "Game -",
      formatLabel: "Format -",
      statusLabel: "Standby",
      contextLabel: "Waiting for signal",
      eventLabel: "Local Event",
      sponsor: null,
      theme: null,
      connectionLabel: getConnectionLabel(clientState, false),
      revision: null,
      lastUpdatedAt: clientState.lastUpdatedAt,
      warnings: ["No runtime state snapshot has been received."]
    };
  }

  const match = snapshot.matches.find((candidate) => candidate.id === routeMatchId) ?? null;

  if (!match) {
    return {
      state: "missing-match",
      routeMatchId,
      resolvedMatchId: null,
      match: null,
      blueTeam: createEmptyTeamView("blue"),
      redTeam: createEmptyTeamView("red"),
      scoreText: "-",
      scoreSource: "unavailable",
      gameLabel: "Game -",
      formatLabel: "Format -",
      statusLabel: "Standby",
      contextLabel: "Match not found",
      eventLabel: getEventLabel(snapshot),
      sponsor: null,
      theme: snapshot.themes[0] ?? null,
      connectionLabel: getConnectionLabel(clientState, true),
      revision: snapshot.revision,
      lastUpdatedAt: clientState.lastUpdatedAt ?? snapshot.timestamp,
      warnings: ["The requested match ID was not found in public runtime state."]
    };
  }

  const blueScore = readScoreValue((match as { score?: { blue?: unknown } }).score?.blue);
  const redScore = readScoreValue((match as { score?: { red?: unknown } }).score?.red);
  const blueTeam = findTeam(snapshot, match.teams.blue);
  const redTeam = findTeam(snapshot, match.teams.red);
  const warnings: string[] = [];

  if (!blueTeam) {
    warnings.push("Blue team was not found in public runtime state.");
  }

  if (!redTeam) {
    warnings.push("Red team was not found in public runtime state.");
  }

  if (scoreHasInvalidValue(match)) {
    warnings.push("Match score is missing or invalid.");
  }

  return {
    state: "ready",
    routeMatchId,
    resolvedMatchId: match.id,
    match,
    blueTeam: createTeamView({
      side: "blue",
      team: blueTeam,
      teamId: match.teams.blue,
      scoreText: blueScore
    }),
    redTeam: createTeamView({
      side: "red",
      team: redTeam,
      teamId: match.teams.red,
      scoreText: redScore
    }),
    scoreText: `${blueScore}-${redScore}`,
    scoreSource: scoreHasInvalidValue(match) ? "unavailable" : "match.score",
    gameLabel: getGameLabel(match),
    formatLabel: match.format || "Format -",
    statusLabel: formatStatus(match.status),
    contextLabel: match.title,
    eventLabel: getEventLabel(snapshot),
    sponsor: findSponsor(snapshot, match),
    theme: findTheme(snapshot, match),
    connectionLabel: getConnectionLabel(clientState, true),
    revision: snapshot.revision,
    lastUpdatedAt: clientState.lastUpdatedAt ?? snapshot.timestamp,
    warnings
  };
}

function ScoreBugStandby({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <section className="scorebug-overlay scorebug-overlay--standby" aria-live="polite">
      <div className="scorebug-standby">
        <p>Score Bug</p>
        <h1>{title}</h1>
        <span>{subtitle}</span>
        {children}
      </div>
    </section>
  );
}

function TeamLogo({ team }: { team: ScoreBugTeamView }) {
  return (
    <div className="scorebug-team-logo" data-team-logo={team.logoUrl ? "asset" : "fallback"}>
      {team.logoUrl ? <img src={team.logoUrl} alt="" aria-hidden="true" /> : null}
      <span>{team.initials}</span>
    </div>
  );
}

function TeamBlock({ team }: { team: ScoreBugTeamView }) {
  return (
    <article
      className={`scorebug-team scorebug-team--${team.side}`}
      data-team-side={team.sideLabel.toUpperCase()}
      data-team-id={team.teamId ?? "missing"}
    >
      <TeamLogo team={team} />
      <div className="scorebug-team__copy">
        <span>{team.sideLabel}</span>
        <strong>{team.displayName}</strong>
        <small>{team.fullName}</small>
      </div>
    </article>
  );
}

function SponsorBadge({ sponsor }: { sponsor: Sponsor | null }) {
  if (!sponsor) {
    return null;
  }

  const logoUrl = toBrowserLocalAssetPath(sponsor.logoUrl);

  return (
    <div className="scorebug-sponsor" data-sponsor-id={sponsor.id}>
      {logoUrl ? <img src={logoUrl} alt="" aria-hidden="true" /> : null}
      <span>{sponsor.name}</span>
    </div>
  );
}

function ScoreBugDiagnostics({ viewModel }: { viewModel: ScoreBugOverlayViewModel }) {
  return (
    <aside className="scorebug-diagnostics" aria-label="Score bug diagnostics">
      <strong>Score Bug Diagnostics</strong>
      <dl>
        <div>
          <dt>Route match</dt>
          <dd>{viewModel.routeMatchId || "none"}</dd>
        </div>
        <div>
          <dt>Resolved</dt>
          <dd>{viewModel.resolvedMatchId ?? "none"}</dd>
        </div>
        <div>
          <dt>Score source</dt>
          <dd>{viewModel.scoreSource}</dd>
        </div>
        <div>
          <dt>Teams</dt>
          <dd>
            {viewModel.blueTeam.teamId ?? "missing"} / {viewModel.redTeam.teamId ?? "missing"}
          </dd>
        </div>
        <div>
          <dt>Connection</dt>
          <dd>{viewModel.connectionLabel}</dd>
        </div>
        <div>
          <dt>Revision</dt>
          <dd>{viewModel.revision ?? "none"}</dd>
        </div>
        <div>
          <dt>Last update</dt>
          <dd>{viewModel.lastUpdatedAt ?? "none"}</dd>
        </div>
        <div>
          <dt>Warnings</dt>
          <dd>{viewModel.warnings.length > 0 ? viewModel.warnings.join("; ") : "none"}</dd>
        </div>
      </dl>
    </aside>
  );
}

export function ScoreBugOverlay({
  clientState,
  matchId,
  debug
}: {
  clientState: OverlayClientState;
  matchId?: string;
  debug: boolean;
}) {
  const viewModel = selectScoreBugOverlayViewModel(clientState, matchId);
  const theme = viewModel.theme ?? DEFAULT_THEME;
  const style = {
    "--scorebug-blue": viewModel.blueTeam.team?.primaryColor ?? theme.colors.blueTeam,
    "--scorebug-red": viewModel.redTeam.team?.primaryColor ?? theme.colors.redTeam,
    "--scorebug-accent": theme.colors.accent,
    "--scorebug-text": theme.colors.textPrimary,
    "--scorebug-muted": theme.colors.textSecondary,
    "--scorebug-radius": `${theme.layout.borderRadiusPx}px`,
    "--scorebug-safe": `${theme.layout.safeMarginPx}px`,
    "--scorebug-font-heading": theme.typography.headingFont,
    "--scorebug-font-body": theme.typography.bodyFont,
    "--scorebug-font-number": theme.typography.numberFont ?? theme.typography.bodyFont
  } as CSSProperties;

  if (viewModel.state === "loading") {
    const disconnected =
      viewModel.connectionLabel === "disconnected" || viewModel.connectionLabel === "error";

    return (
      <>
        <ScoreBugStandby
          title={disconnected ? "Signal unavailable" : "Waiting for signal"}
          subtitle="Score bug state will appear when the server snapshot arrives."
        />
        {debug ? <ScoreBugDiagnostics viewModel={viewModel} /> : null}
      </>
    );
  }

  if (viewModel.state === "missing-match") {
    return (
      <>
        <ScoreBugStandby title="Match not found" subtitle="Safe score bug standby is active." />
        {debug ? <ScoreBugDiagnostics viewModel={viewModel} /> : null}
      </>
    );
  }

  return (
    <section
      className="scorebug-overlay scorebug-overlay--ready scorebug-overlay--compact"
      style={style}
      data-testid="scorebug-overlay"
      data-layout="fixed-compact"
      data-score-source={viewModel.scoreSource}
      data-match-id={viewModel.resolvedMatchId ?? "missing"}
      data-connection-state={viewModel.connectionLabel}
      aria-label="Score bug overlay"
    >
      <div className="scorebug-card">
        <div className="scorebug-context">
          <span>{viewModel.eventLabel}</span>
          <strong>{viewModel.contextLabel}</strong>
          <span>{viewModel.statusLabel}</span>
        </div>

        <div className="scorebug-main-row">
          <TeamBlock team={viewModel.blueTeam} />
          <div className="scorebug-score" aria-label="Current match score">
            <span>Series</span>
            <strong>
              <span>{viewModel.blueTeam.scoreText}</span>
              <b aria-hidden="true">-</b>
              <span>{viewModel.redTeam.scoreText}</span>
            </strong>
          </div>
          <TeamBlock team={viewModel.redTeam} />
        </div>

        <div className="scorebug-meta">
          <span>{viewModel.gameLabel}</span>
          <span>{viewModel.formatLabel}</span>
          <SponsorBadge sponsor={viewModel.sponsor} />
        </div>
      </div>
      {debug ? <ScoreBugDiagnostics viewModel={viewModel} /> : null}
    </section>
  );
}
