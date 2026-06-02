import type { OverlayClientState, OverlayMatch } from "../client/types";
import { OverlayDebugPanel } from "../components/OverlayDebugPanel";
import type { OverlayRoute } from "./route";
import { selectMatchForRoute, selectOverlayRuntimeStatus } from "./selectors";

interface OverlayRouteViewProps {
  route: OverlayRoute;
  clientState: OverlayClientState;
}

function getShellCopy(route: OverlayRoute, match: OverlayMatch | null): {
  title: string;
  subtitle: string;
} {
  switch (route.kind) {
    case "program":
      return { title: "Program Standby", subtitle: "No program graphic" };
    case "preview":
      return { title: "Preview Standby", subtitle: "No preview graphic" };
    case "draft":
      return {
        title: "Draft Overlay Shell",
        subtitle: match ? match.title : "Match not found"
      };
    case "scorebug":
      return {
        title: "Score Bug Shell",
        subtitle: match ? `${match.title} | ${match.score.blue}-${match.score.red}` : "Match not found"
      };
    case "emergency":
      return { title: "Emergency Standby", subtitle: "Transparent standby" };
    default:
      return { title: "Overlay Route Not Found", subtitle: "Transparent standby" };
  }
}

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

function getProgramPreviewSubtitle(route: OverlayRoute, clientState: OverlayClientState): string | null {
  const takeState = clientState.snapshot?.production.graphicTakeState;

  if (!takeState) {
    return null;
  }

  if (route.kind === "program" && takeState.programPayload !== null) {
    return `${takeState.graphicType} on program`;
  }

  if (route.kind === "preview" && takeState.previewPayload !== null) {
    return `${takeState.graphicType} in preview`;
  }

  return null;
}

export function OverlayRouteView({ route, clientState }: OverlayRouteViewProps) {
  const match = selectMatchForRoute(clientState, route);
  const runtimeStatus = selectOverlayRuntimeStatus(clientState, route);
  const shellCopy = getShellCopy(route, match);
  const productionSubtitle = getProgramPreviewSubtitle(route, clientState);
  const emergencyActive = clientState.snapshot?.production.emergency.active === true;
  const title = route.kind === "emergency" && emergencyActive ? "Emergency Active" : shellCopy.title;
  const subtitle =
    route.kind === "emergency" && emergencyActive
      ? "Stand by"
      : productionSubtitle ?? shellCopy.subtitle;

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
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </section>
        {route.debug ? <OverlayDebugPanel route={route} clientState={clientState} /> : null}
      </main>
    </div>
  );
}
