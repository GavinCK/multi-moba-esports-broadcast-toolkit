import type { CSSProperties, ReactNode } from "react";
import type {
  DraftAction,
  DraftActionStatus,
  DraftActionType,
  DraftRuleset,
  Hero,
  Sponsor,
  Team,
  ThemeConfig
} from "@mmbt/shared-types";

import type {
  OverlayClientState,
  OverlayDraftSummary,
  OverlayGame,
  OverlayMatch,
  OverlayRuntimeState
} from "../client/types";
import {
  formatDraftTimer,
  useDraftTimerDisplay,
  type DraftTimerDisplayState
} from "./draftTimer";

type DraftOverlayState = "loading" | "missing-match" | "missing-draft" | "ready";
type DraftSide = "BLUE" | "RED";

interface DraftOverlaySlot {
  action: DraftAction;
  hero: Hero | null;
  label: string;
  sublabel: string;
  statusLabel: string;
  isActive: boolean;
  isManualOverride: boolean;
}

export interface DraftOverlayViewModel {
  state: DraftOverlayState;
  routeMatchId: string;
  match: OverlayMatch | null;
  game: OverlayGame | null;
  draft: OverlayDraftSummary | null;
  ruleset: DraftRuleset | null;
  blueTeam: Team | null;
  redTeam: Team | null;
  blueBans: DraftOverlaySlot[];
  redBans: DraftOverlaySlot[];
  bluePicks: DraftOverlaySlot[];
  redPicks: DraftOverlaySlot[];
  timerText: string;
  timerState: DraftTimerDisplayState;
  phaseLabel: string;
  activeSide: DraftSide | "NONE";
  activeSideLabel: string;
  draftStatusLabel: string;
  sponsor: Sponsor | null;
  theme: ThemeConfig | null;
  warnings: string[];
}

const DEFAULT_THEME: ThemeConfig = {
  id: "overlay-default",
  name: "Overlay Default",
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

function isDraftSide(value: unknown): value is DraftSide {
  return value === "BLUE" || value === "RED";
}

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

function formatEntityId(id: string): string {
  return id
    .replace(/^hero[_-]/, "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getTeamDisplayName(team: Team | null): string {
  return team?.shortName || team?.name || "TBD";
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

function resolveHeroIcon(hero: Hero | null): string | null {
  return toBrowserLocalAssetPath(hero?.squareUrl ?? hero?.iconUrl);
}

function resolveTeamLogo(team: Team | null): string | null {
  return toBrowserLocalAssetPath(team?.logoUrl);
}

function findCurrentGame(state: OverlayRuntimeState, match: OverlayMatch): OverlayGame | null {
  const gameFromMatch =
    match.games.find((game) => game.gameNumber === match.currentGameNumber) ?? match.games[0];

  if (gameFromMatch) {
    return gameFromMatch;
  }

  if (state.currentGameId) {
    const currentGame = state.games.find(
      (game) => game.id === state.currentGameId && game.matchId === match.id
    );

    if (currentGame) {
      return currentGame;
    }
  }

  if (state.production.activeMatchId === match.id && state.production.activeGameNumber) {
    return (
      state.games.find(
        (game) =>
          game.matchId === match.id && game.gameNumber === state.production.activeGameNumber
      ) ?? null
    );
  }

  return null;
}

function findDraftForMatch(
  state: OverlayRuntimeState,
  match: OverlayMatch,
  game: OverlayGame | null
): OverlayDraftSummary | null {
  const draftId = game?.draftId ?? (state.production.activeMatchId === match.id ? state.production.activeDraftId : null);

  if (draftId && state.drafts[draftId]) {
    return state.drafts[draftId];
  }

  if (game) {
    return (
      Object.values(state.drafts).find(
        (draft) => draft.matchId === match.id && draft.gameId === game.id
      ) ?? null
    );
  }

  return Object.values(state.drafts).find((draft) => draft.matchId === match.id) ?? null;
}

function findRuleset(
  state: OverlayRuntimeState,
  draft: OverlayDraftSummary | null,
  game: OverlayGame | null
): DraftRuleset | null {
  const rulesetId = draft?.rulesetId ?? game?.rulesetId;

  if (!rulesetId) {
    return null;
  }

  return state.rulesets.find((ruleset) => ruleset.id === rulesetId) ?? null;
}

function findTeam(state: OverlayRuntimeState, teamId: string | undefined): Team | null {
  return state.teams.find((team) => team.id === teamId) ?? null;
}

function findHero(state: OverlayRuntimeState, heroId: string | null): Hero | null {
  if (!heroId) {
    return null;
  }

  for (const adapter of state.adapters) {
    const hero = adapter.heroes?.find((candidate) => candidate.id === heroId);

    if (hero) {
      return hero;
    }
  }

  return null;
}

function findTheme(
  state: OverlayRuntimeState,
  match: OverlayMatch,
  game: OverlayGame | null
): ThemeConfig | null {
  const themeId = game?.themeId ?? match.themeId;

  if (themeId) {
    const theme = state.themes.find((candidate) => candidate.id === themeId);

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
      (sponsor.slots.includes("DRAFT") || sponsor.slots.includes("PRESENTED_BY"))
  );

  if (linkedSponsor) {
    return linkedSponsor;
  }

  return (
    state.sponsors.find(
      (sponsor) => sponsor.slots.includes("DRAFT") || sponsor.slots.includes("PRESENTED_BY")
    ) ?? null
  );
}

function getActionId(phaseId: string, slotIndex: number): string {
  return `${phaseId}:slot-${slotIndex}`;
}

function createSyntheticActions(
  draft: OverlayDraftSummary,
  ruleset: DraftRuleset | null,
  timestamp: string
): DraftAction[] {
  if (!ruleset) {
    return [];
  }

  let banIndex = 0;
  let pickIndex = 0;

  return ruleset.phases.flatMap((phase) => {
    if (phase.type !== "BAN" && phase.type !== "PICK") {
      return [];
    }

    return Array.from({ length: phase.count }, (_, slotIndex) => {
      const isBan = phase.type === "BAN";
      const heroId = isBan ? draft.bannedHeroIds[banIndex++] : draft.pickedHeroIds[pickIndex++];
      const actionId = getActionId(phase.id, slotIndex);
      const isCurrentAction = draft.currentActionIds.includes(actionId);
      const status: DraftActionStatus = heroId
        ? "LOCKED"
        : isCurrentAction && draft.actionCounts.hover > 0
          ? "HOVER"
          : "PENDING";

      return {
        id: actionId,
        phaseId: phase.id,
        type: phase.type,
        team: isDraftSide(phase.team) ? phase.team : "NONE",
        slotIndex,
        heroId: heroId ?? null,
        status,
        createdAt: draft.updatedAt ?? timestamp
      };
    });
  });
}

function getDraftActions(
  draft: OverlayDraftSummary,
  ruleset: DraftRuleset | null,
  timestamp: string
): DraftAction[] {
  return draft.actions && draft.actions.length > 0
    ? draft.actions
    : createSyntheticActions(draft, ruleset, timestamp);
}

function getSlotStatusLabel(action: DraftAction): string {
  switch (action.status) {
    case "LOCKED":
      return "Locked";
    case "HOVER":
      return "Hover";
    case "SKIPPED":
      return "Skipped";
    case "CANCELLED":
      return "Cancelled";
    case "PENDING":
    default:
      return "Pending";
  }
}

function getSlotSublabel(action: DraftAction): string {
  if (action.status === "SKIPPED") {
    return "Manual skip";
  }

  if (action.status === "CANCELLED") {
    return "Cancelled";
  }

  return `${formatStatus(action.type)} ${action.slotIndex + 1}`;
}

function isManualOverrideAction(action: DraftAction): boolean {
  return action.metadata?.manualOverride === true;
}

function buildSlots(
  state: OverlayRuntimeState,
  draft: OverlayDraftSummary,
  ruleset: DraftRuleset | null
): DraftOverlaySlot[] {
  return getDraftActions(draft, ruleset, state.timestamp).map((action) => {
    const hero = findHero(state, action.heroId);
    const heroLabel = hero?.displayName ?? (action.heroId ? formatEntityId(action.heroId) : "Awaiting selection");

    return {
      action,
      hero,
      label: heroLabel,
      sublabel: getSlotSublabel(action),
      statusLabel: getSlotStatusLabel(action),
      isActive: draft.currentActionIds.includes(action.id),
      isManualOverride: isManualOverrideAction(action)
    };
  });
}

function filterSlots(
  slots: DraftOverlaySlot[],
  team: DraftSide,
  actionType: DraftActionType
): DraftOverlaySlot[] {
  return slots.filter((slot) => slot.action.team === team && slot.action.type === actionType);
}

function getLockedPickSlotsByActionId(slots: DraftOverlaySlot[]): Map<string, DraftOverlaySlot> {
  return new Map(
    slots
      .filter(
        (slot) =>
          slot.action.type === "PICK" &&
          slot.action.status === "LOCKED" &&
          typeof slot.action.heroId === "string" &&
          slot.action.heroId.length > 0
      )
      .map((slot) => [slot.action.id, slot])
  );
}

function resolvePickSlotsForSide(
  slots: DraftOverlaySlot[],
  draft: OverlayDraftSummary,
  side: DraftSide
): DraftOverlaySlot[] {
  const pickSlots = filterSlots(slots, side, "PICK");
  const finalLineupOrder = draft.finalLineup?.finalLineupBySide?.[side];

  if (!Array.isArray(finalLineupOrder)) {
    return pickSlots;
  }

  const lockedPickSlotsByActionId = getLockedPickSlotsByActionId(pickSlots);

  if (finalLineupOrder.length !== lockedPickSlotsByActionId.size) {
    return pickSlots;
  }

  if (
    finalLineupOrder.some(
      (actionId) => typeof actionId !== "string" || actionId.length === 0
    )
  ) {
    return pickSlots;
  }

  const uniqueActionIds = new Set(finalLineupOrder);

  if (uniqueActionIds.size !== finalLineupOrder.length) {
    return pickSlots;
  }

  const orderedSlots = finalLineupOrder.map((actionId) => lockedPickSlotsByActionId.get(actionId));

  if (orderedSlots.some((slot) => slot === undefined)) {
    return pickSlots;
  }

  return orderedSlots as DraftOverlaySlot[];
}

function getPhaseLabel(draft: OverlayDraftSummary | null, ruleset: DraftRuleset | null): string {
  if (!draft) {
    return "Draft standby";
  }

  const phase = draft.currentPhase ?? ruleset?.phases[draft.currentPhaseIndex] ?? null;

  return phase?.label ?? phase?.id ?? "Draft complete";
}

function getActiveSide(draft: OverlayDraftSummary | null, ruleset: DraftRuleset | null): DraftSide | "NONE" {
  if (!draft || draft.status === "COMPLETE") {
    return "NONE";
  }

  const phase = draft.currentPhase ?? ruleset?.phases[draft.currentPhaseIndex] ?? null;

  return isDraftSide(phase?.team) ? phase.team : "NONE";
}

function getTimerState(draft: OverlayDraftSummary | null): DraftOverlayViewModel["timerState"] {
  if (!draft) {
    return "standby";
  }

  if (draft.status === "COMPLETE") {
    return "complete";
  }

  if (draft.status === "PAUSED" || !draft.timer.isRunning) {
    return "paused";
  }

  if (draft.timer.remainingSeconds <= 0) {
    return "expired";
  }

  return "running";
}

export function selectDraftOverlayViewModel(
  clientState: OverlayClientState,
  matchId: string | undefined
): DraftOverlayViewModel {
  const routeMatchId = matchId ?? "";
  const snapshot = clientState.snapshot;

  if (!snapshot) {
    return {
      state: "loading",
      routeMatchId,
      match: null,
      game: null,
      draft: null,
      ruleset: null,
      blueTeam: null,
      redTeam: null,
      blueBans: [],
      redBans: [],
      bluePicks: [],
      redPicks: [],
      timerText: "--:--",
      timerState: "standby",
      phaseLabel: "Waiting for signal",
      activeSide: "NONE",
      activeSideLabel: "Standby",
      draftStatusLabel: "Standby",
      sponsor: null,
      theme: null,
      warnings: ["No runtime state snapshot has been received."]
    };
  }

  const match = snapshot.matches.find((candidate) => candidate.id === routeMatchId) ?? null;

  if (!match) {
    return {
      state: "missing-match",
      routeMatchId,
      match: null,
      game: null,
      draft: null,
      ruleset: null,
      blueTeam: null,
      redTeam: null,
      blueBans: [],
      redBans: [],
      bluePicks: [],
      redPicks: [],
      timerText: "--:--",
      timerState: "standby",
      phaseLabel: "Match not found",
      activeSide: "NONE",
      activeSideLabel: "Standby",
      draftStatusLabel: "Standby",
      sponsor: null,
      theme: null,
      warnings: ["The requested match ID was not found in public runtime state."]
    };
  }

  const game = findCurrentGame(snapshot, match);
  const draft = findDraftForMatch(snapshot, match, game);
  const ruleset = findRuleset(snapshot, draft, game);
  const blueTeam = findTeam(snapshot, game?.blueTeamId ?? match.teams.blue);
  const redTeam = findTeam(snapshot, game?.redTeamId ?? match.teams.red);
  const theme = findTheme(snapshot, match, game);
  const sponsor = findSponsor(snapshot, match);
  const warnings: string[] = [];

  if (!game) {
    warnings.push("Current game linkage is unavailable.");
  }

  if (!draft) {
    warnings.push("Current draft state is unavailable.");
  }

  if (draft && !ruleset) {
    warnings.push("Draft ruleset was not found in public runtime state.");
  }

  const slots = draft ? buildSlots(snapshot, draft, ruleset) : [];
  const activeSide = getActiveSide(draft, ruleset);
  const bluePicks = draft ? resolvePickSlotsForSide(slots, draft, "BLUE") : [];
  const redPicks = draft ? resolvePickSlotsForSide(slots, draft, "RED") : [];

  return {
    state: draft ? "ready" : "missing-draft",
    routeMatchId,
    match,
    game,
    draft,
    ruleset,
    blueTeam,
    redTeam,
    blueBans: filterSlots(slots, "BLUE", "BAN"),
    redBans: filterSlots(slots, "RED", "BAN"),
    bluePicks,
    redPicks,
    timerText: draft ? formatDraftTimer(draft.timer.remainingSeconds) : "--:--",
    timerState: getTimerState(draft),
    phaseLabel: getPhaseLabel(draft, ruleset),
    activeSide,
    activeSideLabel: activeSide === "NONE" ? "Standby" : formatStatus(activeSide),
    draftStatusLabel: draft ? formatStatus(draft.status) : "Draft Standby",
    sponsor,
    theme,
    warnings
  };
}

function TeamLogo({ team, fallback }: { team: Team | null; fallback: string }) {
  const logo = resolveTeamLogo(team);
  const initials = getTeamInitials(team, fallback);

  return (
    <div className="draft-team-logo" data-team-logo={logo ? "asset" : "fallback"}>
      {logo ? <img src={logo} alt="" aria-hidden="true" /> : null}
      <span>{initials}</span>
    </div>
  );
}

function HeroIcon({ slot }: { slot: DraftOverlaySlot }) {
  const icon = resolveHeroIcon(slot.hero);
  const initials = slot.action.heroId ? formatEntityId(slot.action.heroId).slice(0, 2).toUpperCase() : "--";

  return (
    <div className="draft-slot__icon" data-hero-icon={icon ? "asset" : "fallback"}>
      {icon ? <img src={icon} alt="" aria-hidden="true" /> : null}
      <span>{initials}</span>
    </div>
  );
}

function SponsorMark({ sponsor }: { sponsor: Sponsor | null }) {
  if (!sponsor) {
    return <div className="draft-sponsor draft-sponsor--empty">Draft Sponsor</div>;
  }

  const logo = toBrowserLocalAssetPath(sponsor.logoUrl);

  return (
    <div className="draft-sponsor" data-sponsor-id={sponsor.id}>
      <span>Presented by</span>
      {logo ? <img src={logo} alt="" aria-hidden="true" /> : null}
      <strong>{sponsor.name}</strong>
    </div>
  );
}

function TeamHeader({
  side,
  team,
  isActive
}: {
  side: DraftSide;
  team: Team | null;
  isActive: boolean;
}) {
  const displayName = getTeamDisplayName(team);
  const contextLabel = team?.name && team.name !== displayName ? team.name : `${formatStatus(side)} Side`;

  return (
    <header className={`draft-team draft-team--${side.toLowerCase()}`} data-active-side={isActive ? side : undefined}>
      <TeamLogo team={team} fallback={side === "BLUE" ? "BLU" : "RED"} />
      <div>
        <span>{contextLabel}</span>
        <strong>{displayName}</strong>
      </div>
    </header>
  );
}

function SlotList({
  title,
  slots,
  variant
}: {
  title: string;
  slots: DraftOverlaySlot[];
  variant: "ban" | "pick";
}) {
  return (
    <section className={`draft-slots draft-slots--${variant}`} aria-label={title}>
      <h2>{title}</h2>
      <div className="draft-slots__grid">
        {slots.map((slot) => (
          <article
            key={slot.action.id}
            className={`draft-slot draft-slot--${slot.action.status.toLowerCase()} draft-slot--${variant}`}
            data-testid={`draft-slot-${slot.action.id}`}
            data-action-type={slot.action.type}
            data-team-side={slot.action.team}
            data-slot-status={slot.action.status}
            data-active-slot={slot.isActive ? "true" : "false"}
          >
            <HeroIcon slot={slot} />
            <div className="draft-slot__copy">
              <span>{slot.statusLabel}</span>
              <strong>{slot.label}</strong>
              <small>{slot.isManualOverride ? "Manual override" : slot.sublabel}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Standby({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <section className="draft-overlay draft-overlay--standby" aria-live="polite">
      <div className="draft-standby">
        <p>Draft Overlay</p>
        <h1>{title}</h1>
        <span>{subtitle}</span>
        {children}
      </div>
    </section>
  );
}

function DraftDiagnostics({ viewModel }: { viewModel: DraftOverlayViewModel }) {
  return (
    <aside className="draft-diagnostics" aria-label="Draft overlay diagnostics">
      <strong>Draft Diagnostics</strong>
      <dl>
        <div>
          <dt>Draft ID</dt>
          <dd>{viewModel.draft?.id ?? "none"}</dd>
        </div>
        <div>
          <dt>Phase</dt>
          <dd>{viewModel.phaseLabel}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{viewModel.draftStatusLabel}</dd>
        </div>
        <div>
          <dt>Warnings</dt>
          <dd>{viewModel.warnings.length > 0 ? viewModel.warnings.join("; ") : "none"}</dd>
        </div>
      </dl>
    </aside>
  );
}

export function DraftOverlay({
  clientState,
  matchId,
  debug
}: {
  clientState: OverlayClientState;
  matchId?: string;
  debug: boolean;
}) {
  const viewModel = selectDraftOverlayViewModel(clientState, matchId);
  const timerDisplay = useDraftTimerDisplay(viewModel.draft?.status, viewModel.draft?.timer);
  const theme = viewModel.theme ?? DEFAULT_THEME;
  const style = {
    "--draft-blue": viewModel.blueTeam?.primaryColor ?? theme.colors.blueTeam,
    "--draft-red": viewModel.redTeam?.primaryColor ?? theme.colors.redTeam,
    "--draft-accent": theme.colors.accent,
    "--draft-text": theme.colors.textPrimary,
    "--draft-muted": theme.colors.textSecondary,
    "--draft-radius": `${theme.layout.borderRadiusPx}px`,
    "--draft-safe": `${theme.layout.safeMarginPx}px`,
    "--draft-font-heading": theme.typography.headingFont,
    "--draft-font-body": theme.typography.bodyFont,
    "--draft-font-number": theme.typography.numberFont ?? theme.typography.bodyFont
  } as CSSProperties;

  if (viewModel.state === "loading") {
    return (
      <>
        <Standby title="Waiting for signal" subtitle="Draft state will appear when the server snapshot arrives." />
        {debug ? <DraftDiagnostics viewModel={viewModel} /> : null}
      </>
    );
  }

  if (viewModel.state === "missing-match") {
    return (
      <>
        <Standby title="Match not found" subtitle="Safe standby is active for this draft route." />
        {debug ? <DraftDiagnostics viewModel={viewModel} /> : null}
      </>
    );
  }

  const isComplete = viewModel.draft?.status === "COMPLETE";

  return (
    <section
      className={`draft-overlay draft-overlay--${isComplete ? "complete" : "live"} draft-overlay--${viewModel.state}`}
      style={style}
      data-testid="draft-overlay"
      data-draft-status={viewModel.draft?.status ?? "MISSING"}
      data-active-side={viewModel.activeSide}
      aria-label="Draft overlay"
    >
      <div className="draft-overlay__top">
        <TeamHeader side="BLUE" team={viewModel.blueTeam} isActive={viewModel.activeSide === "BLUE"} />
        <div className="draft-center">
          <SponsorMark sponsor={viewModel.sponsor} />
          <div className="draft-timer" data-timer-state={timerDisplay.timerState}>
            <span>{timerDisplay.timerState === "expired" ? "Expired" : viewModel.draftStatusLabel}</span>
            <strong>{timerDisplay.timerText}</strong>
          </div>
          <div className="draft-phase">
            <span>{viewModel.phaseLabel}</span>
            <strong>Active Side: {viewModel.activeSideLabel}</strong>
          </div>
        </div>
        <TeamHeader side="RED" team={viewModel.redTeam} isActive={viewModel.activeSide === "RED"} />
      </div>

      {viewModel.state === "missing-draft" ? (
        <div className="draft-missing-state">
          <p>Draft Standby</p>
          <strong>Draft state unavailable</strong>
          <span>Teams are loaded. No draft will be created from this overlay.</span>
        </div>
      ) : (
        <div className="draft-overlay__body">
          <div className="draft-side draft-side--blue">
            <SlotList title="Blue Bans" slots={viewModel.blueBans} variant="ban" />
            <SlotList title="Blue Picks" slots={viewModel.bluePicks} variant="pick" />
          </div>
          <div className="draft-final-status">
            <span>{isComplete ? "Draft Complete" : "Draft Status"}</span>
            <strong>{viewModel.draftStatusLabel}</strong>
            <small>{viewModel.match?.title ?? "Match"}</small>
          </div>
          <div className="draft-side draft-side--red">
            <SlotList title="Red Bans" slots={viewModel.redBans} variant="ban" />
            <SlotList title="Red Picks" slots={viewModel.redPicks} variant="pick" />
          </div>
        </div>
      )}

      {debug ? <DraftDiagnostics viewModel={viewModel} /> : null}
    </section>
  );
}
