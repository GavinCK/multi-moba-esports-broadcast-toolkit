import type { JsonValue } from "@mmbt/shared-types";

import type { OverlayClientState, OverlayRuntimeState } from "../client/types";
import { DraftOverlay } from "./DraftOverlay";
import { EmergencyGraphic, selectEmergencyOverlayViewModel } from "./EmergencyOverlay";
import { ScoreBugOverlay } from "./ScoreBugOverlay";

export type ProductionGraphicRoute = "program" | "preview";
type ProductionGraphicState =
  | "loading"
  | "standby"
  | "ready"
  | "emergency-override"
  | "missing-payload"
  | "unsupported";
type SupportedProductionGraphicType = "DRAFT_OVERLAY" | "SCORE_BUG" | "EMERGENCY";

export interface ProductionGraphicViewModel {
  route: ProductionGraphicRoute;
  state: ProductionGraphicState;
  graphicType: string | null;
  declaredGraphicType: string | null;
  payloadGraphicType: string | null;
  payloadPresent: boolean;
  matchId: string | null;
  draftId: string | null;
  emergencyActive: boolean;
  connectionLabel: "connected" | "connecting" | "disconnected" | "error" | "stale";
  revision: number | null;
  lastUpdatedAt: string | null;
  payloadSummary: string;
  warnings: string[];
}

function isRecord(value: JsonValue | null): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStringField(value: JsonValue | null, fieldName: string): string | null {
  if (!isRecord(value)) {
    return null;
  }

  const fieldValue = value[fieldName];

  return typeof fieldValue === "string" && fieldValue.trim().length > 0
    ? fieldValue
    : null;
}

function readPayloadGraphicType(payload: JsonValue | null): string | null {
  return readStringField(payload, "graphicType");
}

function readDraftId(payload: JsonValue | null): string | null {
  return readStringField(payload, "draftId");
}

function readMatchId(
  state: OverlayRuntimeState,
  payload: JsonValue | null
): string | null {
  const payloadMatchId = readStringField(payload, "matchId");

  if (payloadMatchId) {
    return payloadMatchId;
  }

  const payloadDraftId = readDraftId(payload);

  if (payloadDraftId && state.drafts[payloadDraftId]?.matchId) {
    return state.drafts[payloadDraftId].matchId;
  }

  return null;
}

function isSupportedProductionGraphicType(
  graphicType: string | null
): graphicType is SupportedProductionGraphicType {
  return (
    graphicType === "DRAFT_OVERLAY" ||
    graphicType === "SCORE_BUG" ||
    graphicType === "EMERGENCY"
  );
}

function getConnectionLabel(
  clientState: OverlayClientState,
  hasSnapshot: boolean
): ProductionGraphicViewModel["connectionLabel"] {
  if (
    hasSnapshot &&
    (clientState.socketStatus === "disconnected" || clientState.socketStatus === "error")
  ) {
    return "stale";
  }

  return clientState.socketStatus;
}

function summarizePayload(payload: JsonValue | null): string {
  if (payload === null) {
    return "absent";
  }

  if (Array.isArray(payload)) {
    return `array:${payload.length}`;
  }

  if (isRecord(payload)) {
    return `object:${Object.keys(payload).length}`;
  }

  return typeof payload;
}

function getPayloadForRoute(
  state: OverlayRuntimeState,
  route: ProductionGraphicRoute
): JsonValue | null {
  return route === "program"
    ? state.production.graphicTakeState.programPayload
    : state.production.graphicTakeState.previewPayload;
}

export function selectProductionGraphicViewModel(
  clientState: OverlayClientState,
  route: ProductionGraphicRoute
): ProductionGraphicViewModel {
  const snapshot = clientState.snapshot;

  if (!snapshot) {
    return {
      route,
      state: "loading",
      graphicType: null,
      declaredGraphicType: null,
      payloadGraphicType: null,
      payloadPresent: false,
      matchId: null,
      draftId: null,
      emergencyActive: false,
      connectionLabel: getConnectionLabel(clientState, false),
      revision: null,
      lastUpdatedAt: clientState.lastUpdatedAt,
      payloadSummary: "absent",
      warnings: ["No runtime state snapshot has been received."]
    };
  }

  const production = snapshot.production;
  const emergencyActive = production.emergency.active;

  if (route === "program" && emergencyActive) {
    return {
      route,
      state: "emergency-override",
      graphicType: "EMERGENCY",
      declaredGraphicType: production.graphicTakeState.graphicType,
      payloadGraphicType: null,
      payloadPresent: true,
      matchId: null,
      draftId: null,
      emergencyActive,
      connectionLabel: getConnectionLabel(clientState, true),
      revision: snapshot.revision,
      lastUpdatedAt: clientState.lastUpdatedAt ?? snapshot.timestamp,
      payloadSummary: "emergency-override",
      warnings: ["Program is showing emergency override."]
    };
  }

  const payload = getPayloadForRoute(snapshot, route);
  const payloadGraphicType = readPayloadGraphicType(payload);
  const declaredGraphicType = production.graphicTakeState.graphicType;
  const graphicType = payloadGraphicType ?? declaredGraphicType;
  const draftId = readDraftId(payload);
  const matchId = readMatchId(snapshot, payload);
  const payloadPresent = payload !== null;
  const warnings: string[] = [];

  if (!payloadPresent) {
    return {
      route,
      state: "standby",
      graphicType,
      declaredGraphicType,
      payloadGraphicType,
      payloadPresent,
      matchId,
      draftId,
      emergencyActive,
      connectionLabel: getConnectionLabel(clientState, true),
      revision: snapshot.revision,
      lastUpdatedAt: clientState.lastUpdatedAt ?? snapshot.timestamp,
      payloadSummary: "absent",
      warnings
    };
  }

  if (!isSupportedProductionGraphicType(graphicType)) {
    warnings.push("Graphic type is not implemented by the v0.1 overlay renderer.");

    return {
      route,
      state: "unsupported",
      graphicType,
      declaredGraphicType,
      payloadGraphicType,
      payloadPresent,
      matchId,
      draftId,
      emergencyActive,
      connectionLabel: getConnectionLabel(clientState, true),
      revision: snapshot.revision,
      lastUpdatedAt: clientState.lastUpdatedAt ?? snapshot.timestamp,
      payloadSummary: summarizePayload(payload),
      warnings
    };
  }

  if ((graphicType === "DRAFT_OVERLAY" || graphicType === "SCORE_BUG") && !matchId) {
    warnings.push("Graphic payload is missing a resolvable matchId or draftId.");

    return {
      route,
      state: "missing-payload",
      graphicType,
      declaredGraphicType,
      payloadGraphicType,
      payloadPresent,
      matchId,
      draftId,
      emergencyActive,
      connectionLabel: getConnectionLabel(clientState, true),
      revision: snapshot.revision,
      lastUpdatedAt: clientState.lastUpdatedAt ?? snapshot.timestamp,
      payloadSummary: summarizePayload(payload),
      warnings
    };
  }

  return {
    route,
    state: "ready",
    graphicType,
    declaredGraphicType,
    payloadGraphicType,
    payloadPresent,
    matchId,
    draftId,
    emergencyActive,
    connectionLabel: getConnectionLabel(clientState, true),
    revision: snapshot.revision,
    lastUpdatedAt: clientState.lastUpdatedAt ?? snapshot.timestamp,
    payloadSummary: summarizePayload(payload),
    warnings
  };
}

function getRouteLabel(route: ProductionGraphicRoute): string {
  return route === "program" ? "Program" : "Preview";
}

function ProductionStandby({ viewModel }: { viewModel: ProductionGraphicViewModel }) {
  const routeLabel = getRouteLabel(viewModel.route);
  const disconnected =
    viewModel.connectionLabel === "disconnected" || viewModel.connectionLabel === "error";
  let title = `${routeLabel} Standby`;
  let subtitle =
    viewModel.route === "program" ? "No program graphic" : "No preview graphic";

  if (viewModel.state === "loading") {
    title = disconnected ? "Signal unavailable" : "Waiting for signal";
    subtitle = `${routeLabel} state will appear when the server snapshot arrives.`;
  }

  if (viewModel.state === "standby" && viewModel.connectionLabel === "stale") {
    title = "Signal stale";
    subtitle = `${routeLabel} is holding the last known production state.`;
  }

  if (viewModel.state === "unsupported") {
    title = "Unsupported Graphic";
    subtitle = "Safe standby is active for this graphic type.";
  }

  if (viewModel.state === "missing-payload") {
    title = "Graphic Standby";
    subtitle = "The payload is missing required public IDs.";
  }

  return (
    <section
      className={`production-standby production-standby--${viewModel.route}`}
      data-testid={`${viewModel.route}-standby`}
      data-production-state={viewModel.state}
      aria-live="polite"
    >
      <p>{routeLabel}</p>
      <h1>{title}</h1>
      <span>{subtitle}</span>
    </section>
  );
}

export function ProductionGraphicDiagnostics({
  viewModel
}: {
  viewModel: ProductionGraphicViewModel;
}) {
  return (
    <aside className="production-diagnostics" aria-label="Production graphic diagnostics">
      <strong>Graphic Diagnostics</strong>
      <dl>
        <div>
          <dt>Route</dt>
          <dd>{getRouteLabel(viewModel.route)}</dd>
        </div>
        <div>
          <dt>State</dt>
          <dd>{viewModel.state}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{viewModel.graphicType ?? "none"}</dd>
        </div>
        <div>
          <dt>Payload</dt>
          <dd>{viewModel.payloadPresent ? "present" : "absent"}</dd>
        </div>
        <div>
          <dt>Summary</dt>
          <dd>{viewModel.payloadSummary}</dd>
        </div>
        <div>
          <dt>Match</dt>
          <dd>{viewModel.matchId ?? "none"}</dd>
        </div>
        <div>
          <dt>Draft</dt>
          <dd>{viewModel.draftId ?? "none"}</dd>
        </div>
        <div>
          <dt>Emergency</dt>
          <dd>{viewModel.emergencyActive ? "active" : "inactive"}</dd>
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

export function ProductionGraphicRenderer({
  clientState,
  viewModel,
  debug
}: {
  clientState: OverlayClientState;
  viewModel: ProductionGraphicViewModel;
  debug: boolean;
}) {
  if (viewModel.state === "emergency-override") {
    return (
      <section
        className="production-graphic production-graphic--emergency"
        data-testid={`${viewModel.route}-graphic`}
        data-graphic-type="EMERGENCY"
        data-production-state={viewModel.state}
      >
        <EmergencyGraphic
          viewModel={selectEmergencyOverlayViewModel(clientState)}
          context="program"
        />
        {debug ? <ProductionGraphicDiagnostics viewModel={viewModel} /> : null}
      </section>
    );
  }

  if (viewModel.state !== "ready" || !viewModel.graphicType) {
    return (
      <>
        <ProductionStandby viewModel={viewModel} />
        {debug ? <ProductionGraphicDiagnostics viewModel={viewModel} /> : null}
      </>
    );
  }

  return (
    <section
      className={`production-graphic production-graphic--${viewModel.graphicType.toLowerCase().replace(/_/g, "-")}`}
      data-testid={`${viewModel.route}-graphic`}
      data-graphic-type={viewModel.graphicType}
      data-production-state={viewModel.state}
      data-match-id={viewModel.matchId ?? "none"}
      data-draft-id={viewModel.draftId ?? "none"}
      aria-label={`${getRouteLabel(viewModel.route)} graphic`}
    >
      {viewModel.graphicType === "DRAFT_OVERLAY" && viewModel.matchId ? (
        <DraftOverlay clientState={clientState} matchId={viewModel.matchId} debug={false} />
      ) : null}
      {viewModel.graphicType === "SCORE_BUG" && viewModel.matchId ? (
        <ScoreBugOverlay clientState={clientState} matchId={viewModel.matchId} debug={false} />
      ) : null}
      {viewModel.graphicType === "EMERGENCY" ? (
        <EmergencyGraphic
          viewModel={selectEmergencyOverlayViewModel(clientState)}
          context="payload"
        />
      ) : null}
      {debug ? <ProductionGraphicDiagnostics viewModel={viewModel} /> : null}
    </section>
  );
}
