import { useState, type CSSProperties, type ReactNode } from "react";
import type {
  DraftAction,
  DraftActionStatus,
  DraftActionType,
  DraftRuleset,
  Hero,
  Team
} from "@mmbt/shared-types";

import type {
  OverlayClientState,
  OverlayDraftSummary,
  OverlayGame,
  OverlayMatch,
  OverlayRuntimeState
} from "../client/types";
import {
  selectMatchPresentationViewModel,
  toBrowserLocalAssetPath,
  type OverlayMatchPresentationViewModel,
  type OverlayPresentationPlayerViewModel,
  type OverlayPresentationSide,
  type OverlayPresentationTeamViewModel
} from "../state/presentationViewModel";
import {
  formatDraftTimer,
  useDraftTimerDisplay,
  type DraftTimerDisplay,
  type DraftTimerDisplayState
} from "./draftTimer";

type DraftOverlayState = "loading" | "missing-match" | "missing-draft" | "ready";
type DraftSide = "BLUE" | "RED";
type DraftSlotVisualState = "empty" | "active" | "done" | "skipped" | "hover" | "picked";
type RoleIconKind = "top" | "jungle" | "middle" | "bottom" | "utility";
type LocalImageLoadState = "idle" | "loaded" | "failed";

interface DraftOverlaySlot {
  action: DraftAction;
  hero: Hero | null;
  label: string;
  isActive: boolean;
  isNoBan: boolean;
  player: OverlayPresentationPlayerViewModel | null;
  playerLabel: string | null;
  playerRole: string | null;
}

interface VisualSlot {
  key: string;
  side: DraftSide;
  index: number;
  slot: DraftOverlaySlot | null;
  player: OverlayPresentationPlayerViewModel | null;
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
  presentation: OverlayMatchPresentationViewModel | null;
  warnings: string[];
}

const BAN_SLOT_COUNT = 5;
const PICK_SLOT_COUNT = 5;
const ROLE_ICON_PATH_BY_KIND: Record<RoleIconKind, string> = {
  top: "assets/role-icons/lol/position-top.svg",
  jungle: "assets/role-icons/lol/position-jungle.svg",
  middle: "assets/role-icons/lol/position-middle.svg",
  bottom: "assets/role-icons/lol/position-bottom.svg",
  utility: "assets/role-icons/lol/position-utility.svg"
};

function isDraftSide(value: unknown): value is DraftSide {
  return value === "BLUE" || value === "RED";
}

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
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

function getOverlayText(value: string | null | undefined): string {
  return hasText(value) ? value.trim().toUpperCase() : "";
}

function getImageFallbackText(hero: Hero | null): string {
  if (!hero) {
    return "";
  }

  const source = hero.displayName || hero.id;
  const compact = source.replace(/[^a-z0-9]/gi, "");

  return (compact || source).slice(0, 2).toUpperCase();
}

function getHeroAssetId(hero: Hero): string {
  const metadataId = hero.metadata?.dataDragonId;

  return typeof metadataId === "string" && metadataId.length > 0 ? metadataId : hero.id;
}

function resolveHeroSquare(hero: Hero | null): string | null {
  return toBrowserLocalAssetPath(hero?.squareUrl ?? hero?.iconUrl);
}

function resolveHeroSplash(hero: Hero | null): string | null {
  const configuredSplash = toBrowserLocalAssetPath(hero?.splashUrl);

  if (configuredSplash || !hero || hero.gameCode !== "lol") {
    return configuredSplash;
  }

  return `/assets/hero-splashes/lol/${encodeURIComponent(getHeroAssetId(hero))}.jpg`;
}

function resolveRoleIconKind(role: string | null | undefined): RoleIconKind | null {
  if (!role) {
    return null;
  }

  const normalized = role.trim().toLowerCase().replace(/[^a-z]/g, "");

  if (normalized === "top") {
    return "top";
  }

  if (normalized === "jungle" || normalized === "jg" || normalized === "jgl") {
    return "jungle";
  }

  if (normalized === "middle" || normalized === "mid") {
    return "middle";
  }

  if (normalized === "bottom" || normalized === "bot" || normalized === "adc") {
    return "bottom";
  }

  if (normalized === "support" || normalized === "sup" || normalized === "utility") {
    return "utility";
  }

  return null;
}

function resolveRoleIconUrl(role: string | null | undefined): string | null {
  const kind = resolveRoleIconKind(role);

  return kind ? toBrowserLocalAssetPath(ROLE_ICON_PATH_BY_KIND[kind]) : null;
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
  const draftId =
    game?.draftId ??
    (state.production.activeMatchId === match.id ? state.production.activeDraftId : null);

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

function isSkippedBan(action: DraftAction): boolean {
  return action.type === "BAN" && action.status === "SKIPPED";
}

function buildSlots(
  state: OverlayRuntimeState,
  draft: OverlayDraftSummary,
  ruleset: DraftRuleset | null
): DraftOverlaySlot[] {
  return getDraftActions(draft, ruleset, state.timestamp).map((action) => {
    const hero = findHero(state, action.heroId);
    const isNoBan = isSkippedBan(action);
    const heroLabel = isNoBan
      ? ""
      : hero?.displayName ?? (action.heroId ? formatEntityId(action.heroId) : "Awaiting selection");

    return {
      action,
      hero,
      label: heroLabel,
      isActive: draft.currentActionIds.includes(action.id),
      isNoBan,
      player: null,
      playerLabel: null,
      playerRole: null
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

function attachPlayersToPickSlots(
  slots: DraftOverlaySlot[],
  players: OverlayPresentationPlayerViewModel[]
): DraftOverlaySlot[] {
  return slots.map((slot, index) => {
    const player = players[index] ?? null;

    return {
      ...slot,
      player,
      playerLabel: player?.label ?? null,
      playerRole: player?.role ?? null
    };
  });
}

function getPhaseLabel(draft: OverlayDraftSummary | null, ruleset: DraftRuleset | null): string {
  if (!draft) {
    return "Draft standby";
  }

  const phase = draft.currentPhase ?? ruleset?.phases[draft.currentPhaseIndex] ?? null;

  return phase?.label ?? phase?.id ?? "Draft complete";
}

function getActiveSide(
  draft: OverlayDraftSummary | null,
  ruleset: DraftRuleset | null
): DraftSide | "NONE" {
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
      presentation: null,
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
      presentation: null,
      warnings: ["The requested match ID was not found in public runtime state."]
    };
  }

  const game = findCurrentGame(snapshot, match);
  const draft = findDraftForMatch(snapshot, match, game);
  const ruleset = findRuleset(snapshot, draft, game);
  const blueTeam = findTeam(snapshot, game?.blueTeamId ?? match.teams.blue);
  const redTeam = findTeam(snapshot, game?.redTeamId ?? match.teams.red);
  const presentation = selectMatchPresentationViewModel(snapshot, match);
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
  const bluePicks = draft
    ? attachPlayersToPickSlots(
        resolvePickSlotsForSide(slots, draft, "BLUE"),
        presentation.teams.BLUE.players
      )
    : [];
  const redPicks = draft
    ? attachPlayersToPickSlots(
        resolvePickSlotsForSide(slots, draft, "RED"),
        presentation.teams.RED.players
      )
    : [];

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
    presentation,
    warnings
  };
}

export function getDraftTimerBarScale(
  remainingSeconds: number | null | undefined,
  originalSeconds: number | null | undefined
): number {
  const remaining = Number(remainingSeconds);
  const original = Number(originalSeconds);

  if (!Number.isFinite(remaining) || !Number.isFinite(original) || original <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, remaining / original));
}

function isTimerBarVisible(
  draft: OverlayDraftSummary | null,
  timerDisplay: DraftTimerDisplay
): boolean {
  return (
    draft !== null &&
    draft.status !== "COMPLETE" &&
    draft.timer.isRunning &&
    (timerDisplay.timerState === "running" || timerDisplay.timerState === "expired")
  );
}

function getBanVisualState(slot: DraftOverlaySlot | null): DraftSlotVisualState {
  if (!slot) {
    return "empty";
  }

  if (slot.isNoBan) {
    return "skipped";
  }

  if (slot.action.status === "LOCKED") {
    return "done";
  }

  return slot.isActive ? "active" : "empty";
}

function getPickVisualState(slot: DraftOverlaySlot | null): DraftSlotVisualState {
  if (!slot) {
    return "empty";
  }

  if (slot.action.status === "LOCKED") {
    return "picked";
  }

  if (slot.action.status === "HOVER") {
    return "hover";
  }

  return "empty";
}

function getVisualSlots(
  slots: DraftOverlaySlot[],
  side: DraftSide,
  count: number,
  players: OverlayPresentationPlayerViewModel[] = []
): VisualSlot[] {
  return Array.from({ length: count }, (_, index) => {
    const slot = slots[index] ?? null;

    return {
      key: slot?.action.id ?? `${side.toLowerCase()}-placeholder-${index}`,
      side,
      index,
      slot,
      player: slot?.player ?? players[index] ?? null
    };
  });
}

function LocalAssetImage({
  src,
  className,
  onLoadStateChange
}: {
  src: string | null;
  className: string;
  onLoadStateChange?: (state: LocalImageLoadState) => void;
}) {
  const [loadState, setLoadState] = useState<LocalImageLoadState>("idle");

  if (!src) {
    return null;
  }

  const updateLoadState = (state: LocalImageLoadState) => {
    setLoadState(state);
    onLoadStateChange?.(state);
  };

  return (
    <img
      className={className}
      src={src}
      alt=""
      aria-hidden="true"
      data-load-state={loadState}
      onLoad={() => updateLoadState("loaded")}
      onError={() => updateLoadState("failed")}
    />
  );
}

function HeroSquare({ hero, className = "" }: { hero: Hero | null; className?: string }) {
  const [loadState, setLoadState] = useState<LocalImageLoadState>("idle");
  const squareUrl = resolveHeroSquare(hero);

  return (
    <span
      className={`draft-hero-square ${className}`.trim()}
      data-image-state={loadState}
      data-has-asset={squareUrl ? "true" : "false"}
      aria-hidden="true"
    >
      <LocalAssetImage
        src={squareUrl}
        className="draft-hero-square__image"
        onLoadStateChange={setLoadState}
      />
      <span className="draft-hero-square__fallback">{getImageFallbackText(hero)}</span>
    </span>
  );
}

function NeutralCrest() {
  return (
    <svg className="draft-neutral-crest" viewBox="0 0 54 54" aria-hidden="true">
      <path d="M27 5 44 11v13c0 11-6.8 19.3-17 24-10.2-4.7-17-13-17-24V11L27 5Z" />
      <path d="M27 13 37 17v8c0 6.5-3.8 11.7-10 15-6.2-3.3-10-8.5-10-15v-8l10-4Z" />
    </svg>
  );
}

function TeamLogo({
  team,
  side
}: {
  team: OverlayPresentationTeamViewModel | null;
  side: OverlayPresentationSide;
}) {
  const [loadState, setLoadState] = useState<LocalImageLoadState>("idle");
  const logoUrl = team?.localLogoUrl ?? null;

  return (
    <div
      className={`draft-center-logo draft-center-logo--${side.toLowerCase()}`}
      data-logo-state={loadState}
      data-logo-source={logoUrl ? "asset" : "fallback"}
    >
      <LocalAssetImage
        src={logoUrl}
        className="draft-center-logo__image"
        onLoadStateChange={setLoadState}
      />
      <NeutralCrest />
    </div>
  );
}

function RoleFallbackGlyph({ kind }: { kind: RoleIconKind | null }) {
  const glyphKind = kind ?? "utility";

  if (glyphKind === "top") {
    return (
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <path className="draft-role-glyph__bright" d="M18 4 30 16H6L18 4Z" />
        <path className="draft-role-glyph__dim" d="M10 19h16v12H10V19Z" />
      </svg>
    );
  }

  if (glyphKind === "jungle") {
    return (
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <path className="draft-role-glyph__bright" d="M18 4c7 5 10 10 10 16a10 10 0 0 1-20 0C8 14 11 9 18 4Z" />
        <path className="draft-role-glyph__dim" d="M18 12v19M11 22h14" />
      </svg>
    );
  }

  if (glyphKind === "middle") {
    return (
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <path className="draft-role-glyph__bright" d="M7 29 29 7" />
        <path className="draft-role-glyph__dim" d="M8 8h12M16 28h12" />
      </svg>
    );
  }

  if (glyphKind === "bottom") {
    return (
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <path className="draft-role-glyph__bright" d="M8 24 24 8l4 4-16 16H8v-4Z" />
        <path className="draft-role-glyph__dim" d="m22 10 4 4M8 28h12" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <path className="draft-role-glyph__bright" d="M18 5 28 15 18 31 8 15 18 5Z" />
      <path className="draft-role-glyph__dim" d="M13 15h10M18 5v26" />
    </svg>
  );
}

function RoleIcon({ role }: { role: string | null | undefined }) {
  const [loadState, setLoadState] = useState<LocalImageLoadState>("idle");
  const kind = resolveRoleIconKind(role);
  const roleIconUrl = resolveRoleIconUrl(role);

  return (
    <span
      className="draft-role-icon"
      data-role-kind={kind ?? "fallback"}
      data-image-state={loadState}
      aria-hidden="true"
    >
      <LocalAssetImage
        src={roleIconUrl}
        className="draft-role-icon__image"
        onLoadStateChange={setLoadState}
      />
      <span className="draft-role-icon__fallback">
        <RoleFallbackGlyph kind={kind} />
      </span>
    </span>
  );
}

function DraftHeroBackdrop({
  slot,
  side
}: {
  slot: DraftOverlaySlot | null;
  side: DraftSide;
}) {
  const [splashState, setSplashState] = useState<LocalImageLoadState>("idle");
  const hero = slot?.hero ?? null;
  const splashUrl = resolveHeroSplash(hero);
  const shouldShowFallback = splashState !== "loaded";

  return (
    <span
      className="draft-pick-art"
      data-side={side.toLowerCase()}
      data-splash-state={splashState}
      aria-hidden="true"
    >
      <LocalAssetImage
        src={splashUrl}
        className="draft-pick-art__splash"
        onLoadStateChange={setSplashState}
      />
      {shouldShowFallback ? (
        <span className="draft-pick-art__fallback">
          <HeroSquare hero={hero} className="draft-pick-art__square" />
        </span>
      ) : null}
    </span>
  );
}

function getPlayerName(visualSlot: VisualSlot): string {
  return getOverlayText(visualSlot.slot?.playerLabel ?? visualSlot.player?.label ?? null);
}

function BanSlot({ visualSlot }: { visualSlot: VisualSlot }) {
  const visualState = getBanVisualState(visualSlot.slot);
  const slot = visualSlot.slot;
  const hasHero = Boolean(slot?.hero);
  const side = visualSlot.side;

  return (
    <span
      className={`draft-ban-slot draft-ban-slot--${side.toLowerCase()}`}
      data-testid={slot ? `draft-slot-${slot.action.id}` : undefined}
      data-slot-kind="ban"
      data-slot-state={visualState}
      data-side={side.toLowerCase()}
      data-active-slot={slot?.isActive ? "true" : "false"}
      data-hero-source={hasHero ? "hero" : "none"}
      aria-hidden="true"
    >
      {hasHero ? <HeroSquare hero={slot?.hero ?? null} className="draft-ban-slot__hero" /> : null}
      {visualState === "done" ? <span className="draft-ban-slot__strike" /> : null}
    </span>
  );
}

function PickSlot({ visualSlot }: { visualSlot: VisualSlot }) {
  const visualState = getPickVisualState(visualSlot.slot);
  const playerName = getPlayerName(visualSlot);
  const role = visualSlot.slot?.playerRole ?? visualSlot.player?.role ?? null;
  const side = visualSlot.side;

  return (
    <article
      className={`draft-pick-slot draft-pick-slot--${side.toLowerCase()}`}
      data-testid={visualSlot.slot ? `draft-slot-${visualSlot.slot.action.id}` : undefined}
      data-slot-kind="pick"
      data-slot-state={visualState}
      data-side={side.toLowerCase()}
      data-player-role={resolveRoleIconKind(role) ?? "fallback"}
      aria-hidden="true"
    >
      {visualState === "empty" ? (
        <RoleIcon role={role} />
      ) : (
        <DraftHeroBackdrop slot={visualSlot.slot} side={side} />
      )}
      {visualState === "picked" ? <span className="draft-pick-slot__name-band" /> : null}
      {playerName ? <span className="draft-player-name">{playerName}</span> : null}
    </article>
  );
}

function BanStrip({
  side,
  slots
}: {
  side: DraftSide;
  slots: DraftOverlaySlot[];
}) {
  const visualSlots = getVisualSlots(slots, side, BAN_SLOT_COUNT);

  return (
    <div className={`draft-ban-strip draft-ban-strip--${side.toLowerCase()}`} aria-hidden="true">
      {visualSlots.map((visualSlot) => (
        <BanSlot key={visualSlot.key} visualSlot={visualSlot} />
      ))}
    </div>
  );
}

function SlotDividers() {
  return (
    <>
      {[1, 2, 3, 4].map((index) => (
        <span
          key={index}
          className="draft-slot-divider"
          style={{ left: `${index * 20}%` }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

function PickZone({
  side,
  slots,
  players
}: {
  side: DraftSide;
  slots: DraftOverlaySlot[];
  players: OverlayPresentationPlayerViewModel[];
}) {
  const visualSlots = getVisualSlots(slots, side, PICK_SLOT_COUNT, players);

  return (
    <div className={`draft-pick-zone draft-pick-zone--${side.toLowerCase()}`}>
      <SlotDividers />
      {visualSlots.map((visualSlot) => (
        <PickSlot key={visualSlot.key} visualSlot={visualSlot} />
      ))}
    </div>
  );
}

function FirstPickTag({ side }: { side: OverlayPresentationSide | null }) {
  if (!side) {
    return null;
  }

  return (
    <div className={`draft-first-pick draft-first-pick--${side.toLowerCase()}`}>
      {side === "BLUE" ? "\u2190 1ST PICK" : "1ST PICK \u2192"}
    </div>
  );
}

function CenterCaret() {
  return <span className="draft-center-caret" aria-hidden="true" />;
}

function CenterBlock({ presentation }: { presentation: OverlayMatchPresentationViewModel | null }) {
  const matchLabel = presentation
    ? `${getOverlayText(presentation.matchLabel)} / GAME ${presentation.gameNumber}`
    : "";
  const patchLabel = getOverlayText(presentation?.patchLabel ?? null);

  return (
    <div className="draft-center-block">
      <div className="draft-match-label">{matchLabel}</div>
      <FirstPickTag side={presentation?.firstPickSide ?? null} />
      <TeamLogo team={presentation?.teams.BLUE ?? null} side="BLUE" />
      <TeamLogo team={presentation?.teams.RED ?? null} side="RED" />
      <CenterCaret />
      <div className="draft-center-score draft-center-score--blue">
        {presentation?.scoreBySide.BLUE ?? 0}
      </div>
      <div className="draft-center-score draft-center-score--red">
        {presentation?.scoreBySide.RED ?? 0}
      </div>
      {patchLabel ? <div className="draft-patch-label">{patchLabel}</div> : null}
    </div>
  );
}

function TimerBar({
  draft,
  timerDisplay
}: {
  draft: OverlayDraftSummary | null;
  timerDisplay: DraftTimerDisplay;
}) {
  if (!isTimerBarVisible(draft, timerDisplay)) {
    return null;
  }

  const scale = getDraftTimerBarScale(
    timerDisplay.remainingSeconds,
    draft?.timer.originalSeconds
  );
  const style = { width: `${scale * 100}%` } satisfies CSSProperties;

  return (
    <div
      className="draft-turn-timer"
      data-testid="draft-turn-timer"
      data-timer-state={timerDisplay.timerState}
      data-timer-scale={scale.toFixed(3)}
      aria-hidden="true"
    >
      <span className="draft-turn-timer__fill" style={style} />
    </div>
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
        <p>DRAFT OVERLAY</p>
        <h1>{title}</h1>
        <span>{subtitle}</span>
        {children}
      </div>
    </section>
  );
}

function DraftDiagnostics({ viewModel }: { viewModel: DraftOverlayViewModel }) {
  const presentation = viewModel.presentation;
  const formatPlayerOrder = (players: OverlayPresentationPlayerViewModel[]) =>
    players.length > 0
      ? players
          .map((player, index) =>
            `${index + 1}. ${player.label}${player.role ? ` (${player.role})` : ""}${player.unresolved ? " [unresolved]" : ""}`
          )
          .join(", ")
      : "none";

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
        <div>
          <dt>Presentation</dt>
          <dd>{presentation?.matchLabel ?? "none"}</dd>
        </div>
        <div>
          <dt>Patch</dt>
          <dd>{presentation?.patchLabel ?? "none"}</dd>
        </div>
        <div>
          <dt>Series</dt>
          <dd>
            {presentation
              ? `${presentation.seriesFormat} Game ${presentation.gameNumber}`
              : "none"}
          </dd>
        </div>
        <div>
          <dt>Score</dt>
          <dd>
            {presentation
              ? `${presentation.scoreBySide.BLUE}-${presentation.scoreBySide.RED}`
              : "none"}
          </dd>
        </div>
        <div>
          <dt>First pick</dt>
          <dd>{presentation?.firstPickSide ?? "none"}</dd>
        </div>
        <div>
          <dt>Side status</dt>
          <dd>{presentation?.sideStatusLabel ?? "none"}</dd>
        </div>
        <div>
          <dt>Blue team</dt>
          <dd>{presentation?.teams.BLUE.shortName ?? "none"}</dd>
        </div>
        <div>
          <dt>Red team</dt>
          <dd>{presentation?.teams.RED.shortName ?? "none"}</dd>
        </div>
        <div>
          <dt>Blue players</dt>
          <dd>{presentation ? formatPlayerOrder(presentation.teams.BLUE.players) : "none"}</dd>
        </div>
        <div>
          <dt>Red players</dt>
          <dd>{presentation ? formatPlayerOrder(presentation.teams.RED.players) : "none"}</dd>
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

  if (viewModel.state === "missing-draft") {
    return (
      <>
        <section
          className="draft-overlay draft-overlay--standby"
          data-testid="draft-overlay"
          data-draft-status="missing"
          aria-live="polite"
        >
          <div className="draft-standby">
            <p>DRAFT STANDBY</p>
            <h1>Draft state unavailable</h1>
            <span>No draft will be created from this overlay.</span>
          </div>
        </section>
        {debug ? <DraftDiagnostics viewModel={viewModel} /> : null}
      </>
    );
  }

  const presentation = viewModel.presentation;

  return (
    <section
      className={`draft-overlay draft-overlay--${viewModel.draft?.status === "COMPLETE" ? "complete" : "live"}`}
      data-testid="draft-overlay"
      data-draft-status={viewModel.draft?.status.toLowerCase() ?? "missing"}
      data-active-side={viewModel.activeSide.toLowerCase()}
      aria-label="Draft overlay"
    >
      <BanStrip side="BLUE" slots={viewModel.blueBans} />
      <BanStrip side="RED" slots={viewModel.redBans} />
      <TimerBar draft={viewModel.draft} timerDisplay={timerDisplay} />

      <div className="draft-bottom-rail">
        <PickZone
          side="BLUE"
          slots={viewModel.bluePicks}
          players={presentation?.teams.BLUE.players ?? []}
        />
        <CenterBlock presentation={presentation} />
        <PickZone
          side="RED"
          slots={viewModel.redPicks}
          players={presentation?.teams.RED.players ?? []}
        />
      </div>

      {debug ? <DraftDiagnostics viewModel={viewModel} /> : null}
    </section>
  );
}
