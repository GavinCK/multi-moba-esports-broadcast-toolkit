import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";

import { describe, expect, it } from "vitest";
import { io as createSocketClient, type Socket as ClientSocket } from "socket.io-client";

import {
  createServerApp,
  createServerRuntimeState,
  getRepositoryRoot,
  loadLocalGameAdapters,
  loadEventPackage,
  type LoadedEventPackage
} from "./index";

const repositoryRoot = getRepositoryRoot();
const sampleEventPath = join(repositoryRoot, "event-packages", "sample-event");
const genericDraftId = "draft_generic-001";
const genericMatchId = "match_grand-final";
const genericFirstActionId = "ban-1-blue:slot-0";
const genericSecondActionId = "ban-1-red:slot-0";
const genericHeroId = "generic-vanguard";

interface LocalServerContext {
  baseUrl: string;
}

async function fetchJson(
  pathname: string,
  options: { eventPackagePath?: string; method?: string; body?: unknown } = {}
): Promise<{ status: number; body: unknown }> {
  return withServer(options, (context) => requestJson(context.baseUrl, pathname, options));
}

async function withServer<TValue>(
  options: { eventPackagePath?: string },
  callback: (context: LocalServerContext) => Promise<TValue>
): Promise<TValue> {
  const { server, realtime } = await createServerApp({
    eventPackagePath: options.eventPackagePath ?? sampleEventPath,
    repositoryRoot,
    now: "2026-05-31T00:00:00.000Z"
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Expected local TCP server address.");
  }

  try {
    return await callback({
      baseUrl: `http://127.0.0.1:${(address as AddressInfo).port}`
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
}

function createLocalSocket(baseUrl: string): ClientSocket {
  return createSocketClient(baseUrl, {
    autoConnect: false,
    reconnection: false,
    timeout: 1_000,
    transports: ["websocket"]
  });
}

function waitForSocketEvent<TPayload>(
  socket: ClientSocket,
  eventName: string,
  predicate: (payload: TPayload) => boolean = () => true,
  timeoutMs = 1_500
): Promise<TPayload> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off(eventName, onEvent);
      reject(new Error(`Timed out waiting for Socket.IO event ${eventName}.`));
    }, timeoutMs);

    const onEvent = (payload: TPayload): void => {
      try {
        if (!predicate(payload)) {
          return;
        }

        clearTimeout(timeout);
        socket.off(eventName, onEvent);
        resolve(payload);
      } catch (error) {
        clearTimeout(timeout);
        socket.off(eventName, onEvent);
        reject(error);
      }
    };

    socket.on(eventName, onEvent);
  });
}

async function connectAndReceiveFullState(
  baseUrl: string,
  helloPayload: Record<string, unknown> = {
    role: "VIEWER",
    panel: "test-client",
    route: "/test"
  }
): Promise<{ socket: ClientSocket; stateFull: unknown }> {
  const socket = createLocalSocket(baseUrl);
  const stateFullPromise = waitForSocketEvent<unknown>(socket, "state:full");

  socket.connect();

  const stateFull = await stateFullPromise;
  const secondStateFullPromise = waitForSocketEvent<unknown>(socket, "state:full");
  socket.emit("client:hello", helloPayload);
  await secondStateFullPromise;

  return { socket, stateFull };
}

async function expectNoSocketEvent<TPayload>(
  socket: ClientSocket,
  eventName: string,
  trigger: () => Promise<void>,
  timeoutMs = 300
): Promise<void> {
  const eventPromise = waitForSocketEvent<TPayload>(socket, eventName, () => true, timeoutMs)
    .then(() => true)
    .catch(() => false);

  await trigger();

  expect(await eventPromise).toBe(false);
}

function expectSocketEnvelope(
  envelope: unknown,
  type: string
): asserts envelope is {
  type: string;
  timestamp: string;
  operatorId?: string;
  payload: Record<string, unknown>;
} {
  expect(envelope).toEqual(
    expect.objectContaining({
      type,
      timestamp: expect.any(String),
      payload: expect.any(Object)
    })
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

function createTempEventPackage(prefix = "mmbt-draft-api-"): string {
  const tempPackagePath = mkdtempSync(join(tmpdir(), prefix));

  cpSync(sampleEventPath, tempPackagePath, { recursive: true });
  rmSync(join(tempPackagePath, "logs", "production-log.jsonl"), { force: true });

  return tempPackagePath;
}

function readAuditLogEntries(packagePath: string): unknown[] {
  const logPath = join(packagePath, "logs", "production-log.jsonl");

  if (!existsSync(logPath)) {
    return [];
  }

  return readFileSync(logPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as unknown);
}

function expectApiEnvelope(body: unknown, ok: boolean): void {
  expect(body).toEqual(expect.objectContaining({ ok }));
}

function expectLoadedPackage(result: ReturnType<typeof loadEventPackage>): LoadedEventPackage {
  expect(result.ok, result.ok ? "" : JSON.stringify(result.error)).toBe(true);

  if (!result.ok) {
    throw new Error("Expected event package to load.");
  }

  return result.value;
}

describe("server runtime foundation", () => {
  it("loads the sample event package through the local loader", () => {
    const snapshot = expectLoadedPackage(
      loadEventPackage({
        packageRoot: sampleEventPath,
        repositoryRoot
      })
    );

    expect(snapshot.packageId).toBe("sample-event");
    expect(snapshot.event.id).toBe("event_sample-2026");
    expect(snapshot.matches.map((match) => match.id)).toContain("match_grand-final");
    expect(snapshot.rulesets.length).toBeGreaterThanOrEqual(4);
    expect(snapshot.themes.map((theme) => theme.id)).toContain("default-theme");
    expect(snapshot.assetStatus.missingAssets).toEqual([]);
  });

  it("returns structured loader errors for missing paths and invalid package data", () => {
    const missingResult = loadEventPackage({
      packageRoot: join(repositoryRoot, "event-packages", "missing-event"),
      repositoryRoot
    });

    expect(missingResult.ok).toBe(false);
    expect(missingResult.ok ? null : missingResult.error).toMatchObject({
      code: "EVENT_PACKAGE_NOT_FOUND",
      httpStatus: 404
    });

    const invalidRoot = mkdtempSync(join(tmpdir(), "mmbt-invalid-event-"));

    try {
      writeFileSync(join(invalidRoot, "event.json"), "{ invalid json", "utf8");

      const invalidResult = loadEventPackage({
        packageRoot: invalidRoot,
        repositoryRoot
      });

      expect(invalidResult.ok).toBe(false);
      expect(invalidResult.ok ? null : invalidResult.error).toMatchObject({
        code: "EVENT_PACKAGE_JSON_INVALID",
        httpStatus: 400
      });
    } finally {
      rmSync(invalidRoot, { recursive: true, force: true });
    }
  });

  it("returns ApiResponse envelopes from health, package, matches, and errors", async () => {
    const health = await fetchJson("/api/health");
    const rootHealth = await fetchJson("/health");
    const eventPackage = await fetchJson("/api/event-package");
    const state = await fetchJson("/api/state");
    const production = await fetchJson("/api/production/state");
    const productionAlias = await fetchJson("/api/production");
    const events = await fetchJson("/api/events");
    const matches = await fetchJson("/api/matches");
    const teams = await fetchJson("/api/teams");
    const players = await fetchJson("/api/players");
    const sponsors = await fetchJson("/api/sponsors");
    const missingRoute = await fetchJson("/api/does-not-exist");

    expect(health.status).toBe(200);
    expectApiEnvelope(health.body, true);
    expect(health.body).toMatchObject({
      ok: true,
      data: {
        status: "OK",
        loadedEventPackageId: "sample-event",
        currentProductionState: "PRE_SHOW",
        socketClients: [],
        adapterStatus: {
          "generic-moba": {
            loaded: true
          },
          lol: {
            loaded: true
          },
          aov: {
            loaded: true
          },
          hok: {
            loaded: true
          }
        },
        auditLogStatus: {
          writable: true,
          path: "event-packages/sample-event/logs/production-log.jsonl"
        }
      }
    });

    expect(rootHealth.status).toBe(200);
    expectApiEnvelope(rootHealth.body, true);

    expect(eventPackage.status).toBe(200);
    expectApiEnvelope(eventPackage.body, true);
    expect(eventPackage.body).toMatchObject({
      ok: true,
      data: {
        packageId: "sample-event",
        counts: {
          matches: 4
        }
      }
    });

    expect(state.status).toBe(200);
    expectApiEnvelope(state.body, true);
    expect(state.body).toMatchObject({
      ok: true,
      data: {
        eventPackageId: "sample-event",
        currentMatchId: genericMatchId,
        currentGameId: "game_generic-001",
        drafts: {
          [genericDraftId]: {
            id: genericDraftId,
            matchId: genericMatchId,
            status: "READY",
            actionCounts: {
              total: 16,
              pending: 16,
              hover: 0,
              locked: 0
            }
          }
        },
        production: {
          status: "PRE_SHOW",
          overlaySafety: {
            readOnly: true,
            mutationAllowed: false
          }
        }
      }
    });

    expect(production.status).toBe(200);
    expectApiEnvelope(production.body, true);
    expect(production.body).toMatchObject({
      ok: true,
      data: {
        revision: 1,
        production: {
          status: "PRE_SHOW",
          activeMatchId: genericMatchId,
          activeGameNumber: 1,
          activeDraftId: genericDraftId,
          graphicTakeState: {
            status: "IDLE",
            previewPayload: null,
            programPayload: null
          },
          emergency: {
            active: false,
            message: null
          },
          overlaySafety: {
            readOnly: true,
            mutationAllowed: false
          }
        }
      }
    });
    expect(productionAlias.body).toEqual(production.body);

    expect(events.status).toBe(200);
    expectApiEnvelope(events.body, true);
    expect(events.body).toMatchObject({
      ok: true,
      data: {
        eventPackageId: "sample-event",
        events: [
          {
            id: "event_sample-2026"
          }
        ]
      }
    });

    expect(matches.status).toBe(200);
    expectApiEnvelope(matches.body, true);
    expect(matches.body).toMatchObject({
      ok: true,
      data: {
        eventPackageId: "sample-event"
      }
    });

    expect(teams.status).toBe(200);
    expectApiEnvelope(teams.body, true);
    expect(players.status).toBe(200);
    expectApiEnvelope(players.body, true);
    expect(sponsors.status).toBe(200);
    expectApiEnvelope(sponsors.body, true);

    expect(missingRoute.status).toBe(404);
    expectApiEnvelope(missingRoute.body, false);
    expect(missingRoute.body).toMatchObject({
      ok: false,
      error: {
        code: "ROUTE_NOT_FOUND"
      }
    });
  });

  it("loads all static local sample adapters through the server adapter loader", async () => {
    const adapterState = await loadLocalGameAdapters({
      now: "2026-05-31T00:00:00.000Z"
    });

    expect(adapterState.knownAdapterIds).toEqual(["generic-moba", "lol", "aov", "hok"]);
    expect(adapterState.adapters.map((adapter) => adapter.gameCode)).toEqual([
      "aov",
      "generic-moba",
      "hok",
      "lol"
    ]);

    adapterState.adapters.forEach((adapter) => {
      expect(adapter.loaded).toBe(true);
      expect(adapter.heroCount).toBeGreaterThanOrEqual(10);
      expect(adapter.rulesetCount).toBeGreaterThanOrEqual(1);
      expect(adapter.capabilities).toMatchObject({
        supportsManualDraft: true,
        supportsClientReader: false,
        supportsIngameHud: false,
        supportsPostGameStats: false,
        supportsAssetSync: false
      });
    });
  });

  it("returns safe public adapter metadata and local adapter details", async () => {
    const listResponse = await fetchJson("/api/adapters");
    const genericResponse = await fetchJson("/api/adapters/generic-moba");
    const missingResponse = await fetchJson("/api/adapters/unknown-moba");

    expect(listResponse.status).toBe(200);
    expectApiEnvelope(listResponse.body, true);
    expect(listResponse.body).toMatchObject({
      ok: true,
      data: {
        adapters: expect.arrayContaining([
          expect.objectContaining({
            gameCode: "generic-moba",
            displayName: "Generic MOBA",
            loaded: true,
            source: "LOCAL_STATIC_SAMPLE",
            capabilities: expect.objectContaining({
              supportsManualDraft: true,
              supportsClientReader: false,
              supportsIngameHud: false,
              supportsPostGameStats: false,
              supportsAssetSync: false
            })
          })
        ])
      }
    });

    const listText = JSON.stringify(listResponse.body);
    expect(listText).not.toMatch(/loadHeroes|loadDefaultRulesets|getHeroById|validateDraftAction|getAssetUrl/);
    expect(listText).not.toMatch(/hiddenCompetitiveInformation|hiddenOpponentData|apiKey|secret/i);
    expect(listText).not.toMatch(/https?:\/\//i);

    expect(genericResponse.status).toBe(200);
    expectApiEnvelope(genericResponse.body, true);
    expect(genericResponse.body).toMatchObject({
      ok: true,
      data: {
        gameCode: "generic-moba",
        loaded: true,
        heroCount: 10,
        rulesetCount: 1,
        heroes: expect.arrayContaining([
          expect.objectContaining({
            id: "generic-vanguard",
            gameCode: "generic-moba"
          })
        ]),
        rulesets: expect.arrayContaining([
          expect.objectContaining({
            id: "generic-moba-standard-5v5",
            gameCode: "generic-moba"
          })
        ])
      }
    });

    expect(missingResponse.status).toBe(404);
    expectApiEnvelope(missingResponse.body, false);
    expect(missingResponse.body).toMatchObject({
      ok: false,
      error: {
        code: "ADAPTER_NOT_LOADED"
      }
    });
  });

  it("returns a public-safe read-only state snapshot with adapter status", async () => {
    const state = await fetchJson("/api/state");
    const stateText = JSON.stringify(state.body);

    expect(state.status).toBe(200);
    expectApiEnvelope(state.body, true);
    expect(state.body).toMatchObject({
      ok: true,
      data: {
        eventPackageId: "sample-event",
        matches: expect.any(Array),
        teams: expect.any(Array),
        players: expect.any(Array),
        sponsors: expect.any(Array),
        adapters: expect.arrayContaining([
          expect.objectContaining({
            gameCode: "generic-moba",
            loaded: true,
            heroCount: 10
          })
        ]),
        availableAdapterIds: expect.arrayContaining(["generic-moba", "lol", "aov", "hok"]),
        validationWarnings: {
          adapters: []
        },
        health: {
          status: "OK"
        }
      }
    });

    expect(stateText).not.toMatch(/loadHeroes|loadDefaultRulesets|getHeroById|validateDraftAction|getAssetUrl/);
    expect(stateText).not.toMatch(/hiddenCompetitiveInformation|hiddenOpponentData|apiKey|secret/i);
    expect(stateText).not.toMatch(/https?:\/\//i);
    expect(stateText).not.toMatch(/file:\/\//i);
  });

  it("returns known draft summaries and safe draft snapshots", async () => {
    const drafts = await fetchJson("/api/drafts");
    const filteredDrafts = await fetchJson(`/api/drafts?matchId=${genericMatchId}`);
    const draftById = await fetchJson(`/api/drafts/${genericDraftId}`);
    const draftByMatch = await fetchJson(`/api/drafts/${genericMatchId}`);
    const state = await fetchJson("/api/state");

    expect(drafts.status).toBe(200);
    expectApiEnvelope(drafts.body, true);
    expect(drafts.body).toMatchObject({
      ok: true,
      data: {
        revision: 1,
        drafts: expect.arrayContaining([
          expect.objectContaining({
            id: genericDraftId,
            matchId: genericMatchId,
            status: "READY",
            currentPhase: expect.objectContaining({
              id: "ban-1-blue"
            }),
            currentActionIds: [genericFirstActionId]
          })
        ])
      }
    });

    expect(filteredDrafts.body).toMatchObject({
      ok: true,
      data: {
        drafts: expect.arrayContaining([
          expect.objectContaining({
            id: genericDraftId,
            matchId: genericMatchId
          })
        ])
      }
    });

    expect(draftById.status).toBe(200);
    expectApiEnvelope(draftById.body, true);
    expect(draftById.body).toMatchObject({
      ok: true,
      data: {
        revision: 1,
        draft: {
          summary: {
            id: genericDraftId,
            matchId: genericMatchId
          },
          draft: {
            id: genericDraftId,
            status: "READY",
            actions: expect.arrayContaining([
              expect.objectContaining({
                id: genericFirstActionId,
                status: "PENDING"
              })
            ])
          }
        }
      }
    });

    expect(draftByMatch.body).toMatchObject({
      ok: true,
      data: {
        draft: {
          summary: {
            id: genericDraftId,
            matchId: genericMatchId
          }
        }
      }
    });

    expect(state.body).toMatchObject({
      ok: true,
      data: {
        drafts: {
          [genericDraftId]: expect.objectContaining({
            id: genericDraftId,
            status: "READY"
          })
        }
      }
    });

    const responseText = JSON.stringify([drafts.body, draftById.body, state.body]);
    expect(responseText).not.toMatch(/loadHeroes|loadDefaultRulesets|getHeroById|validateDraftAction|getAssetUrl/);
    expect(responseText).not.toMatch(/hiddenCompetitiveInformation|hiddenOpponentData|apiKey|secret/i);
    expect(responseText).not.toMatch(/https?:\/\//i);
  });

  it("applies manual draft hover and lock mutations through core helpers and appends audit JSONL", async () => {
    const tempPackagePath = createTempEventPackage();

    try {
      await withServer({ eventPackagePath: tempPackagePath }, async ({ baseUrl }) => {
        const stateBefore = await requestJson(baseUrl, "/api/state");
        const readBefore = await requestJson(baseUrl, `/api/drafts/${genericDraftId}`);
        const start = await requestJson(baseUrl, `/api/drafts/${genericDraftId}/start`, {
          method: "POST",
          body: {
            operatorId: "draft-op",
            now: "2026-06-01T00:00:00.000Z",
            ignoredSecret: "do-not-log"
          }
        });
        const readAfterStart = await requestJson(baseUrl, `/api/drafts/${genericDraftId}`);
        const hover = await requestJson(baseUrl, `/api/drafts/${genericDraftId}/actions/${genericFirstActionId}/hover`, {
          method: "POST",
          body: {
            operatorId: "draft-op",
            heroId: genericHeroId,
            now: "2026-06-01T00:00:05.000Z"
          }
        });
        const lock = await requestJson(baseUrl, `/api/drafts/${genericDraftId}/actions/${genericFirstActionId}/lock`, {
          method: "POST",
          body: {
            operatorId: "draft-op",
            heroId: genericHeroId,
            now: "2026-06-01T00:00:10.000Z"
          }
        });
        const stateAfter = await requestJson(baseUrl, "/api/state");

        expect(stateBefore.body).toMatchObject({
          ok: true,
          data: {
            revision: 1
          }
        });
        expect(readBefore.body).toMatchObject({
          ok: true,
          data: {
            revision: 1
          }
        });
        expect(start.status).toBe(200);
        expect(start.body).toMatchObject({
          ok: true,
          data: {
            revision: 2,
            draft: {
              draft: {
                status: "LIVE",
                lockedHeroIds: []
              }
            }
          }
        });
        expect(readAfterStart.body).toMatchObject({
          ok: true,
          data: {
            revision: 2
          }
        });
        expect(hover.status).toBe(200);
        expect(hover.body).toMatchObject({
          ok: true,
          data: {
            revision: 3,
            draft: {
              draft: {
                actions: expect.arrayContaining([
                  expect.objectContaining({
                    id: genericFirstActionId,
                    status: "HOVER",
                    heroId: genericHeroId
                  })
                ]),
                lockedHeroIds: []
              }
            }
          }
        });
        expect(lock.status).toBe(200);
        expect(lock.body).toMatchObject({
          ok: true,
          data: {
            revision: 4,
            draft: {
              summary: {
                currentPhase: expect.objectContaining({
                  id: "ban-1-red"
                })
              },
              draft: {
                actions: expect.arrayContaining([
                  expect.objectContaining({
                    id: genericFirstActionId,
                    status: "LOCKED",
                    heroId: genericHeroId
                  })
                ]),
                lockedHeroIds: [genericHeroId],
                bannedHeroIds: [genericHeroId],
                pickedHeroIds: []
              }
            }
          }
        });
        expect(stateAfter.body).toMatchObject({
          ok: true,
          data: {
            revision: 4,
            drafts: {
              [genericDraftId]: expect.objectContaining({
                id: genericDraftId,
                status: "LIVE",
                actionCounts: expect.objectContaining({
                  locked: 1
                })
              })
            }
          }
        });

        const entries = readAuditLogEntries(tempPackagePath);

        expect(entries).toHaveLength(3);
        expect(entries).toEqual([
          expect.objectContaining({
            event: "DRAFT_STARTED",
            operatorId: "draft-op",
            matchId: genericMatchId,
            draftId: genericDraftId,
            previousRevision: 1,
            nextRevision: 2
          }),
          expect.objectContaining({
            event: "HERO_HOVERED",
            actionId: genericFirstActionId,
            previousRevision: 2,
            nextRevision: 3
          }),
          expect.objectContaining({
            event: "HERO_LOCKED",
            actionId: genericFirstActionId,
            previousRevision: 3,
            nextRevision: 4
          })
        ]);

        const logText = JSON.stringify(entries);
        expect(logText).not.toMatch(/do-not-log|ignoredSecret|apiKey|secret|hiddenCompetitiveInformation/i);
        expect(logText).not.toMatch(/loadHeroes|loadDefaultRulesets|getHeroById|validateDraftAction|getAssetUrl/);
      });
    } finally {
      rmSync(tempPackagePath, { recursive: true, force: true });
    }
  });

  it("creates an explicitly requested additional in-memory draft and logs the manual creation", async () => {
    const tempPackagePath = createTempEventPackage();

    try {
      await withServer({ eventPackagePath: tempPackagePath }, async ({ baseUrl }) => {
        const create = await requestJson(baseUrl, "/api/drafts", {
          method: "POST",
          body: {
            operatorId: "draft-op",
            draftId: "draft_manual-extra",
            matchId: genericMatchId,
            gameId: "game_generic-002",
            gameCode: "generic-moba",
            rulesetId: "generic-moba-standard-5v5",
            now: "2026-06-01T00:30:00.000Z"
          }
        });
        const duplicateCreate = await requestJson(baseUrl, "/api/drafts", {
          method: "POST",
          body: {
            operatorId: "draft-op",
            draftId: "draft_manual-extra",
            matchId: genericMatchId,
            gameId: "game_generic-002",
            gameCode: "generic-moba",
            rulesetId: "generic-moba-standard-5v5",
            now: "2026-06-01T00:30:10.000Z"
          }
        });

        expect(create.status).toBe(200);
        expect(create.body).toMatchObject({
          ok: true,
          data: {
            revision: 2,
            draft: {
              summary: {
                id: "draft_manual-extra",
                gameId: "game_generic-002",
                status: "READY"
              }
            }
          }
        });
        expect(duplicateCreate.status).toBe(409);
        expect(duplicateCreate.body).toMatchObject({
          ok: false,
          error: {
            code: "DRAFT_ALREADY_EXISTS"
          }
        });
        expect(readAuditLogEntries(tempPackagePath)).toEqual([
          expect.objectContaining({
            event: "DRAFT_CREATED",
            draftId: "draft_manual-extra",
            previousRevision: 1,
            nextRevision: 2
          })
        ]);
      });
    } finally {
      rmSync(tempPackagePath, { recursive: true, force: true });
    }
  });

  it("rejects duplicate heroes, unknown drafts, and invalid payloads without mutating revision or audit log", async () => {
    const tempPackagePath = createTempEventPackage();

    try {
      await withServer({ eventPackagePath: tempPackagePath }, async ({ baseUrl }) => {
        const start = await requestJson(baseUrl, `/api/drafts/${genericDraftId}/start`, {
          method: "POST",
          body: {
            operatorId: "draft-op",
            now: "2026-06-01T01:00:00.000Z"
          }
        });
        const firstLock = await requestJson(baseUrl, `/api/drafts/${genericDraftId}/actions/${genericFirstActionId}/lock`, {
          method: "POST",
          body: {
            operatorId: "draft-op",
            heroId: genericHeroId,
            now: "2026-06-01T01:00:05.000Z"
          }
        });
        const duplicate = await requestJson(baseUrl, `/api/drafts/${genericDraftId}/actions/${genericSecondActionId}/lock`, {
          method: "POST",
          body: {
            operatorId: "draft-op",
            heroId: genericHeroId,
            now: "2026-06-01T01:00:10.000Z"
          }
        });
        const invalidDraft = await requestJson(baseUrl, "/api/drafts/missing-draft/start", {
          method: "POST",
          body: {
            operatorId: "draft-op",
            now: "2026-06-01T01:00:15.000Z"
          }
        });
        const invalidPayload = await requestJson(baseUrl, `/api/drafts/${genericDraftId}/actions/${genericSecondActionId}/hover`, {
          method: "POST",
          body: {
            operatorId: "draft-op",
            now: "2026-06-01T01:00:20.000Z"
          }
        });
        const state = await requestJson(baseUrl, "/api/state");

        expect(start.status).toBe(200);
        expect(firstLock.status).toBe(200);
        expect(duplicate.status).toBe(409);
        expect(duplicate.body).toMatchObject({
          ok: false,
          error: {
            code: "DRAFT_DUPLICATE_HERO"
          }
        });
        expect(invalidDraft.status).toBe(404);
        expect(invalidDraft.body).toMatchObject({
          ok: false,
          error: {
            code: "DRAFT_NOT_FOUND"
          }
        });
        expect(invalidPayload.status).toBe(400);
        expect(invalidPayload.body).toMatchObject({
          ok: false,
          error: {
            code: "DRAFT_INVALID_PAYLOAD"
          }
        });
        expect(state.body).toMatchObject({
          ok: true,
          data: {
            revision: 3,
            drafts: {
              [genericDraftId]: expect.objectContaining({
                lockedHeroIds: [genericHeroId]
              })
            }
          }
        });
        expect(readAuditLogEntries(tempPackagePath)).toHaveLength(2);
      });
    } finally {
      rmSync(tempPackagePath, { recursive: true, force: true });
    }
  });

  it("supports manual pause, resume, undo, and redo with confirmation and audit entries", async () => {
    const tempPackagePath = createTempEventPackage();

    try {
      await withServer({ eventPackagePath: tempPackagePath }, async ({ baseUrl }) => {
        await requestJson(baseUrl, `/api/drafts/${genericDraftId}/start`, {
          method: "POST",
          body: { operatorId: "draft-op", now: "2026-06-01T02:00:00.000Z" }
        });
        await requestJson(baseUrl, `/api/drafts/${genericDraftId}/actions/${genericFirstActionId}/lock`, {
          method: "POST",
          body: { operatorId: "draft-op", heroId: genericHeroId, now: "2026-06-01T02:00:03.000Z" }
        });

        const pause = await requestJson(baseUrl, `/api/drafts/${genericDraftId}/pause`, {
          method: "POST",
          body: { operatorId: "draft-op", now: "2026-06-01T02:00:08.000Z" }
        });
        const resume = await requestJson(baseUrl, `/api/drafts/${genericDraftId}/resume`, {
          method: "POST",
          body: { operatorId: "draft-op", now: "2026-06-01T02:00:12.000Z" }
        });
        const undoWithoutConfirm = await requestJson(baseUrl, `/api/drafts/${genericDraftId}/undo`, {
          method: "POST",
          body: { operatorId: "draft-op", reason: "Operator correction." }
        });
        const undo = await requestJson(baseUrl, `/api/drafts/${genericDraftId}/undo`, {
          method: "POST",
          body: {
            operatorId: "draft-op",
            confirm: true,
            reason: "Operator correction.",
            now: "2026-06-01T02:00:16.000Z"
          }
        });
        const redo = await requestJson(baseUrl, `/api/drafts/${genericDraftId}/redo`, {
          method: "POST",
          body: {
            operatorId: "draft-op",
            confirm: true,
            reason: "Referee confirmed redo.",
            now: "2026-06-01T02:00:20.000Z"
          }
        });

        expect(pause.status).toBe(200);
        expect(pause.body).toMatchObject({
          ok: true,
          data: {
            revision: 4,
            draft: {
              draft: {
                status: "PAUSED"
              }
            }
          }
        });
        expect(resume.status).toBe(200);
        expect(resume.body).toMatchObject({
          ok: true,
          data: {
            revision: 5,
            draft: {
              draft: {
                status: "LIVE"
              }
            }
          }
        });
        expect(undoWithoutConfirm.status).toBe(409);
        expect(undoWithoutConfirm.body).toMatchObject({
          ok: false,
          error: {
            code: "DRAFT_CONFIRMATION_REQUIRED"
          }
        });
        expect(undo.status).toBe(200);
        expect(undo.body).toMatchObject({
          ok: true,
          data: {
            revision: 6,
            draft: {
              draft: {
                currentPhaseIndex: 0,
                lockedHeroIds: [],
                actions: expect.arrayContaining([
                  expect.objectContaining({
                    id: genericFirstActionId,
                    status: "PENDING",
                    heroId: null
                  })
                ])
              }
            }
          }
        });
        expect(redo.status).toBe(200);
        expect(redo.body).toMatchObject({
          ok: true,
          data: {
            revision: 7,
            draft: {
              draft: {
                lockedHeroIds: [genericHeroId],
                actions: expect.arrayContaining([
                  expect.objectContaining({
                    id: genericFirstActionId,
                    status: "LOCKED",
                    heroId: genericHeroId
                  })
                ])
              }
            }
          }
        });

        const entries = readAuditLogEntries(tempPackagePath);

        expect(entries.map((entry) => (entry as { event: string }).event)).toEqual([
          "DRAFT_STARTED",
          "HERO_LOCKED",
          "DRAFT_PAUSED",
          "DRAFT_RESUMED",
          "DRAFT_ACTION_UNDONE",
          "DRAFT_ACTION_REDONE"
        ]);
      });
    } finally {
      rmSync(tempPackagePath, { recursive: true, force: true });
    }
  });

  it("does not auto-pick, auto-ban, auto-lock, or auto-advance when a phase timer reaches zero", async () => {
    const tempPackagePath = createTempEventPackage();

    try {
      await withServer({ eventPackagePath: tempPackagePath }, async ({ baseUrl }) => {
        await requestJson(baseUrl, `/api/drafts/${genericDraftId}/start`, {
          method: "POST",
          body: { operatorId: "draft-op", now: "2026-06-01T03:00:00.000Z" }
        });
        const pauseAfterTimeout = await requestJson(baseUrl, `/api/drafts/${genericDraftId}/pause`, {
          method: "POST",
          body: { operatorId: "draft-op", now: "2026-06-01T03:02:00.000Z" }
        });

        expect(pauseAfterTimeout.status).toBe(200);
        expect(pauseAfterTimeout.body).toMatchObject({
          ok: true,
          data: {
            draft: {
              draft: {
                status: "PAUSED",
                currentPhaseIndex: 0,
                timer: expect.objectContaining({
                  remainingSeconds: 0,
                  isRunning: false
                }),
                lockedHeroIds: [],
                bannedHeroIds: [],
                pickedHeroIds: [],
                actions: expect.arrayContaining([
                  expect.objectContaining({
                    id: genericFirstActionId,
                    status: "PENDING",
                    heroId: null
                  })
                ])
              }
            }
          }
        });
      });
    } finally {
      rmSync(tempPackagePath, { recursive: true, force: true });
    }
  });

  it("applies manual production state, graphics, and emergency mutations with audit entries", async () => {
    const tempPackagePath = createTempEventPackage("mmbt-production-api-");

    try {
      await withServer({ eventPackagePath: tempPackagePath }, async ({ baseUrl }) => {
        const readBefore = await requestJson(baseUrl, "/api/production/state");
        const stateReadBefore = await requestJson(baseUrl, "/api/state");
        const productionState = await requestJson(baseUrl, "/api/production/state", {
          method: "POST",
          body: {
            operatorId: "producer-1",
            status: "DRAFT_READY",
            activeMatchId: genericMatchId,
            activeGameNumber: 1,
            activeDraftId: genericDraftId,
            rawRequestOnly: "do-not-log",
            now: "2026-06-01T04:00:00.000Z"
          }
        });
        const preview = await requestJson(baseUrl, "/api/production/preview", {
          method: "POST",
          body: {
            operatorId: "producer-1",
            graphicType: "DRAFT_OVERLAY",
            payload: {
              matchId: genericMatchId,
              draftId: genericDraftId,
              displayMode: "preview"
            },
            rawRequestOnly: "do-not-log",
            now: "2026-06-01T04:00:05.000Z"
          }
        });
        const takeWithoutConfirm = await requestJson(baseUrl, "/api/production/take", {
          method: "POST",
          body: {
            operatorId: "producer-1",
            now: "2026-06-01T04:00:08.000Z"
          }
        });
        const take = await requestJson(baseUrl, "/api/production/take", {
          method: "POST",
          body: {
            operatorId: "producer-1",
            confirm: true,
            now: "2026-06-01T04:00:10.000Z"
          }
        });
        const clearWithoutConfirm = await requestJson(baseUrl, "/api/production/clear", {
          method: "POST",
          body: {
            operatorId: "producer-1",
            now: "2026-06-01T04:00:12.000Z"
          }
        });
        const clear = await requestJson(baseUrl, "/api/production/clear-program", {
          method: "POST",
          body: {
            operatorId: "producer-1",
            confirm: true,
            now: "2026-06-01T04:00:15.000Z"
          }
        });
        const emergencyWithoutConfirm = await requestJson(baseUrl, "/api/production/emergency", {
          method: "POST",
          body: {
            operatorId: "producer-1",
            message: "Stand by",
            now: "2026-06-01T04:00:18.000Z"
          }
        });
        const emergency = await requestJson(baseUrl, "/api/production/emergency", {
          method: "POST",
          body: {
            operatorId: "producer-1",
            confirm: true,
            message: "Stand by",
            reason: "do-not-log",
            now: "2026-06-01T04:00:20.000Z"
          }
        });
        const emergencyClear = await requestJson(baseUrl, "/api/production/emergency/clear", {
          method: "POST",
          body: {
            operatorId: "producer-1",
            confirm: true,
            reason: "do-not-log",
            now: "2026-06-01T04:00:25.000Z"
          }
        });
        const readAfter = await requestJson(baseUrl, "/api/production/state");
        const stateReadAfter = await requestJson(baseUrl, "/api/state");

        expect(readBefore.body).toMatchObject({
          ok: true,
          data: {
            revision: 1,
            production: {
              status: "PRE_SHOW"
            }
          }
        });
        expect(stateReadBefore.body).toMatchObject({
          ok: true,
          data: {
            revision: 1
          }
        });
        expect(productionState.status).toBe(200);
        expect(productionState.body).toMatchObject({
          ok: true,
          data: {
            revision: 2,
            production: {
              status: "DRAFT_READY",
              activeMatchId: genericMatchId,
              activeDraftId: genericDraftId
            }
          }
        });
        expect(preview.status).toBe(200);
        expect(preview.body).toMatchObject({
          ok: true,
          data: {
            revision: 3,
            production: {
              graphicTakeState: {
                status: "PREVIEW",
                graphicType: "DRAFT_OVERLAY",
                previewPayload: {
                  matchId: genericMatchId,
                  draftId: genericDraftId
                },
                programPayload: null
              }
            }
          }
        });
        expect(takeWithoutConfirm.status).toBe(409);
        expect(takeWithoutConfirm.body).toMatchObject({
          ok: false,
          error: {
            code: "GRAPHICS_CONFIRMATION_REQUIRED"
          }
        });
        expect(take.status).toBe(200);
        expect(take.body).toMatchObject({
          ok: true,
          data: {
            revision: 4,
            production: {
              graphicTakeState: {
                status: "ON_PROGRAM",
                previewPayload: null,
                programPayload: {
                  matchId: genericMatchId,
                  draftId: genericDraftId
                }
              }
            }
          }
        });
        expect(clearWithoutConfirm.status).toBe(409);
        expect(clearWithoutConfirm.body).toMatchObject({
          ok: false,
          error: {
            code: "GRAPHICS_CONFIRMATION_REQUIRED"
          }
        });
        expect(clear.status).toBe(200);
        expect(clear.body).toMatchObject({
          ok: true,
          data: {
            revision: 5,
            production: {
              graphicTakeState: {
                status: "IDLE",
                programPayload: null
              }
            }
          }
        });
        expect(emergencyWithoutConfirm.status).toBe(409);
        expect(emergencyWithoutConfirm.body).toMatchObject({
          ok: false,
          error: {
            code: "EMERGENCY_CONFIRMATION_REQUIRED"
          }
        });
        expect(emergency.status).toBe(200);
        expect(emergency.body).toMatchObject({
          ok: true,
          data: {
            revision: 6,
            production: {
              emergency: {
                active: true,
                message: "Stand by",
                triggeredAt: "2026-06-01T04:00:20.000Z"
              }
            }
          }
        });
        expect(emergencyClear.status).toBe(200);
        expect(emergencyClear.body).toMatchObject({
          ok: true,
          data: {
            revision: 7,
            production: {
              emergency: {
                active: false,
                message: "Stand by",
                clearedAt: "2026-06-01T04:00:25.000Z"
              }
            }
          }
        });
        expect(readAfter.body).toMatchObject({
          ok: true,
          data: {
            revision: 7
          }
        });
        expect(stateReadAfter.body).toMatchObject({
          ok: true,
          data: {
            revision: 7,
            production: {
              status: "DRAFT_READY",
              emergency: {
                active: false,
                message: "Stand by"
              }
            }
          }
        });

        const stateReadAfterText = JSON.stringify(stateReadAfter.body);
        expect(stateReadAfterText).not.toMatch(/triggeredByOperatorId|clearedByOperatorId|reason|rawRequestOnly/);

        const entries = readAuditLogEntries(tempPackagePath);

        expect(entries.map((entry) => (entry as { event: string }).event)).toEqual([
          "PRODUCTION_STATE_CHANGED",
          "GRAPHICS_PREVIEWED",
          "GRAPHICS_TAKEN",
          "GRAPHICS_CLEARED",
          "EMERGENCY_TRIGGERED",
          "EMERGENCY_CLEARED"
        ]);
        expect(entries).toEqual([
          expect.objectContaining({
            event: "PRODUCTION_STATE_CHANGED",
            operatorId: "producer-1",
            previousRevision: 1,
            nextRevision: 2,
            productionState: "DRAFT_READY"
          }),
          expect.objectContaining({
            event: "GRAPHICS_PREVIEWED",
            previousRevision: 2,
            nextRevision: 3,
            graphicType: "DRAFT_OVERLAY"
          }),
          expect.objectContaining({
            event: "GRAPHICS_TAKEN",
            previousRevision: 3,
            nextRevision: 4
          }),
          expect.objectContaining({
            event: "GRAPHICS_CLEARED",
            previousRevision: 4,
            nextRevision: 5
          }),
          expect.objectContaining({
            event: "EMERGENCY_TRIGGERED",
            previousRevision: 5,
            nextRevision: 6
          }),
          expect.objectContaining({
            event: "EMERGENCY_CLEARED",
            previousRevision: 6,
            nextRevision: 7
          })
        ]);

        const logText = JSON.stringify(entries);
        expect(logText).not.toMatch(/do-not-log|rawRequestOnly|apiKey|secret|hiddenCompetitiveInformation/i);
        expect(logText).not.toMatch(/loadHeroes|loadDefaultRulesets|getHeroById|validateDraftAction|getAssetUrl/);
      });
    } finally {
      rmSync(tempPackagePath, { recursive: true, force: true });
    }
  });

  it("rejects invalid production payloads and transitions without mutating revision or audit log", async () => {
    const tempPackagePath = createTempEventPackage("mmbt-production-invalid-");

    try {
      await withServer({ eventPackagePath: tempPackagePath }, async ({ baseUrl }) => {
        const invalidBody = await requestJson(baseUrl, "/api/production/state", {
          method: "POST",
          body: []
        });
        const invalidTransition = await requestJson(baseUrl, "/api/production/state", {
          method: "POST",
          body: {
            operatorId: "producer-1",
            status: "GAME_LIVE",
            now: "2026-06-01T05:00:00.000Z"
          }
        });
        const unsafePreview = await requestJson(baseUrl, "/api/production/preview", {
          method: "POST",
          body: {
            operatorId: "producer-1",
            graphicType: "DRAFT_OVERLAY",
            payload: {
              apiKey: "do-not-log"
            },
            now: "2026-06-01T05:00:05.000Z"
          }
        });
        const unknownMatch = await requestJson(baseUrl, "/api/production/state", {
          method: "POST",
          body: {
            operatorId: "producer-1",
            status: "DRAFT_READY",
            activeMatchId: "match_missing",
            now: "2026-06-01T05:00:10.000Z"
          }
        });
        const stateAfterRejected = await requestJson(baseUrl, "/api/state");

        const draftReady = await requestJson(baseUrl, "/api/production/state", {
          method: "POST",
          body: {
            operatorId: "producer-1",
            status: "DRAFT_READY",
            now: "2026-06-01T05:00:15.000Z"
          }
        });
        const draftLive = await requestJson(baseUrl, "/api/production/state", {
          method: "POST",
          body: {
            operatorId: "producer-1",
            status: "DRAFT_LIVE",
            now: "2026-06-01T05:00:20.000Z"
          }
        });
        const liveWithoutConfirm = await requestJson(baseUrl, "/api/production/state", {
          method: "POST",
          body: {
            operatorId: "producer-1",
            status: "DRAFT_COMPLETE",
            now: "2026-06-01T05:00:25.000Z"
          }
        });
        const finalState = await requestJson(baseUrl, "/api/state");

        expect(invalidBody.status).toBe(400);
        expect(invalidBody.body).toMatchObject({
          ok: false,
          error: {
            code: "PRODUCTION_INVALID_PAYLOAD"
          }
        });
        expect(invalidTransition.status).toBe(409);
        expect(invalidTransition.body).toMatchObject({
          ok: false,
          error: {
            code: "PRODUCTION_INVALID_STATE"
          }
        });
        expect(unsafePreview.status).toBe(400);
        expect(unsafePreview.body).toMatchObject({
          ok: false,
          error: {
            code: "PRODUCTION_INVALID_PAYLOAD"
          }
        });
        expect(unknownMatch.status).toBe(404);
        expect(unknownMatch.body).toMatchObject({
          ok: false,
          error: {
            code: "MATCH_NOT_FOUND"
          }
        });
        expect(stateAfterRejected.body).toMatchObject({
          ok: true,
          data: {
            revision: 1,
            production: {
              status: "PRE_SHOW"
            }
          }
        });
        expect(draftReady.status).toBe(200);
        expect(draftLive.status).toBe(200);
        expect(liveWithoutConfirm.status).toBe(409);
        expect(liveWithoutConfirm.body).toMatchObject({
          ok: false,
          error: {
            code: "PRODUCTION_CONFIRMATION_REQUIRED"
          }
        });
        expect(finalState.body).toMatchObject({
          ok: true,
          data: {
            revision: 3,
            production: {
              status: "DRAFT_LIVE"
            }
          }
        });

        const entries = readAuditLogEntries(tempPackagePath);

        expect(entries.map((entry) => (entry as { event: string }).event)).toEqual([
          "PRODUCTION_STATE_CHANGED",
          "PRODUCTION_STATE_CHANGED"
        ]);
      });
    } finally {
      rmSync(tempPackagePath, { recursive: true, force: true });
    }
  });

  it("starts Socket.IO with the existing HTTP server and sends safe full-state snapshots", async () => {
    await withServer({}, async ({ baseUrl }) => {
      const socket = createLocalSocket(baseUrl);
      const initialStatePromise = waitForSocketEvent<unknown>(socket, "state:full");

      socket.connect();

      try {
        const initialState = await initialStatePromise;

        expectSocketEnvelope(initialState, "state:full");
        expect(initialState.payload).toMatchObject({
          revision: 1,
          eventPackageId: "sample-event",
          currentMatchId: genericMatchId
        });

        const helloStatePromise = waitForSocketEvent<unknown>(socket, "state:full");
        const healthPromise = waitForSocketEvent<unknown>(
          socket,
          "health:update",
          (payload) => JSON.stringify(payload).includes("draft-operator")
        );

        socket.emit("client:hello", {
          role: "DRAFT_OPERATOR",
          panel: "draft-operator",
          route: "/draft/match_grand-final",
          matchId: genericMatchId
        });

        const helloState = await helloStatePromise;
        const healthUpdate = await healthPromise;

        expectSocketEnvelope(helloState, "state:full");
        expectSocketEnvelope(healthUpdate, "health:update");

        const health = await requestJson(baseUrl, "/api/health");

        expect(health.body).toMatchObject({
          ok: true,
          data: {
            socketClients: [
              expect.objectContaining({
                id: socket.id,
                role: "DRAFT_OPERATOR",
                panel: "draft-operator"
              })
            ]
          }
        });

        const requestedStatePromise = waitForSocketEvent<unknown>(socket, "state:full");
        socket.emit("state:request-full");
        const requestedState = await requestedStatePromise;

        expectSocketEnvelope(requestedState, "state:full");
        expect(requestedState.payload.revision).toBe(1);

        const restHealth = await requestJson(baseUrl, "/api/health");

        expect(restHealth.status).toBe(200);
        expect(restHealth.body).toMatchObject({
          ok: true,
          data: {
            loadedEventPackageId: "sample-event"
          }
        });
      } finally {
        socket.disconnect();
      }
    });
  });

  it("broadcasts accepted draft REST mutations and skips rejected or read-only requests", async () => {
    const tempPackagePath = createTempEventPackage("mmbt-socket-draft-");

    try {
      await withServer({ eventPackagePath: tempPackagePath }, async ({ baseUrl }) => {
        const { socket } = await connectAndReceiveFullState(baseUrl, {
          role: "DRAFT_OPERATOR",
          panel: "draft-operator",
          route: "/draft/match_grand-final",
          matchId: genericMatchId
        });

        try {
          await requestJson(baseUrl, `/api/drafts/${genericDraftId}/start`, {
            method: "POST",
            body: {
              operatorId: "draft-op",
              now: "2026-06-01T06:00:00.000Z"
            }
          });

          const draftUpdatedPromise = waitForSocketEvent<unknown>(
            socket,
            "draft:updated",
            (payload) => JSON.stringify(payload).includes("HERO_LOCKED")
          );
          const statePatchPromise = waitForSocketEvent<unknown>(
            socket,
            "state:patch",
            (payload) => JSON.stringify(payload).includes("HERO_LOCKED")
          );
          const draftTimerPromise = waitForSocketEvent<unknown>(
            socket,
            "draft:timer",
            (payload) => JSON.stringify(payload).includes("HERO_LOCKED")
          );
          const logEntryPromise = waitForSocketEvent<unknown>(
            socket,
            "log:entry",
            (payload) => JSON.stringify(payload).includes("HERO_LOCKED")
          );

          const lock = await requestJson(baseUrl, `/api/drafts/${genericDraftId}/actions/${genericFirstActionId}/lock`, {
            method: "POST",
            body: {
              operatorId: "draft-op",
              heroId: genericHeroId,
              now: "2026-06-01T06:00:10.000Z"
            }
          });

          expect(lock.status).toBe(200);

          const draftUpdated = await draftUpdatedPromise;
          const statePatch = await statePatchPromise;
          const draftTimer = await draftTimerPromise;
          const logEntry = await logEntryPromise;

          expectSocketEnvelope(draftUpdated, "draft:updated");
          expect(draftUpdated.payload).toMatchObject({
            revision: 3,
            reason: "HERO_LOCKED",
            draftId: genericDraftId
          });
          expect(JSON.stringify(draftUpdated)).not.toMatch(/ignoredSecret|hiddenCompetitiveInformation/i);
          expect(JSON.stringify(draftUpdated.payload.draft)).not.toMatch(/"operatorId"/);

          expectSocketEnvelope(statePatch, "state:patch");
          expect(statePatch.payload).toMatchObject({
            revision: 3,
            previousRevision: 2,
            reason: "HERO_LOCKED",
            entityId: genericDraftId
          });

          expectSocketEnvelope(draftTimer, "draft:timer");
          expectSocketEnvelope(logEntry, "log:entry");
          expect(logEntry.payload).toMatchObject({
            entry: expect.objectContaining({
              event: "HERO_LOCKED",
              nextRevision: 3
            })
          });

          await expectNoSocketEvent(socket, "state:patch", async () => {
            const duplicate = await requestJson(baseUrl, `/api/drafts/${genericDraftId}/actions/${genericSecondActionId}/lock`, {
              method: "POST",
              body: {
                operatorId: "draft-op",
                heroId: genericHeroId,
                now: "2026-06-01T06:00:15.000Z"
              }
            });

            expect(duplicate.status).toBe(409);
            expect(duplicate.body).toMatchObject({
              ok: false,
              error: {
                code: "DRAFT_DUPLICATE_HERO"
              }
            });
          });

          await expectNoSocketEvent(socket, "state:patch", async () => {
            const state = await requestJson(baseUrl, "/api/state");

            expect(state.status).toBe(200);
          });
        } finally {
          socket.disconnect();
        }
      });
    } finally {
      rmSync(tempPackagePath, { recursive: true, force: true });
    }
  });

  it("broadcasts production, graphics, and emergency REST mutations with public-safe payloads", async () => {
    const tempPackagePath = createTempEventPackage("mmbt-socket-production-");

    try {
      await withServer({ eventPackagePath: tempPackagePath }, async ({ baseUrl }) => {
        const { socket } = await connectAndReceiveFullState(baseUrl, {
          role: "PRODUCER",
          panel: "producer",
          route: "/producer"
        });

        try {
          const productionStatePromise = waitForSocketEvent<unknown>(
            socket,
            "production:state",
            (payload) => JSON.stringify(payload).includes("DRAFT_READY")
          );
          const statePatchPromise = waitForSocketEvent<unknown>(
            socket,
            "state:patch",
            (payload) => JSON.stringify(payload).includes("PRODUCTION_STATE_CHANGED")
          );
          const logEntryPromise = waitForSocketEvent<unknown>(
            socket,
            "log:entry",
            (payload) => JSON.stringify(payload).includes("PRODUCTION_STATE_CHANGED")
          );

          const productionState = await requestJson(baseUrl, "/api/production/state", {
            method: "POST",
            body: {
              operatorId: "producer-1",
              status: "DRAFT_READY",
              activeMatchId: genericMatchId,
              activeGameNumber: 1,
              activeDraftId: genericDraftId,
              now: "2026-06-01T07:00:00.000Z"
            }
          });

          expect(productionState.status).toBe(200);
          expectSocketEnvelope(await productionStatePromise, "production:state");
          expectSocketEnvelope(await statePatchPromise, "state:patch");
          expectSocketEnvelope(await logEntryPromise, "log:entry");

          const previewPromise = waitForSocketEvent<unknown>(
            socket,
            "graphics:preview",
            (payload) => JSON.stringify(payload).includes("GRAPHICS_PREVIEWED")
          );

          const preview = await requestJson(baseUrl, "/api/production/preview", {
            method: "POST",
            body: {
              operatorId: "producer-1",
              graphicType: "DRAFT_OVERLAY",
              payload: {
                matchId: genericMatchId,
                draftId: genericDraftId
              },
              now: "2026-06-01T07:00:05.000Z"
            }
          });

          expect(preview.status).toBe(200);
          expectSocketEnvelope(await previewPromise, "graphics:preview");

          await expectNoSocketEvent(socket, "graphics:program", async () => {
            const rejectedTake = await requestJson(baseUrl, "/api/production/take", {
              method: "POST",
              body: {
                operatorId: "producer-1",
                now: "2026-06-01T07:00:07.000Z"
              }
            });

            expect(rejectedTake.status).toBe(409);
          });

          const programPromise = waitForSocketEvent<unknown>(
            socket,
            "graphics:program",
            (payload) => JSON.stringify(payload).includes("GRAPHICS_TAKEN")
          );
          const take = await requestJson(baseUrl, "/api/production/take", {
            method: "POST",
            body: {
              operatorId: "producer-1",
              confirm: true,
              now: "2026-06-01T07:00:10.000Z"
            }
          });

          expect(take.status).toBe(200);
          expectSocketEnvelope(await programPromise, "graphics:program");

          const clearPromise = waitForSocketEvent<unknown>(
            socket,
            "graphics:clear",
            (payload) => JSON.stringify(payload).includes("GRAPHICS_CLEARED")
          );
          const clear = await requestJson(baseUrl, "/api/production/clear", {
            method: "POST",
            body: {
              operatorId: "producer-1",
              confirm: true,
              now: "2026-06-01T07:00:15.000Z"
            }
          });

          expect(clear.status).toBe(200);
          expectSocketEnvelope(await clearPromise, "graphics:clear");

          const emergencyPromise = waitForSocketEvent<unknown>(
            socket,
            "production:state",
            (payload) => JSON.stringify(payload).includes("EMERGENCY_TRIGGERED")
          );
          const emergencyProgramPromise = waitForSocketEvent<unknown>(
            socket,
            "graphics:program",
            (payload) => JSON.stringify(payload).includes("EMERGENCY_TRIGGERED")
          );
          const emergency = await requestJson(baseUrl, "/api/production/emergency", {
            method: "POST",
            body: {
              operatorId: "producer-1",
              confirm: true,
              message: "Stand by",
              reason: "private-reason-do-not-broadcast",
              now: "2026-06-01T07:00:20.000Z"
            }
          });

          expect(emergency.status).toBe(200);

          const emergencyUpdate = await emergencyPromise;
          const emergencyProgram = await emergencyProgramPromise;
          const combinedPayload = JSON.stringify([emergencyUpdate, emergencyProgram]);

          expectSocketEnvelope(emergencyUpdate, "production:state");
          expectSocketEnvelope(emergencyProgram, "graphics:program");
          expect(combinedPayload).not.toMatch(/private-reason-do-not-broadcast|apiKey|secret/i);
          expect(combinedPayload).not.toMatch(/triggeredByOperatorId|clearedByOperatorId/);
        } finally {
          socket.disconnect();
        }
      });
    } finally {
      rmSync(tempPackagePath, { recursive: true, force: true });
    }
  });

  it("rejects socket-side mutation attempts and keeps REST as the authoritative mutation path", async () => {
    await withServer({}, async ({ baseUrl }) => {
      const { socket } = await connectAndReceiveFullState(baseUrl, {
        role: "OVERLAY",
        panel: "overlay-draft",
        clientType: "overlay",
        route: "/overlay/draft/match_grand-final",
        matchId: genericMatchId
      });

      try {
        const errorPromise = waitForSocketEvent<unknown>(
          socket,
          "error",
          (payload) => JSON.stringify(payload).includes("SOCKET_MUTATION_NOT_ALLOWED")
        );

        socket.emit("draft:lock", {
          draftId: genericDraftId,
          actionId: genericFirstActionId,
          heroId: genericHeroId,
          correlationId: "overlay-lock-attempt"
        });

        const error = await errorPromise;

        expectSocketEnvelope(error, "error:socket-mutation-not-allowed");
        expect(error.payload).toMatchObject({
          code: "SOCKET_MUTATION_NOT_ALLOWED",
          correlationId: "overlay-lock-attempt"
        });

        const stateAfter = await requestJson(baseUrl, "/api/state");

        expect(stateAfter.body).toMatchObject({
          ok: true,
          data: {
            revision: 1,
            drafts: {
              [genericDraftId]: expect.objectContaining({
                status: "READY",
                lockedHeroIds: []
              })
            }
          }
        });
      } finally {
        socket.disconnect();
      }
    });
  });

  it("sends the latest state snapshot after reconnect", async () => {
    const tempPackagePath = createTempEventPackage("mmbt-socket-reconnect-");

    try {
      await withServer({ eventPackagePath: tempPackagePath }, async ({ baseUrl }) => {
        const firstClient = await connectAndReceiveFullState(baseUrl, {
          role: "PRODUCER",
          panel: "producer"
        });

        firstClient.socket.disconnect();

        const mutation = await requestJson(baseUrl, "/api/production/state", {
          method: "POST",
          body: {
            operatorId: "producer-1",
            status: "DRAFT_READY",
            now: "2026-06-01T08:00:00.000Z"
          }
        });

        expect(mutation.status).toBe(200);

        const secondClient = await connectAndReceiveFullState(baseUrl, {
          role: "VIEWER",
          panel: "reconnected-client"
        });

        try {
          expectSocketEnvelope(secondClient.stateFull, "state:full");
          expect(secondClient.stateFull.payload).toMatchObject({
            revision: 2,
            production: {
              status: "DRAFT_READY"
            }
          });
        } finally {
          secondClient.socket.disconnect();
        }
      });
    } finally {
      rmSync(tempPackagePath, { recursive: true, force: true });
    }
  });

  it("resolves every sample event match and game adapter ID to a loaded local adapter", async () => {
    const runtimeState = await createServerRuntimeState({
      eventPackagePath: sampleEventPath,
      repositoryRoot,
      now: "2026-05-31T00:00:00.000Z"
    });

    expect(runtimeState.eventPackageLoadResult.ok).toBe(true);
    expect(runtimeState.adapterValidationWarnings).toEqual([]);

    if (!runtimeState.eventPackageLoadResult.ok) {
      throw new Error("Expected sample event to load.");
    }

    const loadedAdapterIds = new Set(
      runtimeState.adapters.adapters.filter((adapter) => adapter.loaded).map((adapter) => adapter.gameCode)
    );

    runtimeState.eventPackageLoadResult.value.matches.forEach((match) => {
      expect(loadedAdapterIds.has(match.gameCode)).toBe(true);
    });
    runtimeState.eventPackageLoadResult.value.games.forEach((game) => {
      expect(loadedAdapterIds.has(game.gameCode)).toBe(true);
    });
  });

  it("surfaces structured warnings when event package adapter IDs are unresolved", async () => {
    const tempPackagePath = mkdtempSync(join(tmpdir(), "mmbt-unresolved-adapter-"));

    try {
      cpSync(sampleEventPath, tempPackagePath, { recursive: true });

      const eventPath = join(tempPackagePath, "event.json");
      const eventFile = JSON.parse(readFileSync(eventPath, "utf8")) as {
        event: { gameCodes: string[] };
      };

      eventFile.event.gameCodes.push("unknown-moba");
      writeFileSync(eventPath, `${JSON.stringify(eventFile, null, 2)}\n`, "utf8");

      const runtimeState = await createServerRuntimeState({
        eventPackagePath: tempPackagePath,
        repositoryRoot,
        now: "2026-05-31T00:00:00.000Z"
      });
      const state = await fetchJson("/api/state", { eventPackagePath: tempPackagePath });
      const health = await fetchJson("/api/health", { eventPackagePath: tempPackagePath });

      expect(runtimeState.eventPackageLoadResult.ok).toBe(true);
      expect(runtimeState.adapterValidationWarnings).toEqual([
        expect.objectContaining({
          code: "ADAPTER_NOT_LOADED",
          adapterId: "unknown-moba",
          severity: "warning",
          path: "event.json.event.gameCodes[4]"
        })
      ]);

      expect(health.body).toMatchObject({
        ok: true,
        data: {
          status: "WARN",
          adapterStatus: {
            "unknown-moba": {
              loaded: false
            }
          }
        }
      });
      expect(state.body).toMatchObject({
        ok: true,
        data: {
          validationWarnings: {
            adapters: [
              expect.objectContaining({
                code: "ADAPTER_NOT_LOADED",
                adapterId: "unknown-moba"
              })
            ]
          }
        }
      });
    } finally {
      rmSync(tempPackagePath, { recursive: true, force: true });
    }
  });

  it("keeps exposed read endpoints public-safe and local-only", async () => {
    const eventPackage = await fetchJson("/api/event-package");
    const matches = await fetchJson("/api/matches");
    const adapters = await fetchJson("/api/adapters");
    const state = await fetchJson("/api/state");
    const overlayRoute = await fetchJson("/overlay/program");
    const responseText = JSON.stringify([eventPackage.body, matches.body, adapters.body, state.body]);

    expect(responseText).not.toMatch(/hiddenCompetitiveInformation|hiddenOpponentData|apiKey|secret/i);
    expect(responseText).not.toMatch(/https?:\/\//i);
    expect(responseText).not.toMatch(/file:\/\//i);
    expect(responseText).not.toMatch(/riotApi|lcuReader|dataDragon|garenaApi|tencentApi|timiApi/i);
    expect(overlayRoute.status).toBe(404);
    expect(overlayRoute.body).toMatchObject({
      ok: false,
      error: {
        code: "ROUTE_NOT_FOUND"
      }
    });
  });

  it("does not add runtime hooks for forbidden automation or external integrations", () => {
    const sourceFiles = [
      "adapter-loader.ts",
      "api.ts",
      "audit-log.ts",
      "draft-runtime.ts",
      "event-package-loader.ts",
      "index.ts",
      "paths.ts",
      "production-runtime.ts",
      "realtime.ts",
      "result.ts",
      "runtime-state.ts",
      "socket.ts",
      "server.ts"
    ];
    const sourceText = sourceFiles
      .map((fileName) => readFileSync(join(repositoryRoot, "apps", "server", "src", fileName), "utf8"))
      .join("\n");

    expect(sourceText).not.toMatch(/autoPick|autoBan|playerAutomation|championSelectSync|liveClient/i);
    expect(sourceText).not.toMatch(/obsWebSocket|vMixApi|cloudSync|databaseUrl/i);
    expect(sourceText).not.toMatch(/draft:start.*startDraft\(|draft:lock.*lockHero\(|production:set-state.*setProductionState\(/is);
  });
});
