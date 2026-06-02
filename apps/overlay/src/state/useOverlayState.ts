import { useEffect, useReducer } from "react";

import type { OverlayRoute } from "../routes/route";
import { initialOverlayClientState, overlayReducer } from "./overlayState";
import { connectOverlaySocket } from "./socketClient";

export function useOverlayState(route: OverlayRoute) {
  const [state, dispatch] = useReducer(overlayReducer, initialOverlayClientState);

  useEffect(() => {
    const connection = connectOverlaySocket(
      {
        onStatus(status, message) {
          dispatch({ type: "socket:status", status, message });
        },
        onStateFull(envelope) {
          dispatch({ type: "socket:state-full", envelope });
        },
        onHealthUpdate(envelope) {
          dispatch({ type: "socket:health-update", envelope });
        },
        onDraftUpdated(envelope) {
          dispatch({ type: "socket:draft-updated", envelope });
        },
        onSocketError(message) {
          dispatch({ type: "socket:error", message });
        }
      },
      {
        route: route.path,
        matchId: route.matchId
      }
    );

    return () => {
      connection.disconnect();
    };
  }, [route.matchId, route.path]);

  return state;
}
