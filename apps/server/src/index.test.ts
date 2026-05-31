import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";

import { describe, expect, it } from "vitest";

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

async function fetchJson(
  pathname: string,
  options: { eventPackagePath?: string } = {}
): Promise<{ status: number; body: unknown }> {
  const { server } = await createServerApp({
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
    const response = await fetch(`http://127.0.0.1:${(address as AddressInfo).port}${pathname}`);

    return {
      status: response.status,
      body: await response.json()
    };
  } finally {
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
        currentMatchId: "match_grand-final",
        currentGameId: "game_generic-001",
        drafts: {},
        production: {
          status: "PRE_SHOW",
          overlaySafety: {
            readOnly: true,
            mutationAllowed: false
          }
        }
      }
    });

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
    const responseText = JSON.stringify([eventPackage.body, matches.body, adapters.body, state.body]);

    expect(responseText).not.toMatch(/hiddenCompetitiveInformation|hiddenOpponentData|apiKey|secret/i);
    expect(responseText).not.toMatch(/https?:\/\//i);
    expect(responseText).not.toMatch(/file:\/\//i);
    expect(responseText).not.toMatch(/riotApi|lcuReader|dataDragon|garenaApi|tencentApi|timiApi/i);
  });

  it("does not add runtime hooks for forbidden automation or external integrations", () => {
    const sourceFiles = [
      "adapter-loader.ts",
      "api.ts",
      "event-package-loader.ts",
      "index.ts",
      "paths.ts",
      "result.ts",
      "runtime-state.ts",
      "server.ts"
    ];
    const sourceText = sourceFiles
      .map((fileName) => readFileSync(join(repositoryRoot, "apps", "server", "src", fileName), "utf8"))
      .join("\n");

    expect(sourceText).not.toMatch(/autoPick|autoBan|playerAutomation|championSelectSync|liveClient/i);
    expect(sourceText).not.toMatch(/obsWebSocket|vMixApi|cloudSync|databaseUrl/i);
    expect(sourceText).not.toMatch(/socket\.io|from "socket\.io"|from 'socket\.io'/i);
  });
});
