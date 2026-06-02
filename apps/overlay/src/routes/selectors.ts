import type { OverlayClientState, OverlayMatch } from "../client/types";
import type { OverlayRoute } from "./route";

export type OverlayRouteRuntimeStatus =
  | "loading"
  | "ready"
  | "disconnected"
  | "stale"
  | "missing-match";

export function selectMatchForRoute(
  state: OverlayClientState,
  route: OverlayRoute
): OverlayMatch | null {
  if (!route.matchId || !state.snapshot) {
    return null;
  }

  return state.snapshot.matches.find((match) => match.id === route.matchId) ?? null;
}

export function selectOverlayRuntimeStatus(
  state: OverlayClientState,
  route: OverlayRoute
): OverlayRouteRuntimeStatus {
  if (!state.snapshot) {
    return state.socketStatus === "disconnected" || state.socketStatus === "error"
      ? "disconnected"
      : "loading";
  }

  if ((route.kind === "draft" || route.kind === "scorebug") && !selectMatchForRoute(state, route)) {
    return "missing-match";
  }

  if (state.socketStatus === "disconnected" || state.socketStatus === "error") {
    return "stale";
  }

  return "ready";
}
