export const overlayWorkspace = {
  name: "@mmbt/overlay",
  status: "overlay-shell",
  routesImplemented: true,
  routes: [
    "/overlay/program",
    "/overlay/preview",
    "/overlay/draft/:matchId",
    "/overlay/scorebug/:matchId",
    "/overlay/emergency"
  ],
  readOnlyBroadcastOutput: true
} as const;

export { App } from "./App";
export { parseOverlayRoute } from "./routes/route";
export { connectOverlaySocket } from "./state/socketClient";
