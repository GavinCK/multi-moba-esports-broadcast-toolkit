import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { DraftAction, DraftActionType, DraftLineupSide, DraftState, Hero } from "@mmbt/shared-types";

import type { DashboardApiClient } from "../client/apiClient";
import { toDashboardApiError } from "../client/apiClient";
import type {
  DashboardAdapterDetail,
  DashboardDraftMutationResponse,
  DashboardDraftSnapshot,
  DashboardDraftSummary,
  DashboardGame,
  DashboardMatch,
  DashboardRuntimeState
} from "../client/types";
import { SafeLocalImage } from "../components/SafeLocalImage";
import type { DashboardClientState } from "../state/dashboardState";
import {
  findTeam,
  formatDateTime,
  formatDuration,
  formatTeamName,
  getAdapterForGameCode,
  getDraftForGame,
  getMatchById,
  getRulesetLabel,
  getSelectedMatch
} from "../state/selectors";
import { formatDraftActionSlotLabel } from "./actionLabels";
import { heroMatchesSearch } from "./heroSearch";
import { useDisplayedDraftTimer } from "./useDisplayedDraftTimer";

type AsyncStatus = "idle" | "loading" | "ready" | "error";

interface DraftOperatorError {
  code: string;
  message: string;
}

interface PendingConfirmation {
  title: string;
  message: string;
  confirmLabel: string;
  reasonLabel?: string;
  reasonRequired: boolean;
  confirmationText?: string;
  run(reason: string): Promise<void>;
}

const DRAFT_OPERATOR_PREFERRED_LOCALE = "zh-TW";
const DRAFT_LINEUP_SIDES = ["BLUE", "RED"] as const satisfies readonly DraftLineupSide[];

export interface DraftOperatorPanelProps {
  state: DashboardClientState;
  apiClient: DashboardApiClient;
  onRefresh(): void | Promise<void>;
  routeMatchId?: string | null;
}

function toPanelError(error: unknown): DraftOperatorError {
  const apiError = toDashboardApiError(error);

  return {
    code: apiError.code,
    message: apiError.message
  };
}

function getOperatorId(operatorLabel: string): string {
  const trimmed = operatorLabel.trim();

  return trimmed.length > 0 ? trimmed : "draft-operator";
}

function formatSide(team: DraftAction["team"] | string | undefined): string {
  switch (team) {
    case "BLUE":
      return "Blue";
    case "RED":
      return "Red";
    case "NONE":
      return "No side";
    default:
      return "Unknown";
  }
}

function formatActionType(type: DraftActionType | string | undefined): string {
  switch (type) {
    case "BAN":
      return "Ban";
    case "PICK":
      return "Pick";
    case "BREAK":
      return "Break";
    case "SIDE_SELECTION":
      return "Side selection";
    default:
      return "Action";
  }
}

function formatActionLabel(action: DraftAction | null | undefined, actions: readonly DraftAction[] = []): string {
  return formatDraftActionSlotLabel(action, actions);
}

function getHeroName(heroById: Map<string, Hero>, heroId: string | null | undefined): string {
  if (!heroId) {
    return "Empty";
  }

  const hero = heroById.get(heroId);

  return hero ? formatHeroDisplayLabel(hero) : heroId;
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

function getHeroMetadataString(hero: Hero, key: string): string | null {
  const value = hero.metadata?.[key];

  return typeof value === "string" ? value : null;
}

function getHeroPrimaryName(hero: Hero): string {
  const localizedName = hero.localizedNames?.[DRAFT_OPERATOR_PREFERRED_LOCALE]?.trim();

  return localizedName && localizedName.length > 0 ? localizedName : hero.displayName;
}

function getHeroSecondaryName(hero: Hero): string | null {
  const primaryName = getHeroPrimaryName(hero);

  return primaryName === hero.displayName ? null : hero.displayName;
}

function formatHeroDisplayLabel(hero: Hero): string {
  const secondaryName = getHeroSecondaryName(hero);

  return secondaryName ? `${getHeroPrimaryName(hero)} / ${secondaryName}` : hero.displayName;
}

function getHeroFallbackLabel(hero: Hero): string {
  const metadataFallback = getHeroMetadataString(hero, "fallbackLabel");

  if (metadataFallback && metadataFallback.trim().length > 0) {
    return metadataFallback.trim().slice(0, 4).toLocaleUpperCase();
  }

  const initials = hero.displayName
    .replace(/['.`]/g, "")
    .replace(/&/g, " ")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 3)
    .toLocaleUpperCase();

  return initials || hero.displayName.slice(0, 2).toLocaleUpperCase();
}

function resolveHeroIcon(hero: Hero): string | null {
  return toBrowserLocalAssetPath(hero.squareUrl ?? hero.iconUrl);
}

function HeroArtwork(props: { hero: Hero }): ReactNode {
  const icon = resolveHeroIcon(props.hero);

  return (
    <span className="hero-button__art" data-icon-path={icon ?? "fallback"}>
      <span aria-hidden="true" className="hero-button__fallback">
        {getHeroFallbackLabel(props.hero)}
      </span>
      <SafeLocalImage
        src={icon}
        alt={`${formatHeroDisplayLabel(props.hero)} icon`}
        className="hero-button__image"
      />
    </span>
  );
}

function getStatusTone(status: string | undefined): "good" | "warn" | "danger" | "neutral" {
  switch (status) {
    case "LIVE":
      return "good";
    case "PAUSED":
    case "READY":
      return "warn";
    case "CANCELLED":
      return "danger";
    default:
      return "neutral";
  }
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
  match: DashboardMatch | null,
  game: DashboardGame | null,
  selectedDraftId: string | null
): DashboardDraftSummary | null {
  const drafts = Object.values(snapshot.drafts);
  const selectedDraft = selectedDraftId ? snapshot.drafts[selectedDraftId] : null;

  if (selectedDraft) {
    return selectedDraft;
  }

  if (game) {
    const gameDraft = getDraftForGame(snapshot, game);

    if (gameDraft) {
      return gameDraft;
    }
  }

  const activeDraftId = snapshot.production.activeDraftId;

  if (activeDraftId && snapshot.drafts[activeDraftId]) {
    return snapshot.drafts[activeDraftId];
  }

  if (match) {
    return drafts.find((draft) => draft.matchId === match.id) ?? null;
  }

  return drafts[0] ?? null;
}

function DraftSelector(props: {
  snapshot: DashboardRuntimeState;
  selectedMatch: DashboardMatch | null;
  selectedGame: DashboardGame | null;
  selectedDraft: DashboardDraftSummary | null;
  selectedGameId: string | null;
  selectedDraftId: string | null;
  onMatchChange(matchId: string): void;
  onGameChange(gameId: string): void;
  onDraftChange(draftId: string): void;
}): ReactNode {
  const matchDrafts = Object.values(props.snapshot.drafts).filter(
    (draft) => !props.selectedMatch || draft.matchId === props.selectedMatch.id
  );

  return (
    <div className="operator-selector-grid">
      <label className="field-label">
        Match
        <select
          value={props.selectedMatch?.id ?? ""}
          onChange={(event) => props.onMatchChange(event.currentTarget.value)}
        >
          {props.snapshot.matches.map((match) => (
            <option key={match.id} value={match.id}>
              {match.title}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label">
        Game
        <select
          value={props.selectedGame?.id ?? props.selectedGameId ?? ""}
          onChange={(event) => props.onGameChange(event.currentTarget.value)}
          disabled={!props.selectedMatch || props.selectedMatch.games.length === 0}
        >
          {props.selectedMatch?.games.map((game) => (
            <option key={game.id} value={game.id}>
              Game {game.gameNumber} - {game.gameCode}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label">
        Draft
        <select
          value={props.selectedDraft?.id ?? props.selectedDraftId ?? ""}
          onChange={(event) => props.onDraftChange(event.currentTarget.value)}
          disabled={matchDrafts.length === 0}
        >
          {matchDrafts.length === 0 ? <option value="">No draft loaded</option> : null}
          {matchDrafts.map((draft) => (
            <option key={draft.id} value={draft.id}>
              {draft.id} ({draft.status})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function DraftSlotCard(props: {
  action: DraftAction;
  allActions: readonly DraftAction[];
  heroById: Map<string, Hero>;
  isCurrent: boolean;
}): ReactNode {
  return (
    <article className={`draft-slot-card${props.isCurrent ? " draft-slot-card--current" : ""}`}>
      <div>
        <strong>{formatActionLabel(props.action, props.allActions)}</strong>
        <span>{props.action.status}</span>
      </div>
      <p>{getHeroName(props.heroById, props.action.heroId)}</p>
    </article>
  );
}

function DraftSlotGroup(props: {
  title: string;
  actions: DraftAction[];
  allActions: readonly DraftAction[];
  heroById: Map<string, Hero>;
  currentActionIds: Set<string>;
}): ReactNode {
  return (
    <div>
      <h3 className="subsection-title">{props.title}</h3>
      {props.actions.length === 0 ? (
        <p className="empty-state">No {props.title.toLowerCase()} are generated for this draft.</p>
      ) : (
        <div className="draft-slot-grid">
          {props.actions.map((action) => (
            <DraftSlotCard
              key={action.id}
              action={action}
              allActions={props.allActions}
              heroById={props.heroById}
              isCurrent={props.currentActionIds.has(action.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getPickActionsForSide(draft: DraftState, side: DraftLineupSide): DraftAction[] {
  return draft.actions.filter((action) => action.type === "PICK" && action.team === side);
}

function getLockedPickActionsForSide(draft: DraftState, side: DraftLineupSide): DraftAction[] {
  return getPickActionsForSide(draft, side).filter((action) => action.status === "LOCKED" && action.heroId);
}

function hasLineupReadyPicks(draft: DraftState): boolean {
  return DRAFT_LINEUP_SIDES.every((side) => {
    const picks = getPickActionsForSide(draft, side);

    return picks.length > 0 && picks.every((action) => action.status === "LOCKED" && action.heroId);
  });
}

function getLineupActionIdsForSide(draft: DraftState, side: DraftLineupSide): string[] {
  return draft.finalLineup?.finalLineupBySide[side]
    ? [...(draft.finalLineup.finalLineupBySide[side] ?? [])]
    : getLockedPickActionsForSide(draft, side).map((action) => action.id);
}

function getLineupActionsForSide(draft: DraftState, side: DraftLineupSide): DraftAction[] {
  const actionsById = new Map(getLockedPickActionsForSide(draft, side).map((action) => [action.id, action]));

  return getLineupActionIdsForSide(draft, side)
    .map((actionId) => actionsById.get(actionId))
    .filter((action): action is DraftAction => Boolean(action));
}

function moveLineupActionId(actionIds: readonly string[], actionId: string, direction: -1 | 1): string[] {
  const currentIndex = actionIds.indexOf(actionId);
  const nextIndex = currentIndex + direction;

  if (currentIndex === -1 || nextIndex < 0 || nextIndex >= actionIds.length) {
    return [...actionIds];
  }

  const nextActionIds = [...actionIds];
  const current = nextActionIds[currentIndex];
  const target = nextActionIds[nextIndex];

  if (!current || !target) {
    return nextActionIds;
  }

  nextActionIds[currentIndex] = target;
  nextActionIds[nextIndex] = current;

  return nextActionIds;
}

function swapLineupActionIds(actionIds: readonly string[], firstActionId: string, secondActionId: string): string[] {
  const firstIndex = actionIds.indexOf(firstActionId);
  const secondIndex = actionIds.indexOf(secondActionId);

  if (firstIndex === -1 || secondIndex === -1 || firstIndex === secondIndex) {
    return [...actionIds];
  }

  const nextActionIds = [...actionIds];
  const first = nextActionIds[firstIndex];
  const second = nextActionIds[secondIndex];

  if (!first || !second) {
    return nextActionIds;
  }

  nextActionIds[firstIndex] = second;
  nextActionIds[secondIndex] = first;

  return nextActionIds;
}

function LineupCard(props: {
  action: DraftAction;
  allActions: readonly DraftAction[];
  heroById: Map<string, Hero>;
  slotIndex: number;
  confirmed: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  swapTargets: Array<{ actionId: string; label: string }>;
  onSwap(targetActionId: string): void;
  onMoveUp(): void;
  onMoveDown(): void;
}): ReactNode {
  const hero = props.action.heroId ? props.heroById.get(props.action.heroId) : null;
  const defaultSwapTargetId = props.swapTargets[0]?.actionId ?? "";
  const [selectedSwapTargetId, setSelectedSwapTargetId] = useState(defaultSwapTargetId);

  useEffect(() => {
    if (!props.swapTargets.some((target) => target.actionId === selectedSwapTargetId)) {
      setSelectedSwapTargetId(defaultSwapTargetId);
    }
  }, [defaultSwapTargetId, props.swapTargets, selectedSwapTargetId]);

  return (
    <article className={`lineup-card${props.confirmed ? " lineup-card--locked" : ""}`}>
      <div className="lineup-card__header">
        <strong>Lineup Slot {props.slotIndex + 1}</strong>
        <span>{props.confirmed ? "Locked" : "Editable"}</span>
      </div>
      <div className="lineup-card__body">
        {hero ? <HeroArtwork hero={hero} /> : null}
        <div className="lineup-card__copy">
          <strong>{hero ? getHeroPrimaryName(hero) : getHeroName(props.heroById, props.action.heroId)}</strong>
          {hero && getHeroSecondaryName(hero) ? (
            <span>{getHeroSecondaryName(hero)}</span>
          ) : null}
          <small>{formatActionLabel(props.action, props.allActions)}</small>
        </div>
      </div>
      {props.confirmed ? null : (
        <>
          <div className="lineup-card__swap">
            <label className="lineup-card__swap-label">
              Swap with
              <select
                value={selectedSwapTargetId}
                disabled={props.swapTargets.length === 0}
                onChange={(event) => setSelectedSwapTargetId(event.currentTarget.value)}
              >
                {props.swapTargets.map((target) => (
                  <option key={target.actionId} value={target.actionId}>
                    {target.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="secondary-button"
              type="button"
              disabled={selectedSwapTargetId.length === 0}
              onClick={() => props.onSwap(selectedSwapTargetId)}
            >
              Swap
            </button>
          </div>
          <div className="lineup-card__actions">
            <button
              className="secondary-button"
              type="button"
              disabled={!props.canMoveUp}
              onClick={props.onMoveUp}
            >
              Move Up
            </button>
            <button
              className="secondary-button"
              type="button"
              disabled={!props.canMoveDown}
              onClick={props.onMoveDown}
            >
              Move Down
            </button>
          </div>
        </>
      )}
    </article>
  );
}

function ConfirmationDialog(props: {
  pending: PendingConfirmation | null;
  reason: string;
  confirmationText: string;
  busy: boolean;
  onReasonChange(value: string): void;
  onConfirmationTextChange(value: string): void;
  onCancel(): void;
  onConfirm(): void;
}): ReactNode {
  if (!props.pending) {
    return null;
  }

  const confirmationMatches =
    !props.pending.confirmationText ||
    props.confirmationText.trim() === props.pending.confirmationText;
  const reasonMatches = !props.pending.reasonRequired || props.reason.trim().length > 0;
  const canConfirm = confirmationMatches && reasonMatches && !props.busy;

  return (
    <div className="modal-backdrop" role="presentation">
      <form
        className="confirmation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="draft-confirmation-title"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          if (canConfirm) {
            props.onConfirm();
          }
        }}
      >
        <h2 id="draft-confirmation-title">{props.pending.title}</h2>
        <p>{props.pending.message}</p>
        {props.pending.reasonLabel ? (
          <label className="field-label">
            {props.pending.reasonLabel}
            <input
              value={props.reason}
              onChange={(event) => props.onReasonChange(event.currentTarget.value)}
              placeholder={props.pending.reasonRequired ? "Required" : "Optional"}
            />
          </label>
        ) : null}
        {props.pending.confirmationText ? (
          <label className="field-label">
            Type {props.pending.confirmationText}
            <input
              value={props.confirmationText}
              onChange={(event) => props.onConfirmationTextChange(event.currentTarget.value)}
            />
          </label>
        ) : null}
        <div className="dialog-actions">
          <button className="secondary-button" type="button" onClick={props.onCancel}>
            Cancel
          </button>
          <button className="danger-button" type="submit" disabled={!canConfirm}>
            {props.pending.confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export function DraftOperatorPanel(props: DraftOperatorPanelProps): ReactNode {
  const snapshot = props.state.snapshot;
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(props.routeMatchId ?? null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [operatorLabel, setOperatorLabel] = useState("draft-operator");
  const [draftDetail, setDraftDetail] = useState<DashboardDraftSnapshot | null>(null);
  const [adapterDetail, setAdapterDetail] = useState<DashboardAdapterDetail | null>(null);
  const [draftLoadStatus, setDraftLoadStatus] = useState<AsyncStatus>("idle");
  const [adapterLoadStatus, setAdapterLoadStatus] = useState<AsyncStatus>("idle");
  const [mutationBusy, setMutationBusy] = useState(false);
  const [panelError, setPanelError] = useState<DraftOperatorError | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [confirmationReason, setConfirmationReason] = useState("");
  const [confirmationText, setConfirmationText] = useState("");

  useEffect(() => {
    if (props.routeMatchId) {
      setSelectedMatchId(props.routeMatchId);
    }
  }, [props.routeMatchId]);

  const selectedMatch = useMemo(() => {
    if (!snapshot) {
      return null;
    }

    return getMatchById(snapshot, selectedMatchId) ?? getSelectedMatch(snapshot, selectedMatchId);
  }, [selectedMatchId, snapshot]);

  const selectedGame = useMemo(() => {
    if (!snapshot || !selectedMatch) {
      return null;
    }

    return findPreferredGame(snapshot, selectedMatch, selectedGameId);
  }, [selectedGameId, selectedMatch, snapshot]);

  const selectedDraft = useMemo(() => {
    if (!snapshot) {
      return null;
    }

    return findPreferredDraft(snapshot, selectedMatch, selectedGame, selectedDraftId);
  }, [selectedDraftId, selectedGame, selectedMatch, snapshot]);

  useEffect(() => {
    if (!selectedMatch && snapshot?.matches[0]) {
      setSelectedMatchId(snapshot.matches[0].id);
    }
  }, [selectedMatch, snapshot]);

  useEffect(() => {
    if (selectedGame && selectedGame.id !== selectedGameId) {
      setSelectedGameId(selectedGame.id);
    }
  }, [selectedGame, selectedGameId]);

  useEffect(() => {
    if (selectedDraft && selectedDraft.id !== selectedDraftId) {
      setSelectedDraftId(selectedDraft.id);
    }
  }, [selectedDraft, selectedDraftId]);

  useEffect(() => {
    if (!selectedDraft?.id) {
      setDraftDetail(null);
      setDraftLoadStatus("idle");
      return undefined;
    }

    let isCancelled = false;
    setDraftLoadStatus("loading");

    props.apiClient
      .get<{ revision: number; draft: DashboardDraftSnapshot }>(`/api/drafts/${selectedDraft.id}`)
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setDraftDetail(response.draft);
        setDraftLoadStatus("ready");
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }

        setDraftDetail(null);
        setDraftLoadStatus("error");
        setPanelError(toPanelError(error));
      });

    return () => {
      isCancelled = true;
    };
  }, [props.apiClient, selectedDraft?.id, snapshot?.revision]);

  useEffect(() => {
    if (!selectedGame?.gameCode) {
      setAdapterDetail(null);
      setAdapterLoadStatus("idle");
      return undefined;
    }

    let isCancelled = false;
    setAdapterLoadStatus("loading");

    props.apiClient
      .get<DashboardAdapterDetail>(`/api/adapters/${selectedGame.gameCode}`)
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setAdapterDetail(response);
        setAdapterLoadStatus("ready");
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }

        setAdapterDetail(null);
        setAdapterLoadStatus("error");
        setPanelError(toPanelError(error));
      });

    return () => {
      isCancelled = true;
    };
  }, [props.apiClient, selectedGame?.gameCode]);

  const draft = draftDetail?.draft ?? null;
  const authoritativeTimer = draft?.timer ?? selectedDraft?.timer ?? null;
  const displayedTimer = useDisplayedDraftTimer(authoritativeTimer);

  const currentActionIds = useMemo(
    () => new Set(selectedDraft?.currentActionIds ?? draftDetail?.summary.currentActionIds ?? []),
    [draftDetail?.summary.currentActionIds, selectedDraft?.currentActionIds]
  );
  const currentActions = useMemo(
    () => draft?.actions.filter((action) => currentActionIds.has(action.id)) ?? [],
    [currentActionIds, draft?.actions]
  );
  const activeAction =
    currentActions.find((action) => action.id === selectedActionId) ??
    currentActions.find((action) => action.status !== "LOCKED") ??
    currentActions[0] ??
    null;

  useEffect(() => {
    if (activeAction && activeAction.id !== selectedActionId) {
      setSelectedActionId(activeAction.id);
    }
  }, [activeAction, selectedActionId]);

  const heroById = useMemo(() => {
    const heroes = adapterDetail?.heroes ?? [];

    return new Map(heroes.map((hero) => [hero.id, hero]));
  }, [adapterDetail?.heroes]);
  const selectedHero = selectedHeroId ? heroById.get(selectedHeroId) ?? null : null;
  const lockedHeroIds = useMemo(
    () => new Set(draft?.lockedHeroIds ?? selectedDraft?.lockedHeroIds ?? []),
    [draft?.lockedHeroIds, selectedDraft?.lockedHeroIds]
  );
  const allowDuplicateHeroes = adapterDetail?.rulesets.find((ruleset) => ruleset.id === selectedGame?.rulesetId)
    ?.allowDuplicateHeroes ?? false;
  const filteredHeroes = useMemo(() => {
    const heroes = adapterDetail?.heroes ?? [];

    return heroes.filter((hero) => heroMatchesSearch(hero, searchQuery));
  }, [adapterDetail?.heroes, searchQuery]);
  const actionHistory = draft?.history.slice(-8).reverse() ?? [];
  const phaseLabel =
    selectedDraft?.currentPhase?.label ??
    draftDetail?.summary.currentPhase?.label ??
    selectedDraft?.currentPhase?.id ??
    "No active phase";
  const blueTeam = findTeam(snapshot, selectedGame?.blueTeamId ?? selectedMatch?.teams.blue);
  const redTeam = findTeam(snapshot, selectedGame?.redTeamId ?? selectedMatch?.teams.red);
  const adapter = getAdapterForGameCode(snapshot, selectedGame?.gameCode);
  const canCreateDraft = Boolean(snapshot && selectedMatch && selectedGame && !selectedDraft && selectedGame.rulesetId);
  const canHover = Boolean(selectedDraft && selectedDraft.status === "LIVE" && activeAction && selectedHero);
  const canLock = canHover && activeAction?.status !== "LOCKED";
  const canSkipBan = Boolean(
    selectedDraft &&
      selectedDraft.status === "LIVE" &&
      activeAction?.type === "BAN" &&
      activeAction.status === "PENDING"
  );
  const currentHeroIsLocked = selectedHeroId ? lockedHeroIds.has(selectedHeroId) : false;

  function clearFeedback(): void {
    setPanelError(null);
    setSuccessMessage(null);
  }

  async function refreshAfterMutation(): Promise<void> {
    await Promise.resolve(props.onRefresh());
  }

  async function runMutation(
    successLabel: string,
    mutation: () => Promise<DashboardDraftMutationResponse>
  ): Promise<void> {
    clearFeedback();
    setMutationBusy(true);

    try {
      const response = await mutation();
      setDraftDetail(response.draft);
      setSelectedDraftId(response.draft.summary.id);
      setSuccessMessage(successLabel);
      await refreshAfterMutation();
    } catch (error) {
      setPanelError(toPanelError(error));
    } finally {
      setMutationBusy(false);
    }
  }

  function openConfirmation(pending: PendingConfirmation): void {
    setConfirmationReason("");
    setConfirmationText("");
    setPendingConfirmation(pending);
  }

  async function createDraft(): Promise<void> {
    if (!selectedGame || !selectedMatch) {
      return;
    }

    await runMutation("Draft created from loaded local match data.", () =>
      props.apiClient.post<DashboardDraftMutationResponse>("/api/drafts", {
        gameId: selectedGame.id,
        matchId: selectedMatch.id,
        gameCode: selectedGame.gameCode,
        rulesetId: selectedGame.rulesetId,
        operatorId: getOperatorId(operatorLabel)
      })
    );
  }

  function confirmStart(): void {
    if (!selectedDraft) {
      return;
    }

    openConfirmation({
      title: "Start Draft",
      message: "Start this draft only when the operator is ready to make live draft state active.",
      confirmLabel: "Start Draft",
      reasonRequired: false,
      run: async () =>
        runMutation("Draft start accepted by server.", () =>
          props.apiClient.post<DashboardDraftMutationResponse>(`/api/drafts/${selectedDraft.id}/start`, {
            operatorId: getOperatorId(operatorLabel),
            confirm: true
          })
        )
    });
  }

  async function pauseDraft(): Promise<void> {
    if (!selectedDraft) {
      return;
    }

    await runMutation("Draft pause accepted by server.", () =>
      props.apiClient.post<DashboardDraftMutationResponse>(`/api/drafts/${selectedDraft.id}/pause`, {
        operatorId: getOperatorId(operatorLabel)
      })
    );
  }

  async function resumeDraft(): Promise<void> {
    if (!selectedDraft) {
      return;
    }

    await runMutation("Draft resume accepted by server.", () =>
      props.apiClient.post<DashboardDraftMutationResponse>(`/api/drafts/${selectedDraft.id}/resume`, {
        operatorId: getOperatorId(operatorLabel)
      })
    );
  }

  async function hoverHero(): Promise<void> {
    if (!selectedDraft || !activeAction || !selectedHero) {
      return;
    }

    await runMutation("Hero hover accepted by server.", () =>
      props.apiClient.post<DashboardDraftMutationResponse>(
        `/api/drafts/${selectedDraft.id}/actions/${activeAction.id}/hover`,
        {
          heroId: selectedHero.id,
          operatorId: getOperatorId(operatorLabel)
        }
      )
    );
  }

  function confirmLock(): void {
    if (!selectedDraft || !activeAction || !selectedHero) {
      return;
    }

    openConfirmation({
      title: "Lock Hero",
      message: `Lock ${formatHeroDisplayLabel(selectedHero)} into ${formatActionLabel(
        activeAction,
        draft?.actions ?? currentActions
      )}. This changes final pick/ban state.`,
      confirmLabel: "Lock Hero",
      reasonRequired: false,
      run: async () =>
        runMutation("Hero lock accepted by server.", () =>
          props.apiClient.post<DashboardDraftMutationResponse>(
            `/api/drafts/${selectedDraft.id}/actions/${activeAction.id}/lock`,
            {
              heroId: selectedHero.id,
              operatorId: getOperatorId(operatorLabel),
              confirm: true
            }
          )
        )
    });
  }

  function confirmSkipBan(): void {
    if (!selectedDraft || !activeAction || activeAction.type !== "BAN") {
      return;
    }

    openConfirmation({
      title: "No Ban",
      message: `Forfeit ${formatActionLabel(
        activeAction,
        draft?.actions ?? currentActions
      )}. The ban slot will remain empty and the draft will advance normally when the phase is complete.`,
      confirmLabel: "No Ban",
      reasonRequired: false,
      run: async () =>
        runMutation("No Ban accepted by server.", () =>
          props.apiClient.post<DashboardDraftMutationResponse>(
            `/api/drafts/${selectedDraft.id}/actions/${activeAction.id}/skip`,
            {
              operatorId: getOperatorId(operatorLabel),
              confirm: true
            }
          )
        )
    });
  }

  function confirmUndo(): void {
    if (!selectedDraft) {
      return;
    }

    openConfirmation({
      title: "Undo Locked Action",
      message: "Undo changes the last locked draft action. Confirm only after referee/operator approval.",
      confirmLabel: "Undo",
      reasonLabel: "Reason",
      reasonRequired: true,
      run: async (reason) =>
        runMutation("Undo accepted by server.", () =>
          props.apiClient.post<DashboardDraftMutationResponse>(`/api/drafts/${selectedDraft.id}/undo`, {
            operatorId: getOperatorId(operatorLabel),
            confirm: true,
            reason
          })
        )
    });
  }

  function confirmRedo(): void {
    if (!selectedDraft) {
      return;
    }

    openConfirmation({
      title: "Redo Locked Action",
      message: "Redo reapplies the last undone draft action. Confirm before changing locked state.",
      confirmLabel: "Redo",
      reasonLabel: "Reason",
      reasonRequired: true,
      run: async (reason) =>
        runMutation("Redo accepted by server.", () =>
          props.apiClient.post<DashboardDraftMutationResponse>(`/api/drafts/${selectedDraft.id}/redo`, {
            operatorId: getOperatorId(operatorLabel),
            confirm: true,
            reason
          })
        )
    });
  }

  function confirmReset(): void {
    if (!selectedDraft) {
      return;
    }

    openConfirmation({
      title: "Reset Draft",
      message: "Reset clears draft actions back to ready state. It does not delete the append-only audit log.",
      confirmLabel: "Reset Draft",
      reasonLabel: "Reason",
      reasonRequired: true,
      confirmationText: "RESET_DRAFT",
      run: async (reason) =>
        runMutation("Reset accepted by server.", () =>
          props.apiClient.post<DashboardDraftMutationResponse>(`/api/drafts/${selectedDraft.id}/reset`, {
            operatorId: getOperatorId(operatorLabel),
            confirm: true,
            confirmationText: "RESET_DRAFT",
            reason
          })
        )
    });
  }

  function confirmComplete(): void {
    if (!selectedDraft) {
      return;
    }

    openConfirmation({
      title: "Complete Draft",
      message: "Complete finalizes the draft result. It will not auto-fill missing picks or bans.",
      confirmLabel: "Complete Draft",
      reasonLabel: "Reason",
      reasonRequired: false,
      run: async (reason) =>
        runMutation("Complete accepted by server.", () =>
          props.apiClient.post<DashboardDraftMutationResponse>(`/api/drafts/${selectedDraft.id}/complete`, {
            operatorId: getOperatorId(operatorLabel),
            confirm: true,
            ...(reason.trim().length > 0 ? { reason } : {})
          })
        )
    });
  }

  async function reorderLineupSide(side: DraftLineupSide, actionIds: string[]): Promise<void> {
    if (!selectedDraft) {
      return;
    }

    await runMutation("Final lineup order accepted by server.", () =>
      props.apiClient.post<DashboardDraftMutationResponse>(`/api/drafts/${selectedDraft.id}/lineup/reorder`, {
        side,
        actionIds,
        operatorId: getOperatorId(operatorLabel)
      })
    );
  }

  async function moveLineupAction(side: DraftLineupSide, actionId: string, direction: -1 | 1): Promise<void> {
    if (!draft) {
      return;
    }

    const currentOrder = getLineupActionIdsForSide(draft, side);
    const nextOrder = moveLineupActionId(currentOrder, actionId, direction);

    if (nextOrder.join("|") === currentOrder.join("|")) {
      return;
    }

    await reorderLineupSide(side, nextOrder);
  }

  async function swapLineupAction(
    side: DraftLineupSide,
    firstActionId: string,
    secondActionId: string
  ): Promise<void> {
    if (!draft) {
      return;
    }

    const currentOrder = getLineupActionIdsForSide(draft, side);
    const nextOrder = swapLineupActionIds(currentOrder, firstActionId, secondActionId);

    if (nextOrder.join("|") === currentOrder.join("|")) {
      return;
    }

    await reorderLineupSide(side, nextOrder);
  }

  async function resetLineupSide(side: DraftLineupSide): Promise<void> {
    if (!selectedDraft) {
      return;
    }

    await runMutation("Final lineup side reset to pick order.", () =>
      props.apiClient.post<DashboardDraftMutationResponse>(`/api/drafts/${selectedDraft.id}/lineup/reset`, {
        side,
        operatorId: getOperatorId(operatorLabel)
      })
    );
  }

  async function confirmFinalLineup(): Promise<void> {
    if (!selectedDraft) {
      return;
    }

    await runMutation("Final lineup confirmed and locked.", () =>
      props.apiClient.post<DashboardDraftMutationResponse>(`/api/drafts/${selectedDraft.id}/lineup/confirm`, {
        operatorId: getOperatorId(operatorLabel),
        confirm: true
      })
    );
  }

  async function confirmPendingAction(): Promise<void> {
    const pending = pendingConfirmation;

    if (!pending) {
      return;
    }

    await pending.run(confirmationReason.trim());
    setPendingConfirmation(null);
  }

  if (!snapshot) {
    return (
      <Section title="Draft Operator">
        <p className="empty-state">Waiting for server state before showing draft controls.</p>
      </Section>
    );
  }

  const banActions = draft?.actions.filter((action) => action.type === "BAN") ?? [];
  const pickActions = draft?.actions.filter((action) => action.type === "PICK") ?? [];
  const lineupVisible = Boolean(selectedDraft?.finalLineup || (draft && (draft.finalLineup || hasLineupReadyPicks(draft))));
  const lineupConfirmed = (draft?.finalLineup?.status ?? selectedDraft?.finalLineup?.status) === "CONFIRMED";
  const draftActionWorkspaceVisible = !lineupVisible;

  return (
    <div className="stack">
      <Section
        title="Draft Operator"
        actions={
          <button className="refresh-button" type="button" onClick={() => void refreshAfterMutation()}>
            Manual Refresh
          </button>
        }
      >
        <div className="operator-status-row">
          <StatusPill tone={props.state.loadStatus === "ready" ? "good" : "warn"}>
            REST {props.state.loadStatus}
          </StatusPill>
          <StatusPill tone={props.state.socketStatus === "connected" ? "good" : "warn"}>
            Realtime {props.state.socketStatus}
          </StatusPill>
          <StatusPill tone={adapter?.loaded ? "good" : "warn"}>
            Adapter {adapter?.loaded ? "loaded" : "review"}
          </StatusPill>
        </div>

        <dl className="metric-grid">
          <Metric label="Event" value={snapshot.event?.name ?? "Not loaded"} />
          <Metric label="Package" value={snapshot.eventPackageId ?? "Not loaded"} />
          <Metric label="Loaded games" value={snapshot.event?.gameCodes.join(", ") ?? "None"} />
          <Metric label="Last state update" value={formatDateTime(snapshot.timestamp)} />
        </dl>
      </Section>

      {panelError ? (
        <div className="banner banner--error" role="alert">
          <strong>{panelError.code}</strong>
          <span>{panelError.message}</span>
        </div>
      ) : null}
      {successMessage ? (
        <div className="banner banner--success" role="status">
          {successMessage}
        </div>
      ) : null}

      <Section title="Draft Selection">
        <div className="stack">
          <DraftSelector
            snapshot={snapshot}
            selectedMatch={selectedMatch}
            selectedGame={selectedGame}
            selectedDraft={selectedDraft}
            selectedGameId={selectedGameId}
            selectedDraftId={selectedDraftId}
            onMatchChange={(matchId) => {
              setSelectedMatchId(matchId);
              setSelectedGameId(null);
              setSelectedDraftId(null);
            }}
            onGameChange={(gameId) => {
              setSelectedGameId(gameId);
              setSelectedDraftId(null);
            }}
            onDraftChange={setSelectedDraftId}
          />

          <label className="field-label field-label--narrow">
            Operator label
            <input
              value={operatorLabel}
              onChange={(event) => setOperatorLabel(event.currentTarget.value)}
            />
          </label>
        </div>
      </Section>

      <Section title="Current Draft">
        <dl className="metric-grid">
          <Metric label="Match" value={selectedMatch?.title ?? "No match selected"} />
          <Metric label="Current game" value={selectedGame ? `Game ${selectedGame.gameNumber}` : "Not selected"} />
          <Metric label="Blue team" value={formatTeamName(blueTeam)} />
          <Metric label="Red team" value={formatTeamName(redTeam)} />
          <Metric label="Draft status" value={<StatusPill tone={getStatusTone(selectedDraft?.status)}>{selectedDraft?.status ?? "Missing"}</StatusPill>} />
          <Metric label="Current phase" value={phaseLabel} />
          <Metric label="Team turn" value={formatSide(selectedDraft?.currentPhase?.team)} />
          <Metric label="Action type" value={formatActionType(selectedDraft?.currentPhase?.type)} />
          {lineupVisible ? null : <Metric label="Timer" value={formatDuration(displayedTimer.remainingSeconds)} />}
          <Metric label="Ruleset" value={getRulesetLabel(snapshot, selectedGame?.rulesetId ?? selectedDraft?.rulesetId)} />
        </dl>

        {canCreateDraft ? (
          <p className="inline-warning">
            This game has no runtime draft yet.
            <button className="secondary-button inline-action" type="button" onClick={() => void createDraft()}>
              Create Draft
            </button>
          </p>
        ) : null}
      </Section>

      {draftActionWorkspaceVisible ? (
        <Section title="Manual Controls">
          <div className="operator-controls">
            <button
              className="secondary-button"
              type="button"
              disabled={!selectedDraft || mutationBusy || selectedDraft.status === "LIVE"}
              onClick={confirmStart}
            >
              Start Draft
            </button>
            <button
              className="secondary-button"
              type="button"
              disabled={!selectedDraft || mutationBusy || selectedDraft.status !== "LIVE"}
              onClick={() => void pauseDraft()}
            >
              Pause Draft
            </button>
            <button
              className="secondary-button"
              type="button"
              disabled={!selectedDraft || mutationBusy || selectedDraft.status !== "PAUSED"}
              onClick={() => void resumeDraft()}
            >
              Resume Draft
            </button>
            <button className="secondary-button" type="button" disabled={!selectedDraft || mutationBusy} onClick={confirmUndo}>
              Undo
            </button>
            <button className="secondary-button" type="button" disabled={!selectedDraft || mutationBusy} onClick={confirmRedo}>
              Redo
            </button>
            <button className="danger-button" type="button" disabled={!selectedDraft || mutationBusy} onClick={confirmReset}>
              Reset Draft
            </button>
            <button className="danger-button" type="button" disabled={!selectedDraft || mutationBusy} onClick={confirmComplete}>
              Complete Draft
            </button>
          </div>
        </Section>
      ) : null}

      {draft && lineupVisible ? (
        <Section
          title="Final Lineup"
          actions={
            lineupConfirmed ? undefined : (
              <button
                className="secondary-button"
                type="button"
                disabled={mutationBusy}
                onClick={() => void confirmFinalLineup()}
              >
                Confirm Final Lineup
              </button>
            )
          }
        >
          <div className="stack">
            <dl className="metric-grid">
              <Metric label="Lineup status" value={draft.finalLineup?.status ?? "ACTIVE"} />
              {lineupConfirmed ? null : (
                <Metric label="Lineup timer" value={formatDuration(displayedTimer.remainingSeconds)} />
              )}
              <Metric
                label="Lineup started"
                value={draft.finalLineup?.lineupPhaseStartedAt ? formatDateTime(draft.finalLineup.lineupPhaseStartedAt) : "Pending"}
              />
              <Metric
                label="Lineup confirmed"
                value={draft.finalLineup?.lineupConfirmedAt ? formatDateTime(draft.finalLineup.lineupConfirmedAt) : "Not confirmed"}
              />
            </dl>
            {lineupConfirmed ? (
              <p className="inline-success lineup-review-state">Final lineup is confirmed and locked.</p>
            ) : (
              <p className="inline-warning">Reorder each side using only that side's locked picks.</p>
            )}
            <div className="lineup-side-grid">
              {DRAFT_LINEUP_SIDES.map((side) => {
                const lineupActions = getLineupActionsForSide(draft, side);
                const sideLabel = formatSide(side);

                return (
                  <div className="lineup-side" key={side}>
                    <div className="lineup-side__header">
                      <h3 className="subsection-title">{sideLabel} Lineup</h3>
                      {lineupConfirmed ? null : (
                        <button
                          className="secondary-button"
                          type="button"
                          disabled={mutationBusy}
                          onClick={() => void resetLineupSide(side)}
                        >
                          Reset {sideLabel}
                        </button>
                      )}
                    </div>
                    <div className="lineup-card-grid">
                      {lineupActions.map((action, index) => {
                        const swapTargets = lineupActions
                          .map((targetAction, targetIndex) => ({
                            actionId: targetAction.id,
                            label: `Slot ${targetIndex + 1} - ${getHeroName(heroById, targetAction.heroId)}`
                          }))
                          .filter((target) => target.actionId !== action.id);

                        return (
                          <LineupCard
                            key={action.id}
                            action={action}
                            allActions={draft.actions}
                            heroById={heroById}
                            slotIndex={index}
                            confirmed={lineupConfirmed}
                            canMoveUp={!mutationBusy && index > 0}
                            canMoveDown={!mutationBusy && index < lineupActions.length - 1}
                            swapTargets={swapTargets}
                            onSwap={(targetActionId) => void swapLineupAction(side, action.id, targetActionId)}
                            onMoveUp={() => void moveLineupAction(side, action.id, -1)}
                            onMoveDown={() => void moveLineupAction(side, action.id, 1)}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>
      ) : null}

      {draftActionWorkspaceVisible ? (
        <>
          <Section title="Current Action">
            {draftLoadStatus === "loading" ? <p className="empty-state">Loading full draft slots.</p> : null}
            <div className="operator-selector-grid">
              <label className="field-label">
                Action slot
                <select
                  value={activeAction?.id ?? ""}
                  onChange={(event) => setSelectedActionId(event.currentTarget.value)}
                  disabled={currentActions.length === 0}
                >
                  {currentActions.length === 0 ? <option value="">No current action</option> : null}
                  {currentActions.map((action) => (
                    <option key={action.id} value={action.id}>
                      {formatActionLabel(action, draft?.actions ?? currentActions)} - {action.status}
                    </option>
                  ))}
                </select>
              </label>
              <Metric label="Side" value={formatSide(activeAction?.team)} />
              <Metric label="Type" value={formatActionType(activeAction?.type)} />
              <Metric label="Selected entity" value={selectedHero ? formatHeroDisplayLabel(selectedHero) : "None"} />
            </div>

            <div className="operator-controls">
              <button
                className="secondary-button"
                type="button"
                disabled={!canHover || mutationBusy}
                onClick={() => void hoverHero()}
              >
                Hover Selected
              </button>
              <button
                className="danger-button"
                type="button"
                disabled={!canLock || mutationBusy}
                onClick={confirmLock}
              >
                Lock Selected
              </button>
              {activeAction?.type === "BAN" ? (
                <button
                  className="secondary-button"
                  type="button"
                  disabled={!canSkipBan || mutationBusy}
                  onClick={confirmSkipBan}
                >
                  No Ban
                </button>
              ) : null}
            </div>
            {currentHeroIsLocked && !allowDuplicateHeroes ? (
              <p className="inline-warning">Selected entity is already locked in this draft; the server will reject duplicates.</p>
            ) : null}
          </Section>

          <Section title="Entity List">
            <label className="field-label field-label--narrow">
              Hero search
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
                placeholder="Search heroes, aliases, roles, or local IDs"
              />
            </label>
            <p className="entity-list-count">
              Showing {filteredHeroes.length} of {adapterDetail?.heroes.length ?? 0} local entities
              {adapterDetail ? ` from ${adapterDetail.displayName}` : ""}.
            </p>
            {adapterLoadStatus === "loading" ? <p className="empty-state">Loading local adapter entities.</p> : null}
            {filteredHeroes.length === 0 ? (
              <p className="empty-state">No selectable entities match the current search.</p>
            ) : (
              <div className="hero-grid" role="list" aria-label="Selectable heroes">
                {filteredHeroes.map((hero) => {
                  const locked = lockedHeroIds.has(hero.id);

                  return (
                    <button
                      className="hero-button"
                      aria-pressed={selectedHeroId === hero.id}
                      key={hero.id}
                      type="button"
                      aria-label={formatHeroDisplayLabel(hero)}
                      data-hero-id={hero.id}
                      onClick={() => setSelectedHeroId(hero.id)}
                    >
                      <HeroArtwork hero={hero} />
                      <span className="hero-button__copy">
                        <strong>{getHeroPrimaryName(hero)}</strong>
                        {getHeroSecondaryName(hero) ? (
                          <span className="hero-button__secondary">{getHeroSecondaryName(hero)}</span>
                        ) : null}
                        <span className="hero-button__roles">{hero.roleTags?.join(", ") ?? "No role tags"}</span>
                      </span>
                      {locked ? <span className="hero-button__locked">Locked</span> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </Section>

          <Section title="Slots and History">
            {draft ? (
              <div className="stack">
                <DraftSlotGroup
                  title="Ban Slots"
                  actions={banActions}
                  allActions={draft.actions}
                  heroById={heroById}
                  currentActionIds={currentActionIds}
                />
                <DraftSlotGroup
                  title="Pick Slots"
                  actions={pickActions}
                  allActions={draft.actions}
                  heroById={heroById}
                  currentActionIds={currentActionIds}
                />
                <div>
                  <h3 className="subsection-title">Recent History</h3>
                  {actionHistory.length === 0 ? (
                    <p className="empty-state">No draft history has been recorded yet.</p>
                  ) : (
                    <ul className="detail-list">
                      {actionHistory.map((entry) => (
                        <li key={entry.id}>
                          <strong>{entry.action}</strong>
                          <span>{formatDateTime(entry.timestamp)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <p className="empty-state">Select a loaded draft to view action slots and history.</p>
            )}
          </Section>
        </>
      ) : null}

      <ConfirmationDialog
        pending={pendingConfirmation}
        reason={confirmationReason}
        confirmationText={confirmationText}
        busy={mutationBusy}
        onReasonChange={setConfirmationReason}
        onConfirmationTextChange={setConfirmationText}
        onCancel={() => setPendingConfirmation(null)}
        onConfirm={() => void confirmPendingAction()}
      />
    </div>
  );
}
