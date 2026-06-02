export type OverlayRouteKind =
  | "program"
  | "preview"
  | "draft"
  | "scorebug"
  | "emergency"
  | "unknown";

export interface OverlayRoute {
  kind: OverlayRouteKind;
  path: string;
  routeName: string;
  matchId?: string;
  debug: boolean;
}

function decodeRouteSegment(segment: string | undefined): string | undefined {
  if (!segment) {
    return undefined;
  }

  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function parseOverlayRoute(pathname: string, search = ""): OverlayRoute {
  const normalizedPath = pathname === "/" ? "/overlay/program" : pathname.replace(/\/+$/, "");
  const parts = normalizedPath.split("/").filter(Boolean);
  const query = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const debug = query.get("debug") === "1";

  if (parts[0] !== "overlay") {
    return {
      kind: "unknown",
      path: normalizedPath,
      routeName: "Unknown Overlay Route",
      debug
    };
  }

  if (parts[1] === "program" && parts.length === 2) {
    return { kind: "program", path: normalizedPath, routeName: "Program", debug };
  }

  if (parts[1] === "preview" && parts.length === 2) {
    return { kind: "preview", path: normalizedPath, routeName: "Preview", debug };
  }

  if (parts[1] === "emergency" && parts.length === 2) {
    return { kind: "emergency", path: normalizedPath, routeName: "Emergency", debug };
  }

  if (parts[1] === "draft" && parts.length === 3) {
    return {
      kind: "draft",
      path: normalizedPath,
      routeName: "Draft",
      matchId: decodeRouteSegment(parts[2]),
      debug
    };
  }

  if (parts[1] === "scorebug" && parts.length === 3) {
    return {
      kind: "scorebug",
      path: normalizedPath,
      routeName: "Score Bug",
      matchId: decodeRouteSegment(parts[2]),
      debug
    };
  }

  return {
    kind: "unknown",
    path: normalizedPath,
    routeName: "Unknown Overlay Route",
    debug
  };
}
