import type { OverlayClientState } from "../client/types";
import type { OverlayRoute } from "../routes/route";
import { selectOverlayRuntimeStatus } from "../routes/selectors";

interface OverlayDebugPanelProps {
  route: OverlayRoute;
  clientState: OverlayClientState;
}

function formatValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "none";
  }

  return String(value);
}

export function OverlayDebugPanel({ route, clientState }: OverlayDebugPanelProps) {
  const snapshot = clientState.snapshot;
  const health = clientState.health ?? snapshot?.health;
  const runtimeStatus = selectOverlayRuntimeStatus(clientState, route);
  const emergencyActive = snapshot?.production.emergency.active === true ? "active" : "inactive";

  return (
    <aside className="overlay-debug" aria-label="Overlay debug diagnostics">
      <div className="overlay-debug__title">Debug</div>
      <dl>
        <div>
          <dt>Route</dt>
          <dd>{route.routeName}</dd>
        </div>
        <div>
          <dt>Path</dt>
          <dd>{route.path}</dd>
        </div>
        <div>
          <dt>Match</dt>
          <dd>{formatValue(route.matchId)}</dd>
        </div>
        <div>
          <dt>Connection</dt>
          <dd>{clientState.socketStatus}</dd>
        </div>
        <div>
          <dt>Runtime</dt>
          <dd>{runtimeStatus}</dd>
        </div>
        <div>
          <dt>Server</dt>
          <dd>{formatValue(health?.status)}</dd>
        </div>
        <div>
          <dt>Revision</dt>
          <dd>{formatValue(snapshot?.revision)}</dd>
        </div>
        <div>
          <dt>Last update</dt>
          <dd>{formatValue(clientState.lastUpdatedAt ?? snapshot?.timestamp)}</dd>
        </div>
        <div>
          <dt>Emergency</dt>
          <dd>{emergencyActive}</dd>
        </div>
      </dl>
    </aside>
  );
}
