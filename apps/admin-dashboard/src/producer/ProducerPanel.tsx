import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type {
  GraphicType,
  JsonValue,
  Match,
  MatchPresentationMetadata,
  PresentationSide,
  ProductionState,
  SeriesFormat
} from "@mmbt/shared-types";

import type { DashboardApiClient } from "../client/apiClient";
import { toDashboardApiError } from "../client/apiClient";
import type {
  DashboardDraftSummary,
  DashboardGame,
  DashboardMatch,
  DashboardProductionState,
  DashboardRuntimeState
} from "../client/types";
import type { DashboardClientState, DashboardSocketStatus } from "../state/dashboardState";
import {
  findTeam,
  formatDateTime,
  formatTeamName,
  getDraftForGame,
  getMatchById,
  getRulesetLabel,
  getSelectedMatch
} from "../state/selectors";

const PRODUCTION_STATES: ProductionState[] = [
  "PRE_SHOW",
  "OPENING",
  "TEAM_INTRO",
  "DRAFT_READY",
  "DRAFT_LIVE",
  "DRAFT_COMPLETE",
  "LOADING_SCREEN",
  "GAME_LIVE",
  "PAUSE",
  "TECH_PAUSE",
  "POST_GAME",
  "MVP",
  "BREAK",
  "NEXT_GAME",
  "MATCH_COMPLETE"
];

const GRAPHIC_TYPES: GraphicType[] = [
  "DRAFT_OVERLAY",
  "SCORE_BUG",
  "LOWER_THIRD",
  "SPONSOR_BUG",
  "PAUSE_SCREEN",
  "BREAK_SCREEN",
  "POST_GAME_STATS",
  "MVP",
  "EMERGENCY"
];

const EMERGENCY_MESSAGES = [
  "Technical Pause",
  "Broadcast Standby",
  "Emergency Mode"
] as const;
const PRESENTATION_SAVE_FEEDBACK_MS = 500;

interface ProducerPanelError {
  code: string;
  message: string;
}

interface PendingConfirmation {
  title: string;
  message: string;
  confirmLabel: string;
  confirmationText?: string;
  run(): Promise<void>;
}

interface ProductionMutationResponse {
  revision: number;
  production: DashboardProductionState;
}

interface MatchPresentationMutationResponse {
  revision: number;
  match: Match;
}

interface MatchPresentationFormState {
  matchLabel: string;
  patchLabel: string;
  seriesFormat: SeriesFormat;
  gameNumber: string;
  blueScore: string;
  redScore: string;
  firstPickSide: PresentationSide;
  sideStatusLabel: string;
}

export interface ProducerPanelProps {
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

function toPanelError(error: unknown): ProducerPanelError {
  const apiError = toDashboardApiError(error);

  return {
    code: apiError.code,
    message: apiError.message
  };
}

function getProducerId(producerLabel: string): string {
  const trimmed = producerLabel.trim();

  return trimmed.length > 0 ? trimmed : "producer";
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

function getProductionTone(status: ProductionState | string | undefined): "good" | "warn" | "danger" | "neutral" {
  switch (status) {
    case "DRAFT_LIVE":
    case "GAME_LIVE":
      return "good";
    case "DRAFT_READY":
    case "DRAFT_COMPLETE":
    case "LOADING_SCREEN":
    case "NEXT_GAME":
      return "warn";
    case "PAUSE":
    case "TECH_PAUSE":
      return "danger";
    default:
      return "neutral";
  }
}

function getGraphicTone(status: string | undefined): "good" | "warn" | "danger" | "neutral" {
  switch (status) {
    case "ON_PROGRAM":
      return "good";
    case "PREVIEW":
      return "warn";
    case "IDLE":
      return "neutral";
    default:
      return "neutral";
  }
}

function toSeriesFormat(value: unknown, fallback: SeriesFormat = "BO1"): SeriesFormat {
  return value === "BO1" || value === "BO3" || value === "BO5" ? value : fallback;
}

function toPresentationSide(value: unknown, fallback: PresentationSide = "BLUE"): PresentationSide {
  return value === "BLUE" || value === "RED" ? value : fallback;
}

function toIntegerString(value: unknown, fallback: number): string {
  return Number.isInteger(value) ? String(value) : String(fallback);
}

function getPresentationDefaults(match: DashboardMatch): Required<Omit<MatchPresentationMetadata, "playerDisplayOrderBySide">> {
  const presentation = match.presentation ?? {};
  const scoreBySide = presentation.scoreBySide ?? {
    BLUE: match.score.blue,
    RED: match.score.red
  };

  return {
    matchLabel: presentation.matchLabel ?? match.title,
    patchLabel: presentation.patchLabel ?? "",
    seriesFormat: toSeriesFormat(presentation.seriesFormat ?? match.format),
    gameNumber: presentation.gameNumber ?? match.currentGameNumber,
    scoreBySide: {
      BLUE: scoreBySide.BLUE,
      RED: scoreBySide.RED
    },
    firstPickSide: toPresentationSide(presentation.firstPickSide),
    sideStatusLabel: presentation.sideStatusLabel ?? ""
  };
}

function createPresentationFormState(match: DashboardMatch | null): MatchPresentationFormState {
  if (!match) {
    return {
      matchLabel: "",
      patchLabel: "",
      seriesFormat: "BO1",
      gameNumber: "1",
      blueScore: "0",
      redScore: "0",
      firstPickSide: "BLUE",
      sideStatusLabel: ""
    };
  }

  const presentation = getPresentationDefaults(match);

  return {
    matchLabel: presentation.matchLabel,
    patchLabel: presentation.patchLabel,
    seriesFormat: presentation.seriesFormat,
    gameNumber: toIntegerString(presentation.gameNumber, match.currentGameNumber),
    blueScore: toIntegerString(presentation.scoreBySide.BLUE, match.score.blue),
    redScore: toIntegerString(presentation.scoreBySide.RED, match.score.red),
    firstPickSide: presentation.firstPickSide,
    sideStatusLabel: presentation.sideStatusLabel
  };
}

function readPositiveInteger(value: string): number | null {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}

function readNonNegativeInteger(value: string): number | null {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function addTrimmedStringField(
  payload: Record<string, unknown>,
  field: "matchLabel" | "patchLabel" | "sideStatusLabel",
  value: string
): void {
  const trimmed = value.trim();

  if (trimmed.length > 0) {
    payload[field] = trimmed;
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function mergeRuntimeMatchWithPresentationResponse(
  currentMatch: DashboardMatch,
  responseMatch: Match
): DashboardMatch {
  return {
    ...currentMatch,
    ...responseMatch,
    games: currentMatch.games
  };
}

function findPreferredMatch(
  snapshot: DashboardRuntimeState,
  selectedMatchId: string | null
): DashboardMatch | null {
  return (
    getMatchById(snapshot, selectedMatchId) ??
    getMatchById(snapshot, snapshot.production.activeMatchId) ??
    getSelectedMatch(snapshot, null)
  );
}

function findPreferredGame(
  snapshot: DashboardRuntimeState,
  match: DashboardMatch | null,
  selectedGameId: string | null
): DashboardGame | null {
  if (!match) {
    return null;
  }

  const selectedGame = match.games.find((game) => game.id === selectedGameId);

  if (selectedGame) {
    return selectedGame;
  }

  const productionGame =
    snapshot.production.activeMatchId === match.id && snapshot.production.activeGameNumber
      ? match.games.find((game) => game.gameNumber === snapshot.production.activeGameNumber)
      : null;

  if (productionGame) {
    return productionGame;
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
  const selectedDraft = selectedDraftId ? snapshot.drafts[selectedDraftId] : null;

  if (selectedDraft) {
    return selectedDraft;
  }

  const gameDraft = getDraftForGame(snapshot, game);

  if (gameDraft) {
    return gameDraft;
  }

  const activeDraft = snapshot.production.activeDraftId
    ? snapshot.drafts[snapshot.production.activeDraftId]
    : null;

  if (activeDraft) {
    return activeDraft;
  }

  return Object.values(snapshot.drafts).find((draft) => draft.matchId === match?.id) ?? null;
}

function buildPreviewPayload(input: {
  graphicType: GraphicType;
  match: DashboardMatch | null;
  game: DashboardGame | null;
  draft: DashboardDraftSummary | null;
  blueTeamName: string;
  redTeamName: string;
  productionStatus: ProductionState;
}): JsonValue {
  return {
    preparedBy: "producer-panel",
    graphicType: input.graphicType,
    matchId: input.match?.id ?? null,
    matchTitle: input.match?.title ?? null,
    gameNumber: input.game?.gameNumber ?? null,
    gameCode: input.game?.gameCode ?? input.match?.gameCode ?? null,
    draftId: input.draft?.id ?? null,
    draftStatus: input.draft?.status ?? null,
    blueTeam: input.blueTeamName,
    redTeam: input.redTeamName,
    productionStatus: input.productionStatus,
    preparedAt: new Date().toISOString()
  };
}

function ProducerConfirmationDialog(props: {
  pending: PendingConfirmation | null;
  confirmationText: string;
  busy: boolean;
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
  const canConfirm = confirmationMatches && !props.busy;

  return (
    <div className="modal-backdrop" role="presentation">
      <form
        className="confirmation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="producer-confirmation-title"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          if (canConfirm) {
            props.onConfirm();
          }
        }}
      >
        <h2 id="producer-confirmation-title">{props.pending.title}</h2>
        <p>{props.pending.message}</p>
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

function ProducerBanner(props: {
  error: ProducerPanelError | null;
  successMessage: string | null;
}): ReactNode {
  if (props.error) {
    return (
      <div className="banner banner--error" role="alert">
        <strong>{props.error.code}</strong>
        <span>{props.error.message}</span>
      </div>
    );
  }

  if (props.successMessage) {
    return (
      <div className="banner banner--success" role="status">
        {props.successMessage}
      </div>
    );
  }

  return null;
}

export function ProducerPanel(props: ProducerPanelProps): ReactNode {
  const snapshot = props.state.snapshot;
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(props.routeMatchId ?? null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [producerLabel, setProducerLabel] = useState("producer");
  const [selectedProductionStatus, setSelectedProductionStatus] = useState<ProductionState>("PRE_SHOW");
  const [selectedGraphicType, setSelectedGraphicType] = useState<GraphicType>("DRAFT_OVERLAY");
  const [emergencyMessage, setEmergencyMessage] = useState<(typeof EMERGENCY_MESSAGES)[number]>("Technical Pause");
  const [presentationForm, setPresentationForm] = useState<MatchPresentationFormState>(() =>
    createPresentationFormState(null)
  );
  const [presentationSaving, setPresentationSaving] = useState(false);
  const [presentationStatusMessage, setPresentationStatusMessage] = useState<string | null>(null);
  const [presentationError, setPresentationError] = useState<ProducerPanelError | null>(null);
  const [presentationMatchOverrides, setPresentationMatchOverrides] = useState<Record<string, DashboardMatch>>({});
  const [mutationBusy, setMutationBusy] = useState(false);
  const [panelError, setPanelError] = useState<ProducerPanelError | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [confirmationText, setConfirmationText] = useState("");

  useEffect(() => {
    if (props.routeMatchId) {
      setSelectedMatchId(props.routeMatchId);
    }
  }, [props.routeMatchId]);

  useEffect(() => {
    if (snapshot) {
      setSelectedProductionStatus(snapshot.production.status);
      setSelectedGraphicType(snapshot.production.graphicTakeState.graphicType);
    }
  }, [snapshot?.production.graphicTakeState.graphicType, snapshot?.production.status]);

  const selectedMatch = useMemo(() => {
    if (!snapshot) {
      return null;
    }

    return findPreferredMatch(snapshot, selectedMatchId);
  }, [selectedMatchId, snapshot]);

  const visibleSelectedMatch = selectedMatch
    ? presentationMatchOverrides[selectedMatch.id] ?? selectedMatch
    : null;

  const selectedGame = useMemo(() => {
    if (!snapshot) {
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
    if (selectedDraft && selectedDraft.id !== selectedDraftId) {
      setSelectedDraftId(selectedDraft.id);
    }
  }, [selectedDraft, selectedDraftId]);

  useEffect(() => {
    setPresentationForm(createPresentationFormState(visibleSelectedMatch));
  }, [
    visibleSelectedMatch?.currentGameNumber,
    visibleSelectedMatch?.format,
    visibleSelectedMatch?.id,
    visibleSelectedMatch?.presentation,
    visibleSelectedMatch?.score.blue,
    visibleSelectedMatch?.score.red,
    visibleSelectedMatch?.title
  ]);

  async function refreshAfterMutation(): Promise<void> {
    await Promise.resolve(props.onRefresh());
  }

  function clearFeedback(): void {
    setPanelError(null);
    setSuccessMessage(null);
    setPresentationStatusMessage(null);
    setPresentationError(null);
  }

  async function runMutation(
    successLabel: string,
    mutation: () => Promise<ProductionMutationResponse>
  ): Promise<void> {
    clearFeedback();
    setMutationBusy(true);

    try {
      await mutation();
      setSuccessMessage(successLabel);
      await refreshAfterMutation();
    } catch (error) {
      setPanelError(toPanelError(error));
    } finally {
      setMutationBusy(false);
    }
  }

  function updatePresentationForm<K extends keyof MatchPresentationFormState>(
    field: K,
    value: MatchPresentationFormState[K]
  ): void {
    setPresentationForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function saveMatchPresentation(): Promise<void> {
    clearFeedback();

    if (!selectedMatch) {
      setPanelError({
        code: "MATCH_NOT_SELECTED",
        message: "Select a match before saving presentation metadata."
      });
      return;
    }

    if (presentationForm.matchLabel.trim().length === 0) {
      setPanelError({
        code: "MATCH_PRESENTATION_INVALID_FORM",
        message: "Match Label must not be empty."
      });
      return;
    }

    const gameNumber = readPositiveInteger(presentationForm.gameNumber);
    const blueScore = readNonNegativeInteger(presentationForm.blueScore);
    const redScore = readNonNegativeInteger(presentationForm.redScore);

    if (gameNumber === null) {
      setPanelError({
        code: "MATCH_PRESENTATION_INVALID_FORM",
        message: "Game Number must be a positive integer."
      });
      return;
    }

    if (blueScore === null || redScore === null) {
      setPanelError({
        code: "MATCH_PRESENTATION_INVALID_FORM",
        message: "BLUE Score and RED Score must be non-negative integers."
      });
      return;
    }

    const payload: Record<string, unknown> = {
      operatorId: getProducerId(producerLabel),
      seriesFormat: presentationForm.seriesFormat,
      gameNumber,
      scoreBySide: {
        BLUE: blueScore,
        RED: redScore
      },
      firstPickSide: presentationForm.firstPickSide
    };

    addTrimmedStringField(payload, "matchLabel", presentationForm.matchLabel);
    addTrimmedStringField(payload, "patchLabel", presentationForm.patchLabel);
    addTrimmedStringField(payload, "sideStatusLabel", presentationForm.sideStatusLabel);

    const saveStartedAt = Date.now();
    setPresentationSaving(true);
    setPresentationStatusMessage("Saving presentation metadata...");

    try {
      const response = await props.apiClient.patch<MatchPresentationMutationResponse>(
        `/api/matches/${selectedMatch.id}/presentation`,
        payload
      );
      const nextMatch = mergeRuntimeMatchWithPresentationResponse(selectedMatch, response.match);

      setPresentationMatchOverrides((current) => ({
        ...current,
        [selectedMatch.id]: nextMatch
      }));
      setPresentationForm(createPresentationFormState(nextMatch));
      setSuccessMessage("Match presentation metadata updated.");
      setPresentationStatusMessage("Match presentation metadata updated.");
      await refreshAfterMutation();
    } catch (error) {
      const nextError = toPanelError(error);
      setPanelError(nextError);
      setPresentationError(nextError);
      setPresentationStatusMessage(null);
    } finally {
      const elapsed = Date.now() - saveStartedAt;
      if (elapsed < PRESENTATION_SAVE_FEEDBACK_MS) {
        await wait(PRESENTATION_SAVE_FEEDBACK_MS - elapsed);
      }
      setPresentationSaving(false);
    }
  }

  function openConfirmation(pending: PendingConfirmation): void {
    setConfirmationText("");
    setPendingConfirmation(pending);
  }

  async function confirmPendingAction(): Promise<void> {
    const pending = pendingConfirmation;

    if (!pending) {
      return;
    }

    await pending.run();
    setPendingConfirmation(null);
  }

  if (!snapshot) {
    return (
      <Section title="Producer Panel">
        <p className="empty-state">Waiting for server state before showing production controls.</p>
      </Section>
    );
  }

  const production = snapshot.production;
  const blueTeam = findTeam(snapshot, selectedGame?.blueTeamId ?? selectedMatch?.teams.blue);
  const redTeam = findTeam(snapshot, selectedGame?.redTeamId ?? selectedMatch?.teams.red);
  const blueTeamName = formatTeamName(blueTeam);
  const redTeamName = formatTeamName(redTeam);
  const matchingDrafts = Object.values(snapshot.drafts).filter(
    (draft) => !selectedMatch || draft.matchId === selectedMatch.id
  );
  const visiblePresentation = visibleSelectedMatch ? getPresentationDefaults(visibleSelectedMatch) : null;
  const previewReady = production.graphicTakeState.previewPayload !== null;
  const programReady = production.graphicTakeState.programPayload !== null;
  const publicEmergencyMessageState = production.emergency.message ? "Set" : "Not set";

  function applyProductionState(): void {
    openConfirmation({
      title: "Apply Production State",
      message: "This changes global show state and active production context for browser-source outputs.",
      confirmLabel: "Apply State",
      run: async () =>
        runMutation("Production state accepted by server.", () =>
          props.apiClient.post<ProductionMutationResponse>("/api/production/state", {
            operatorId: getProducerId(producerLabel),
            status: selectedProductionStatus,
            activeMatchId: selectedMatch?.id ?? null,
            activeGameNumber: selectedGame?.gameNumber ?? null,
            activeDraftId: selectedDraft?.id ?? null,
            confirm: true
          })
        )
    });
  }

  async function previewGraphic(): Promise<void> {
    await runMutation("Preview graphic prepared. Program output is unchanged.", () =>
      props.apiClient.post<ProductionMutationResponse>("/api/production/preview", {
        operatorId: getProducerId(producerLabel),
        graphicType: selectedGraphicType,
        payload: buildPreviewPayload({
          graphicType: selectedGraphicType,
          match: selectedMatch,
          game: selectedGame,
          draft: selectedDraft,
          blueTeamName,
          redTeamName,
          productionStatus: selectedProductionStatus
        })
      })
    );
  }

  function confirmTake(): void {
    openConfirmation({
      title: "Take Preview to Program",
      message: "This moves the prepared Preview graphic to Program output state.",
      confirmLabel: "Take to Program",
      confirmationText: "TAKE_PROGRAM",
      run: async () =>
        runMutation("Preview graphic taken to Program.", () =>
          props.apiClient.post<ProductionMutationResponse>("/api/production/take", {
            operatorId: getProducerId(producerLabel),
            confirm: true
          })
        )
    });
  }

  function confirmClearProgram(): void {
    openConfirmation({
      title: "Clear Program",
      message: "This clears the current Program graphic state for browser-source outputs.",
      confirmLabel: "Clear Program",
      confirmationText: "CLEAR_PROGRAM",
      run: async () =>
        runMutation("Program graphic cleared.", () =>
          props.apiClient.post<ProductionMutationResponse>("/api/production/clear", {
            operatorId: getProducerId(producerLabel),
            confirm: true
          })
        )
    });
  }

  function confirmEmergencyTrigger(): void {
    openConfirmation({
      title: "Trigger Emergency",
      message: "This activates emergency production state. Use only for live-show interruption or safety messaging.",
      confirmLabel: "Trigger Emergency",
      confirmationText: "EMERGENCY",
      run: async () =>
        runMutation("Emergency mode triggered.", () =>
          props.apiClient.post<ProductionMutationResponse>("/api/production/emergency", {
            operatorId: getProducerId(producerLabel),
            confirm: true,
            message: emergencyMessage
          })
        )
    });
  }

  function confirmEmergencyClear(): void {
    openConfirmation({
      title: "Clear Emergency",
      message: "This clears emergency mode and returns the system to normal production state handling.",
      confirmLabel: "Clear Emergency",
      confirmationText: "CLEAR_EMERGENCY",
      run: async () =>
        runMutation("Emergency mode cleared.", () =>
          props.apiClient.post<ProductionMutationResponse>("/api/production/emergency/clear", {
            operatorId: getProducerId(producerLabel),
            confirm: true
          })
        )
    });
  }

  return (
    <div className="stack">
      <Section
        title="Producer Panel"
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
          <StatusPill tone={getSocketTone(props.state.socketStatus)}>
            Realtime {props.state.socketStatus}
          </StatusPill>
          <StatusPill tone={props.state.health?.status === "OK" ? "good" : "warn"}>
            Server {props.state.health?.status ?? "UNKNOWN"}
          </StatusPill>
        </div>
        <dl className="metric-grid">
          <Metric label="Event" value={snapshot.event?.name ?? "Not loaded"} />
          <Metric label="Package" value={snapshot.eventPackageId ?? "Not loaded"} />
          <Metric label="Revision" value={snapshot.revision} />
          <Metric label="Connected clients" value={props.state.health?.socketClients.length ?? 0} />
          <Metric label="Last state update" value={formatDateTime(snapshot.timestamp)} />
          <Metric label="Overlay safety" value={production.overlaySafety.readOnly ? "Read-only" : "Review"} />
        </dl>
        {props.state.socketError ? <p className="inline-warning">{props.state.socketError}</p> : null}
      </Section>

      <ProducerBanner error={panelError} successMessage={successMessage} />

      <Section title="Production State">
        <dl className="metric-grid">
          <Metric
            label="Current state"
            value={<StatusPill tone={getProductionTone(production.status)}>{production.status}</StatusPill>}
          />
          <Metric label="Active match" value={production.activeMatchId ?? "None"} />
          <Metric label="Active game" value={production.activeGameNumber ?? "None"} />
          <Metric label="Active draft" value={production.activeDraftId ?? "None"} />
          <Metric label="Updated" value={formatDateTime(production.updatedAt)} />
          <Metric
            label="Emergency"
            value={
              <StatusPill tone={production.emergency.active ? "danger" : "good"}>
                {production.emergency.active ? "ACTIVE" : "READY"}
              </StatusPill>
            }
          />
        </dl>
      </Section>

      <Section title="Production Context">
        <div className="operator-selector-grid">
          <label className="field-label">
            Match
            <select
              value={selectedMatch?.id ?? ""}
              onChange={(event) => {
                setSelectedMatchId(event.currentTarget.value);
                setSelectedGameId(null);
                setSelectedDraftId(null);
              }}
              disabled={snapshot.matches.length === 0}
            >
              {snapshot.matches.length === 0 ? <option value="">No matches loaded</option> : null}
              {snapshot.matches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.title}
                </option>
              ))}
            </select>
          </label>

          <label className="field-label">
            Game
            <select
              value={selectedGame?.id ?? ""}
              onChange={(event) => {
                setSelectedGameId(event.currentTarget.value);
                setSelectedDraftId(null);
              }}
              disabled={!selectedMatch || selectedMatch.games.length === 0}
            >
              {!selectedMatch || selectedMatch.games.length === 0 ? <option value="">No games loaded</option> : null}
              {selectedMatch?.games.map((game) => (
                <option key={game.id} value={game.id}>
                  Game {game.gameNumber} - {game.gameCode}
                </option>
              ))}
            </select>
          </label>

          <label className="field-label">
            Draft
            <select
              value={selectedDraft?.id ?? ""}
              onChange={(event) => setSelectedDraftId(event.currentTarget.value)}
              disabled={matchingDrafts.length === 0}
            >
              {matchingDrafts.length === 0 ? <option value="">No draft loaded</option> : null}
              {matchingDrafts.map((draft) => (
                <option key={draft.id} value={draft.id}>
                  {draft.id} ({draft.status})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="operator-selector-grid producer-selector-grid">
          <label className="field-label">
            Production state
            <select
              value={selectedProductionStatus}
              onChange={(event) => setSelectedProductionStatus(event.currentTarget.value as ProductionState)}
            >
              {PRODUCTION_STATES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Producer label
            <input
              value={producerLabel}
              onChange={(event) => setProducerLabel(event.currentTarget.value)}
            />
          </label>
          <div className="field-action">
            <button
              className="danger-button"
              type="button"
              disabled={mutationBusy}
              onClick={applyProductionState}
            >
              Apply State / Context
            </button>
          </div>
        </div>
      </Section>

      <Section title="Match Presentation">
        <div className="operator-selector-grid">
          <label className="field-label">
            Match Label
            <input
              value={presentationForm.matchLabel}
              onChange={(event) => updatePresentationForm("matchLabel", event.currentTarget.value)}
              disabled={!selectedMatch || presentationSaving}
            />
          </label>
          <label className="field-label">
            Patch Label
            <input
              value={presentationForm.patchLabel}
              onChange={(event) => updatePresentationForm("patchLabel", event.currentTarget.value)}
              disabled={!selectedMatch || presentationSaving}
            />
          </label>
          <label className="field-label">
            Series Format
            <select
              value={presentationForm.seriesFormat}
              onChange={(event) => updatePresentationForm("seriesFormat", event.currentTarget.value as SeriesFormat)}
              disabled={!selectedMatch || presentationSaving}
            >
              <option value="BO1">BO1</option>
              <option value="BO3">BO3</option>
              <option value="BO5">BO5</option>
            </select>
          </label>
        </div>

        <div className="operator-selector-grid producer-selector-grid">
          <label className="field-label">
            Game Number
            <input
              type="number"
              min={1}
              step={1}
              value={presentationForm.gameNumber}
              onChange={(event) => updatePresentationForm("gameNumber", event.currentTarget.value)}
              disabled={!selectedMatch || presentationSaving}
            />
          </label>
          <label className="field-label">
            BLUE Score
            <input
              type="number"
              min={0}
              step={1}
              value={presentationForm.blueScore}
              onChange={(event) => updatePresentationForm("blueScore", event.currentTarget.value)}
              disabled={!selectedMatch || presentationSaving}
            />
          </label>
          <label className="field-label">
            RED Score
            <input
              type="number"
              min={0}
              step={1}
              value={presentationForm.redScore}
              onChange={(event) => updatePresentationForm("redScore", event.currentTarget.value)}
              disabled={!selectedMatch || presentationSaving}
            />
          </label>
        </div>

        <div className="operator-selector-grid producer-selector-grid">
          <label className="field-label">
            First Pick Side
            <select
              value={presentationForm.firstPickSide}
              onChange={(event) => updatePresentationForm("firstPickSide", event.currentTarget.value as PresentationSide)}
              disabled={!selectedMatch || presentationSaving}
            >
              <option value="BLUE">BLUE</option>
              <option value="RED">RED</option>
            </select>
          </label>
          <label className="field-label">
            Side Status Label
            <input
              value={presentationForm.sideStatusLabel}
              onChange={(event) => updatePresentationForm("sideStatusLabel", event.currentTarget.value)}
              disabled={!selectedMatch || presentationSaving}
            />
          </label>
          <div className="field-action">
            <button
              className="secondary-button"
              type="button"
              disabled={!selectedMatch || presentationSaving}
              onClick={() => setPresentationForm(createPresentationFormState(visibleSelectedMatch))}
            >
              Reset Form
            </button>
          </div>
        </div>

        <div className="operator-controls producer-selector-grid">
          <button
            className="secondary-button"
            type="button"
            disabled={!selectedMatch || presentationSaving}
            onClick={() => void saveMatchPresentation()}
          >
            {presentationSaving ? "Saving..." : "Save Presentation"}
          </button>
        </div>
        {presentationStatusMessage ? (
          <p className={presentationSaving ? "inline-warning" : "inline-success"} role="status">
            {presentationStatusMessage}
          </p>
        ) : null}
        {presentationError ? (
          <p className="inline-error" role="alert">
            {presentationError.code}: {presentationError.message}
          </p>
        ) : null}
      </Section>

      <Section title="Current Presentation">
        <dl className="metric-grid">
          <Metric label="Match label" value={visiblePresentation?.matchLabel ?? "No match selected"} />
          <Metric label="Patch label" value={visiblePresentation?.patchLabel || "Not set"} />
          <Metric label="Series format" value={visiblePresentation?.seriesFormat ?? "Not set"} />
          <Metric label="Game number" value={visiblePresentation?.gameNumber ?? "Unknown"} />
          <Metric
            label="Presentation score"
            value={
              visiblePresentation
                ? `${visiblePresentation.scoreBySide.BLUE} - ${visiblePresentation.scoreBySide.RED}`
                : "Unknown"
            }
          />
          <Metric label="First pick side" value={visiblePresentation?.firstPickSide ?? "BLUE"} />
          <Metric label="Side status" value={visiblePresentation?.sideStatusLabel || "Not set"} />
        </dl>
      </Section>

      <Section title="Active Match / Game / Draft">
        <dl className="metric-grid">
          <Metric label="Match" value={visiblePresentation?.matchLabel ?? selectedMatch?.title ?? "No match selected"} />
          <Metric
            label="Score"
            value={
              visiblePresentation
                ? `${visiblePresentation.scoreBySide.BLUE} - ${visiblePresentation.scoreBySide.RED}`
                : selectedMatch
                  ? `${selectedMatch.score.blue} - ${selectedMatch.score.red}`
                  : "Unknown"
            }
          />
          <Metric label="Game" value={selectedGame ? `Game ${selectedGame.gameNumber}` : "Not selected"} />
          <Metric label="Game status" value={selectedGame?.status ?? "Unknown"} />
          <Metric label="Blue team" value={blueTeamName} />
          <Metric label="Red team" value={redTeamName} />
          <Metric label="Ruleset" value={getRulesetLabel(snapshot, selectedGame?.rulesetId ?? selectedDraft?.rulesetId)} />
          <Metric
            label="Draft readiness"
            value={selectedDraft ? `${selectedDraft.id} (${selectedDraft.status})` : "No runtime draft"}
          />
        </dl>
      </Section>

      <Section title="Preview / Program">
        <div className="card-grid card-grid--two">
          <article className="summary-card producer-graphic-card producer-graphic-card--preview">
            <div className="summary-card__header">
              <h3>Preview</h3>
              <StatusPill tone={previewReady ? "warn" : "neutral"}>
                {previewReady ? "Prepared" : "Empty"}
              </StatusPill>
            </div>
            <dl className="compact-list">
              <Metric label="Graphic type" value={production.graphicTakeState.graphicType} />
              <Metric label="Status" value={production.graphicTakeState.status} />
              <Metric label="Payload" value={previewReady ? "Prepared" : "None"} />
              <Metric label="Updated" value={formatDateTime(production.graphicTakeState.updatedAt)} />
            </dl>
          </article>
          <article className="summary-card producer-graphic-card producer-graphic-card--program">
            <div className="summary-card__header">
              <h3>Program</h3>
              <StatusPill tone={programReady ? "good" : "neutral"}>
                {programReady ? "On air" : "Empty"}
              </StatusPill>
            </div>
            <dl className="compact-list">
              <Metric label="Graphic type" value={production.graphicTakeState.graphicType} />
              <Metric
                label="Take state"
                value={<StatusPill tone={getGraphicTone(production.graphicTakeState.status)}>{production.graphicTakeState.status}</StatusPill>}
              />
              <Metric label="Payload" value={programReady ? "On Program" : "None"} />
              <Metric label="Updated" value={formatDateTime(production.graphicTakeState.updatedAt)} />
            </dl>
          </article>
        </div>
      </Section>

      <Section title="Manual Production Controls">
        <div className="operator-selector-grid">
          <label className="field-label">
            Graphic
            <select
              value={selectedGraphicType}
              onChange={(event) => setSelectedGraphicType(event.currentTarget.value as GraphicType)}
            >
              {GRAPHIC_TYPES.map((graphicType) => (
                <option key={graphicType} value={graphicType}>
                  {graphicType}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Emergency public message
            <select
              value={emergencyMessage}
              onChange={(event) => setEmergencyMessage(event.currentTarget.value as (typeof EMERGENCY_MESSAGES)[number])}
            >
              {EMERGENCY_MESSAGES.map((message) => (
                <option key={message} value={message}>
                  {message}
                </option>
              ))}
            </select>
          </label>
          <div className="field-action">
            <button
              className="secondary-button"
              type="button"
              disabled={mutationBusy}
              onClick={() => void previewGraphic()}
            >
              Preview Graphic
            </button>
          </div>
        </div>

        <div className="operator-controls">
          <button
            className="danger-button"
            type="button"
            disabled={mutationBusy || !previewReady}
            onClick={confirmTake}
          >
            Take to Program
          </button>
          <button
            className="danger-button"
            type="button"
            disabled={mutationBusy || !programReady}
            onClick={confirmClearProgram}
          >
            Clear Program
          </button>
          <button
            className="danger-button"
            type="button"
            disabled={mutationBusy || production.emergency.active}
            onClick={confirmEmergencyTrigger}
          >
            Trigger Emergency
          </button>
          <button
            className="danger-button"
            type="button"
            disabled={mutationBusy || !production.emergency.active}
            onClick={confirmEmergencyClear}
          >
            Clear Emergency
          </button>
        </div>
      </Section>

      <Section title="Emergency State">
        <dl className="metric-grid">
          <Metric
            label="Status"
            value={
              <StatusPill tone={production.emergency.active ? "danger" : "good"}>
                {production.emergency.active ? "ACTIVE" : "READY"}
              </StatusPill>
            }
          />
          <Metric label="Public message" value={publicEmergencyMessageState} />
          <Metric label="Triggered" value={formatDateTime(production.emergency.triggeredAt)} />
          <Metric label="Cleared" value={formatDateTime(production.emergency.clearedAt)} />
        </dl>
      </Section>

      <ProducerConfirmationDialog
        pending={pendingConfirmation}
        confirmationText={confirmationText}
        busy={mutationBusy}
        onConfirmationTextChange={setConfirmationText}
        onCancel={() => setPendingConfirmation(null)}
        onConfirm={() => void confirmPendingAction()}
      />
    </div>
  );
}
