import { useMemo } from "react";

import { OverlayRouteView } from "./routes/OverlayRouteView";
import { parseOverlayRoute } from "./routes/route";
import { useOverlayState } from "./state/useOverlayState";

export function App() {
  const pathname = typeof window === "undefined" ? "/overlay/program" : window.location.pathname;
  const search = typeof window === "undefined" ? "" : window.location.search;
  const route = useMemo(() => parseOverlayRoute(pathname, search), [pathname, search]);
  const clientState = useOverlayState(route);

  return <OverlayRouteView route={route} clientState={clientState} />;
}
