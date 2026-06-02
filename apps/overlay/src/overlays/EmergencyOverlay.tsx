import type { OverlayClientState } from "../client/types";

type EmergencyOverlayState = "loading" | "inactive" | "active";
type EmergencyGraphicContext = "route" | "program" | "payload";

export interface EmergencyOverlayViewModel {
  state: EmergencyOverlayState;
  active: boolean;
  message: string;
  subtitle: string;
  triggeredAt: string | null;
  clearedAt: string | null;
  connectionLabel: "connected" | "connecting" | "disconnected" | "error" | "stale";
  revision: number | null;
  lastUpdatedAt: string | null;
  messageSource: "public-state" | "fallback";
  warnings: string[];
}

const FALLBACK_PUBLIC_EMERGENCY_MESSAGE = "Technical Pause";
const DEFAULT_EMERGENCY_SUBTITLE = "Broadcast will resume shortly";
const PUBLIC_SAFE_MESSAGES = new Set([
  "technical pause",
  "broadcast standby",
  "emergency mode",
  "stand by",
  "broadcast will resume shortly",
  "match paused"
]);

function getConnectionLabel(
  clientState: OverlayClientState,
  hasSnapshot: boolean
): EmergencyOverlayViewModel["connectionLabel"] {
  if (
    hasSnapshot &&
    (clientState.socketStatus === "disconnected" || clientState.socketStatus === "error")
  ) {
    return "stale";
  }

  return clientState.socketStatus;
}

function isSecretLikeEmergencyText(value: string): boolean {
  return /private|secret|token|password|operator|stack|trace|path|reason|raw|file:|[a-z]:\\|\/users\//i.test(
    value
  );
}

export function normalizePublicEmergencyMessage(value: string | null | undefined): {
  message: string;
  source: EmergencyOverlayViewModel["messageSource"];
} {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return { message: FALLBACK_PUBLIC_EMERGENCY_MESSAGE, source: "fallback" };
  }

  if (
    trimmedValue.length <= 64 &&
    !isSecretLikeEmergencyText(trimmedValue) &&
    (/^[\w\s.,!?'-]+$/.test(trimmedValue) ||
      PUBLIC_SAFE_MESSAGES.has(trimmedValue.toLowerCase()))
  ) {
    return { message: trimmedValue, source: "public-state" };
  }

  return { message: FALLBACK_PUBLIC_EMERGENCY_MESSAGE, source: "fallback" };
}

export function selectEmergencyOverlayViewModel(
  clientState: OverlayClientState
): EmergencyOverlayViewModel {
  const snapshot = clientState.snapshot;

  if (!snapshot) {
    return {
      state: "loading",
      active: false,
      message:
        clientState.socketStatus === "disconnected" || clientState.socketStatus === "error"
          ? "Signal unavailable"
          : "Emergency Standby",
      subtitle: "Waiting for production state.",
      triggeredAt: null,
      clearedAt: null,
      connectionLabel: getConnectionLabel(clientState, false),
      revision: null,
      lastUpdatedAt: clientState.lastUpdatedAt,
      messageSource: "fallback",
      warnings: ["No runtime state snapshot has been received."]
    };
  }

  const emergency = snapshot.production.emergency;
  const normalizedMessage = normalizePublicEmergencyMessage(emergency.message);
  const warnings: string[] = [];

  if (emergency.active && normalizedMessage.source === "fallback") {
    warnings.push("Emergency message used built-in public-safe fallback.");
  }

  return {
    state: emergency.active ? "active" : "inactive",
    active: emergency.active,
    message: emergency.active ? normalizedMessage.message : "Emergency Standby",
    subtitle: emergency.active ? DEFAULT_EMERGENCY_SUBTITLE : "Transparent standby",
    triggeredAt: emergency.triggeredAt ?? null,
    clearedAt: emergency.clearedAt ?? null,
    connectionLabel: getConnectionLabel(clientState, true),
    revision: snapshot.revision,
    lastUpdatedAt: clientState.lastUpdatedAt ?? snapshot.timestamp,
    messageSource: emergency.active ? normalizedMessage.source : "fallback",
    warnings
  };
}

export function EmergencyGraphic({
  viewModel,
  context = "route"
}: {
  viewModel: EmergencyOverlayViewModel;
  context?: EmergencyGraphicContext;
}) {
  return (
    <section
      className={`emergency-graphic emergency-graphic--${viewModel.state}`}
      data-testid="emergency-graphic"
      data-emergency-active={viewModel.active ? "true" : "false"}
      data-emergency-context={context}
      aria-label="Emergency overlay"
    >
      <div className="emergency-graphic__frame">
        <p>{viewModel.active ? "Emergency" : "Emergency Source"}</p>
        <h1>{viewModel.message}</h1>
        <span>{viewModel.subtitle}</span>
        {viewModel.active && viewModel.triggeredAt ? (
          <time dateTime={viewModel.triggeredAt}>Triggered {viewModel.triggeredAt}</time>
        ) : null}
      </div>
    </section>
  );
}

function EmergencyDiagnostics({ viewModel }: { viewModel: EmergencyOverlayViewModel }) {
  return (
    <aside className="emergency-diagnostics" aria-label="Emergency overlay diagnostics">
      <strong>Emergency Diagnostics</strong>
      <dl>
        <div>
          <dt>Status</dt>
          <dd>{viewModel.active ? "active" : "inactive"}</dd>
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
          <dt>Message</dt>
          <dd>{viewModel.messageSource}</dd>
        </div>
        <div>
          <dt>Warnings</dt>
          <dd>{viewModel.warnings.length > 0 ? viewModel.warnings.join("; ") : "none"}</dd>
        </div>
      </dl>
    </aside>
  );
}

export function EmergencyOverlay({
  clientState,
  debug
}: {
  clientState: OverlayClientState;
  debug: boolean;
}) {
  const viewModel = selectEmergencyOverlayViewModel(clientState);

  return (
    <>
      <EmergencyGraphic viewModel={viewModel} />
      {debug ? <EmergencyDiagnostics viewModel={viewModel} /> : null}
    </>
  );
}
