import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import {
  createHealthResponse,
  createRuntimeStateSnapshot,
  createServerApp,
  createServerRuntimeState,
  getRepositoryRoot,
  STATE_SNAPSHOT_FILE_NAME,
  STALE_STATE_SNAPSHOT_FILE_NAME,
  writeRuntimeStateSnapshot,
  type LoadedEventPackage,
  type RuntimeStateSnapshot,
  type ServerRuntimeState
} from "./index";

const repositoryRoot = getRepositoryRoot();
const sampleEventPath = join(repositoryRoot, "event-packages", "sample-event");
const genericDraftId = "draft_generic-001";
const genericMatchId = "match_grand-final";
const genericActionId = "ban-1-blue:slot-0";
const genericHeroId = "generic-vanguard";
const lolMatchId = "match_lol-showmatch";
const noopLogger: Pick<Console, "warn"> = {
  warn() {
    // Tests assert behavior directly; snapshot warnings would only add noise.
  }
};
const tempPackages: string[] = [];

function createTempEventPackage(prefix = "mmbt-state-snapshot-"): string {
  const tempPackagePath = mkdtempPath(prefix);

  cpSync(sampleEventPath, tempPackagePath, { recursive: true });
  rmSync(join(tempPackagePath, "logs", "production-log.jsonl"), { force: true });
  tempPackages.push(tempPackagePath);

  return tempPackagePath;
}

function mkdtempPath(prefix: string): string {
  const tempRoot = join(tmpdir(), `${prefix}${Date.now()}-${Math.random().toString(16).slice(2)}`);

  mkdirSync(tempRoot, { recursive: true });

  return tempRoot;
}

function getSnapshotPath(packagePath: string): string {
  return join(packagePath, "runtime", STATE_SNAPSHOT_FILE_NAME);
}

function getStaleSnapshotPath(packagePath: string): string {
  return join(packagePath, "runtime", STALE_STATE_SNAPSHOT_FILE_NAME);
}

function readSnapshot(packagePath: string): RuntimeStateSnapshot {
  return JSON.parse(readFileSync(getSnapshotPath(packagePath), "utf8")) as RuntimeStateSnapshot;
}

function readAuditLogEntries(packagePath: string): Array<{ event?: string; nextRevision?: number }> {
  const logPath = join(packagePath, "logs", "production-log.jsonl");

  if (!existsSync(logPath)) {
    return [];
  }

  return readFileSync(logPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as { event?: string; nextRevision?: number });
}

function expectLoadedPackage(runtimeState: ServerRuntimeState): LoadedEventPackage {
  expect(runtimeState.eventPackageLoadResult.ok).toBe(true);

  if (!runtimeState.eventPackageLoadResult.ok) {
    throw new Error("Expected event package to load.");
  }

  return runtimeState.eventPackageLoadResult.value;
}

function expectSnapshot(runtimeState: ServerRuntimeState): RuntimeStateSnapshot {
  const snapshot = createRuntimeStateSnapshot(runtimeState, "2026-06-01T00:00:00.000Z");

  expect(snapshot.ok).toBe(true);

  if (!snapshot.ok) {
    throw new Error("Expected runtime state snapshot serialization to succeed.");
  }

  return snapshot.value;
}

function writeSnapshotFile(packagePath: string, snapshot: RuntimeStateSnapshot | string): void {
  mkdirSync(join(packagePath, "runtime"), { recursive: true });
  writeFileSync(
    getSnapshotPath(packagePath),
    typeof snapshot === "string" ? snapshot : `${JSON.stringify(snapshot, null, 2)}\n`,
    "utf8"
  );
}

async function requestJson(
  baseUrl: string,
  pathname: string,
  options: { method?: string; body?: unknown } = {}
): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: options.method ?? "GET",
    headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  return {
    status: response.status,
    body: await response.json()
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

afterEach(() => {
  while (tempPackages.length > 0) {
    const packagePath = tempPackages.pop();

    if (packagePath) {
      rmSync(packagePath, { recursive: true, force: true });
    }
  }
});

describe("runtime state snapshots", () => {
  it("serializes runtime state and restores live drafts as paused", async () => {
    const tempPackagePath = createTempEventPackage();
    const runtimeState = await createServerRuntimeState({
      eventPackagePath: tempPackagePath,
      repositoryRoot,
      now: "2026-06-01T09:00:00.000Z",
      logger: noopLogger
    });
    const draftEntry = runtimeState.drafts.drafts[genericDraftId];

    expect(draftEntry).toBeDefined();

    if (!draftEntry) {
      throw new Error("Expected generic draft runtime entry.");
    }

    runtimeState.drafts.drafts[genericDraftId] = {
      ...draftEntry,
      draft: {
        ...draftEntry.draft,
        status: "LIVE",
        timer: {
          isRunning: true,
          phaseStartedAt: "2026-06-01T09:00:00.000Z",
          remainingSeconds: 30,
          originalSeconds: 30
        },
        actions: draftEntry.draft.actions.map((action) =>
          action.id === genericActionId
            ? {
                ...action,
                heroId: genericHeroId,
                status: "LOCKED",
                lockedAt: "2026-06-01T09:00:05.000Z"
              }
            : action
        ),
        lockedHeroIds: [genericHeroId],
        bannedHeroIds: [genericHeroId],
        updatedAt: "2026-06-01T09:00:05.000Z"
      }
    };
    runtimeState.production = {
      ...runtimeState.production,
      status: "DRAFT_LIVE",
      activeMatchId: genericMatchId,
      activeDraftId: genericDraftId,
      updatedAt: "2026-06-01T09:00:06.000Z"
    };
    runtimeState.revision = 7;
    runtimeState.lastStateUpdateAt = "2026-06-01T09:00:06.000Z";

    const loadedPackage = expectLoadedPackage(runtimeState);

    loadedPackage.matches = loadedPackage.matches.map((match) =>
      match.id === lolMatchId
        ? {
            ...match,
            presentation: {
              ...match.presentation,
              patchLabel: "Patch restored",
              gameNumber: 2
            }
          }
        : match
    );

    const writeResult = writeRuntimeStateSnapshot(runtimeState, "2026-06-01T09:00:07.000Z");

    expect(writeResult.ok).toBe(true);
    expect(readSnapshot(tempPackagePath)).toMatchObject({
      revision: 7,
      drafts: {
        [genericDraftId]: {
          status: "LIVE",
          lockedHeroIds: [genericHeroId]
        }
      },
      matchPresentations: {
        [lolMatchId]: {
          patchLabel: "Patch restored",
          gameNumber: 2
        }
      }
    });

    const restoredRuntimeState = await createServerRuntimeState({
      eventPackagePath: tempPackagePath,
      repositoryRoot,
      now: "2026-06-01T09:05:00.000Z",
      logger: noopLogger
    });
    const restoredDraft = restoredRuntimeState.drafts.drafts[genericDraftId]?.draft;
    const restoredPackage = expectLoadedPackage(restoredRuntimeState);
    const restoredLoLMatch = restoredPackage.matches.find((match) => match.id === lolMatchId);

    expect(restoredRuntimeState.snapshot.restoredFromSnapshot).toBe(true);
    expect(createHealthResponse(restoredRuntimeState).restoredFromSnapshot).toBe(true);
    expect(restoredRuntimeState.revision).toBe(8);
    expect(restoredDraft).toMatchObject({
      status: "PAUSED",
      timer: {
        isRunning: false,
        remainingSeconds: 30,
        pausedAt: "2026-06-01T09:05:00.000Z"
      },
      lockedHeroIds: [genericHeroId],
      bannedHeroIds: [genericHeroId]
    });
    expect(restoredRuntimeState.production).toMatchObject({
      status: "DRAFT_LIVE",
      activeMatchId: genericMatchId,
      activeDraftId: genericDraftId,
      overlaySafety: {
        readOnly: true,
        mutationAllowed: false
      }
    });
    expect(restoredLoLMatch?.presentation).toMatchObject({
      patchLabel: "Patch restored",
      gameNumber: 2
    });
    expect(readAuditLogEntries(tempPackagePath)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: "STATE_RESTORED_FROM_SNAPSHOT",
          nextRevision: 8
        })
      ])
    );
    expect(readSnapshot(tempPackagePath)).toMatchObject({
      revision: 8,
      drafts: {
        [genericDraftId]: {
          status: "PAUSED"
        }
      }
    });
  });

  it("writes a debounced snapshot after a REST runtime revision increment", async () => {
    const tempPackagePath = createTempEventPackage("mmbt-state-snapshot-rest-");
    const { server, realtime } = await createServerApp({
      eventPackagePath: tempPackagePath,
      repositoryRoot,
      now: "2026-06-01T10:00:00.000Z",
      logger: noopLogger
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });

    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Expected local TCP server address.");
    }

    try {
      const start = await requestJson(`http://127.0.0.1:${(address as AddressInfo).port}`, `/api/drafts/${genericDraftId}/start`, {
        method: "POST",
        body: {
          operatorId: "draft-op",
          now: "2026-06-01T10:00:05.000Z"
        }
      });

      expect(start.status).toBe(200);
      await delay(650);

      expect(readSnapshot(tempPackagePath)).toMatchObject({
        revision: 2,
        drafts: {
          [genericDraftId]: {
            status: "LIVE"
          }
        }
      });
    } finally {
      await realtime.close();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }
  });

  it("renames a snapshot from a different event package path to stale and starts fresh", async () => {
    const tempPackagePath = createTempEventPackage("mmbt-state-snapshot-mismatch-");
    const runtimeState = await createServerRuntimeState({
      eventPackagePath: tempPackagePath,
      repositoryRoot,
      now: "2026-06-01T11:00:00.000Z",
      logger: noopLogger
    });
    const snapshot = {
      ...expectSnapshot(runtimeState),
      eventPackagePath: join(tempPackagePath, "different-package")
    };

    writeSnapshotFile(tempPackagePath, snapshot);

    const restoredRuntimeState = await createServerRuntimeState({
      eventPackagePath: tempPackagePath,
      repositoryRoot,
      now: "2026-06-01T11:05:00.000Z",
      logger: noopLogger
    });

    expect(restoredRuntimeState.snapshot.restoredFromSnapshot).toBe(false);
    expect(restoredRuntimeState.drafts.drafts[genericDraftId]?.draft.status).toBe("READY");
    expect(existsSync(getSnapshotPath(tempPackagePath))).toBe(false);
    expect(existsSync(getStaleSnapshotPath(tempPackagePath))).toBe(true);
  });

  it("renames a corrupt snapshot to stale and never crashes startup", async () => {
    const tempPackagePath = createTempEventPackage("mmbt-state-snapshot-corrupt-");

    writeSnapshotFile(tempPackagePath, "{ invalid json");

    const restoredRuntimeState = await createServerRuntimeState({
      eventPackagePath: tempPackagePath,
      repositoryRoot,
      now: "2026-06-01T12:00:00.000Z",
      logger: noopLogger
    });

    expect(restoredRuntimeState.snapshot.restoredFromSnapshot).toBe(false);
    expect(restoredRuntimeState.drafts.drafts[genericDraftId]?.draft.status).toBe("READY");
    expect(existsSync(getSnapshotPath(tempPackagePath))).toBe(false);
    expect(existsSync(getStaleSnapshotPath(tempPackagePath))).toBe(true);
  });
});
