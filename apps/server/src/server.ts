import type { Server } from "node:http";

import { createHttpServer } from "./api.js";
import type { RealtimeController } from "./realtime.js";
import { createServerRuntimeState, type ServerRuntimeState } from "./runtime-state.js";
import { createSocketRealtimeController } from "./socket.js";

export interface StartServerOptions {
  eventPackagePath?: string;
  host?: string;
  port?: number;
  repositoryRoot?: string;
  now?: string;
  logger?: Pick<Console, "error" | "log">;
}

export interface StartedServer {
  server: Server;
  runtimeState: ServerRuntimeState;
  realtime: RealtimeController;
  host: string;
  port: number;
}

export async function createServerApp(options: StartServerOptions = {}): Promise<{
  server: Server;
  runtimeState: ServerRuntimeState;
  realtime: RealtimeController;
}> {
  const runtimeState = await createServerRuntimeState({
    eventPackagePath: options.eventPackagePath,
    repositoryRoot: options.repositoryRoot,
    now: options.now
  });
  const realtime = createSocketRealtimeController(runtimeState);
  const server = createHttpServer(runtimeState, realtime);

  realtime.attach(server);

  return {
    server,
    runtimeState,
    realtime
  };
}

export async function startServer(options: StartServerOptions = {}): Promise<StartedServer> {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 3000;
  const logger = options.logger ?? console;
  const { server, runtimeState, realtime } = await createServerApp(options);

  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error): void => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = (): void => {
      server.off("error", onError);
      resolve();
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });

  logger.log(`@mmbt/server listening on ${host}:${port}`);

  return {
    server,
    runtimeState,
    realtime,
    host,
    port
  };
}
