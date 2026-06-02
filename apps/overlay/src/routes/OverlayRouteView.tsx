import type { OverlayClientState } from "../client/types";
import { OverlayDebugPanel } from "../components/OverlayDebugPanel";
import { DraftOverlay } from "../overlays/DraftOverlay";
import { EmergencyOverlay } from "../overlays/EmergencyOverlay";
import { PreviewOverlay } from "../overlays/PreviewOverlay";
import { ProgramOverlay } from "../overlays/ProgramOverlay";
import { ScoreBugOverlay } from "../overlays/ScoreBugOverlay";
import type { OverlayRoute } from "./route";
import { selectOverlayRuntimeStatus } from "./selectors";

function getRuntimeMessage(status: ReturnType<typeof selectOverlayRuntimeStatus>): string {
  switch (status) {
    case "loading":
      return "Waiting for signal";
    case "disconnected":
      return "Signal unavailable";
    case "stale":
      return "Signal stale";
    case "missing-match":
      return "Match not found";
    case "ready":
      return "Ready";
    default:
      return "Standby";
  }
}

interface OverlayRouteViewProps {
  route: OverlayRoute;
  clientState: OverlayClientState;
}

export function OverlayRouteView({ route, clientState }: OverlayRouteViewProps) {
  if (route.kind === "program") {
    return (
      <div className="overlay-root" data-testid="overlay-root">
        <main
          className="overlay-canvas overlay-canvas--program"
          data-testid="overlay-canvas"
          data-canvas-size="1920x1080"
          aria-label={`${route.routeName} overlay`}
        >
          <ProgramOverlay clientState={clientState} debug={route.debug} />
          {route.debug ? <OverlayDebugPanel route={route} clientState={clientState} /> : null}
        </main>
      </div>
    );
  }

  if (route.kind === "preview") {
    return (
      <div className="overlay-root" data-testid="overlay-root">
        <main
          className="overlay-canvas overlay-canvas--preview"
          data-testid="overlay-canvas"
          data-canvas-size="1920x1080"
          aria-label={`${route.routeName} overlay`}
        >
          <PreviewOverlay clientState={clientState} debug={route.debug} />
          {route.debug ? <OverlayDebugPanel route={route} clientState={clientState} /> : null}
        </main>
      </div>
    );
  }

  if (route.kind === "draft") {
    return (
      <div className="overlay-root" data-testid="overlay-root">
        <main
          className="overlay-canvas overlay-canvas--draft"
          data-testid="overlay-canvas"
          data-canvas-size="1920x1080"
          aria-label={`${route.routeName} overlay`}
        >
          <DraftOverlay clientState={clientState} matchId={route.matchId} debug={route.debug} />
          {route.debug ? <OverlayDebugPanel route={route} clientState={clientState} /> : null}
        </main>
      </div>
    );
  }

  if (route.kind === "scorebug") {
    return (
      <div className="overlay-root" data-testid="overlay-root">
        <main
          className="overlay-canvas overlay-canvas--scorebug"
          data-testid="overlay-canvas"
          data-canvas-size="1920x1080"
          aria-label={`${route.routeName} overlay`}
        >
          <ScoreBugOverlay clientState={clientState} matchId={route.matchId} debug={route.debug} />
          {route.debug ? <OverlayDebugPanel route={route} clientState={clientState} /> : null}
        </main>
      </div>
    );
  }

  if (route.kind === "emergency") {
    return (
      <div className="overlay-root" data-testid="overlay-root">
        <main
          className="overlay-canvas overlay-canvas--emergency"
          data-testid="overlay-canvas"
          data-canvas-size="1920x1080"
          aria-label={`${route.routeName} overlay`}
        >
          <EmergencyOverlay clientState={clientState} debug={route.debug} />
          {route.debug ? <OverlayDebugPanel route={route} clientState={clientState} /> : null}
        </main>
      </div>
    );
  }

  const runtimeStatus = selectOverlayRuntimeStatus(clientState, route);

  return (
    <div className="overlay-root" data-testid="overlay-root">
      <main
        className={`overlay-canvas overlay-canvas--${route.kind}`}
        data-testid="overlay-canvas"
        data-canvas-size="1920x1080"
        aria-label={`${route.routeName} overlay`}
      >
        <section className="overlay-standby" aria-live="polite">
          <p className="overlay-standby__kicker">{getRuntimeMessage(runtimeStatus)}</p>
          <h1>Overlay Route Not Found</h1>
          <p>Transparent standby</p>
        </section>
        {route.debug ? <OverlayDebugPanel route={route} clientState={clientState} /> : null}
      </main>
    </div>
  );
}
