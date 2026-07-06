import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export * from "./adapter-loader.js";
export * from "./api.js";
export * from "./audit-log.js";
export * from "./draft-runtime.js";
export * from "./event-package-loader.js";
export * from "./paths.js";
export * from "./production-runtime.js";
export * from "./realtime.js";
export * from "./result.js";
export * from "./runtime-state.js";
export * from "./server.js";
export * from "./state-snapshot.js";
export * from "./socket.js";

import { startServer } from "./server.js";

function parsePort(value: string | undefined): number {
  if (!value) {
    return 3000;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 3000;
}

function isMainModule(): boolean {
  const entryPoint = process.argv[1];

  if (!entryPoint) {
    return false;
  }

  return import.meta.url === pathToFileURL(resolve(entryPoint)).href;
}

if (isMainModule()) {
  startServer({
    port: parsePort(process.env.PORT),
    host: process.env.HOST ?? "127.0.0.1",
    eventPackagePath: process.env.MMBT_EVENT_PACKAGE_PATH
  }).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
