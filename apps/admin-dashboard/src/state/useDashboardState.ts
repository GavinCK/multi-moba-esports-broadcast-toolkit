import { useCallback, useEffect, useMemo, useReducer } from "react";

import {
  createDashboardApiClient,
  toDashboardApiError,
  type DashboardApiClient
} from "../client/apiClient";
import type { DashboardClientError } from "../client/types";
import {
  dashboardReducer,
  initialDashboardState,
  type DashboardClientState
} from "./dashboardState";
import {
  connectDashboardSocket,
  type DashboardSocketConnection,
  type DashboardSocketHandlers
} from "./socketClient";

export interface UseDashboardStateOptions {
  apiClient?: DashboardApiClient;
  apiBaseUrl?: string;
  disableSocket?: boolean;
  connectSocket?: (
    handlers: DashboardSocketHandlers
  ) => DashboardSocketConnection;
}

export interface UseDashboardStateResult {
  state: DashboardClientState;
  refresh(): Promise<void>;
}

function toClientError(error: unknown): DashboardClientError {
  const apiError = toDashboardApiError(error);

  return {
    code: apiError.code,
    message: apiError.message,
    status: apiError.status,
    details: apiError.details
  };
}

export function useDashboardState(
  options: UseDashboardStateOptions = {}
): UseDashboardStateResult {
  const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState);
  const apiClient = useMemo(
    () => options.apiClient ?? createDashboardApiClient({ baseUrl: options.apiBaseUrl }),
    [options.apiBaseUrl, options.apiClient]
  );

  const refresh = useCallback(async () => {
    dispatch({ type: "rest:loading" });

    try {
      const [health, snapshot] = await Promise.all([
        apiClient.getHealth(),
        apiClient.getState()
      ]);

      dispatch({
        type: "rest:success",
        health,
        snapshot
      });
    } catch (error) {
      dispatch({
        type: "rest:error",
        error: toClientError(error)
      });
    }
  }, [apiClient]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (options.disableSocket) {
      dispatch({ type: "socket:status", status: "disabled" });
      return undefined;
    }

    const connect = options.connectSocket ?? connectDashboardSocket;
    const connection = connect({
      onStatus(status, message) {
        dispatch({ type: "socket:status", status, message });
      },
      onStateFull(envelope) {
        dispatch({ type: "socket:state-full", envelope });
      },
      onHealthUpdate(envelope) {
        dispatch({ type: "socket:health-update", envelope });
      },
      onSocketError(message) {
        dispatch({ type: "socket:error", message });
      }
    });

    return () => {
      connection.disconnect();
    };
  }, [options.connectSocket, options.disableSocket]);

  return {
    state,
    refresh
  };
}
