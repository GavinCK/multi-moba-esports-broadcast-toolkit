import { aovSampleAdapter } from "@mmbt/game-aov-sample";
import { genericMobaAdapter } from "@mmbt/game-generic-moba";
import { hokSampleAdapter } from "@mmbt/game-hok-sample";
import { lolSampleAdapter } from "@mmbt/game-lol-sample";
import {
  createEmptyGameAdapterRegistry,
  listGameAdapters,
  loadGameAdapters,
  type GameAdapterRegistry
} from "@mmbt/game-adapters";
import type {
  DraftRuleset,
  GameAdapter,
  GameAdapterCapabilities,
  GameCode,
  Hero,
  SystemHealth
} from "@mmbt/shared-types";

import type { LoadedEventPackage } from "./event-package-loader.js";

export const KNOWN_LOCAL_ADAPTER_IDS = ["generic-moba", "lol", "aov", "hok"] as const;

const LOCAL_STATIC_ADAPTERS = [
  genericMobaAdapter,
  lolSampleAdapter,
  aovSampleAdapter,
  hokSampleAdapter
] as const satisfies readonly GameAdapter[];

export interface PublicAdapterSummary {
  gameCode: GameCode;
  displayName: string;
  version?: string;
  loaded: boolean;
  heroCount: number;
  rulesetCount: number;
  capabilities: GameAdapterCapabilities;
  source: "LOCAL_STATIC_SAMPLE";
  error?: {
    code: string;
    message: string;
  };
}

export interface PublicAdapterDetail extends PublicAdapterSummary {
  heroes: Hero[];
  rulesets: DraftRuleset[];
}

export interface AdapterValidationWarning {
  path: string;
  code: "ADAPTER_NOT_LOADED";
  message: string;
  adapterId: GameCode;
  severity: "warning";
}

export interface LoadedLocalAdapters {
  registry: GameAdapterRegistry;
  knownAdapterIds: readonly GameCode[];
  loadedAt: string;
  adapters: PublicAdapterDetail[];
  adapterStatus: SystemHealth["adapterStatus"];
}

export interface LoadLocalAdaptersOptions {
  now?: string;
}

function cloneCapabilities(capabilities: GameAdapterCapabilities): GameAdapterCapabilities {
  return {
    supportsManualDraft: capabilities.supportsManualDraft,
    supportsClientReader: capabilities.supportsClientReader,
    supportsIngameHud: capabilities.supportsIngameHud,
    supportsPostGameStats: capabilities.supportsPostGameStats,
    supportsAssetSync: capabilities.supportsAssetSync,
    supportsLocalization: capabilities.supportsLocalization,
    supportsCustomRulesets: capabilities.supportsCustomRulesets
  };
}

function cloneHero(hero: Hero): Hero {
  return {
    ...hero,
    localizedNames: hero.localizedNames ? { ...hero.localizedNames } : undefined,
    roleTags: hero.roleTags ? [...hero.roleTags] : undefined,
    metadata: hero.metadata ? { ...hero.metadata } : undefined
  };
}

function cloneRuleset(ruleset: DraftRuleset): DraftRuleset {
  return {
    ...ruleset,
    phases: ruleset.phases.map((phase) => ({
      ...phase,
      metadata: phase.metadata ? { ...phase.metadata } : undefined
    })),
    metadata: ruleset.metadata ? { ...ruleset.metadata } : undefined
  };
}

function toSummary(detail: PublicAdapterDetail): PublicAdapterSummary {
  return {
    gameCode: detail.gameCode,
    displayName: detail.displayName,
    version: detail.version,
    loaded: detail.loaded,
    heroCount: detail.heroCount,
    rulesetCount: detail.rulesetCount,
    capabilities: cloneCapabilities(detail.capabilities),
    source: detail.source,
    error: detail.error ? { ...detail.error } : undefined
  };
}

function createFailedDetail(
  adapter: Pick<GameAdapter, "gameCode" | "displayName" | "version" | "capabilities">,
  code: string,
  message: string
): PublicAdapterDetail {
  return {
    gameCode: adapter.gameCode,
    displayName: adapter.displayName,
    version: adapter.version,
    loaded: false,
    heroCount: 0,
    rulesetCount: 0,
    capabilities: cloneCapabilities(adapter.capabilities),
    source: "LOCAL_STATIC_SAMPLE",
    error: { code, message },
    heroes: [],
    rulesets: []
  };
}

async function createAdapterDetail(adapter: GameAdapter): Promise<PublicAdapterDetail> {
  try {
    const [heroes, rulesets] = await Promise.all([
      adapter.loadHeroes(),
      adapter.loadDefaultRulesets()
    ]);

    return {
      gameCode: adapter.gameCode,
      displayName: adapter.displayName,
      version: adapter.version,
      loaded: true,
      heroCount: heroes.length,
      rulesetCount: rulesets.length,
      capabilities: cloneCapabilities(adapter.capabilities),
      source: "LOCAL_STATIC_SAMPLE",
      heroes: heroes.map((hero) => cloneHero(hero)),
      rulesets: rulesets.map((ruleset) => cloneRuleset(ruleset))
    };
  } catch (error) {
    return createFailedDetail(
      adapter,
      "ADAPTER_LOAD_FAILED",
      error instanceof Error ? error.message : "Adapter data could not be loaded."
    );
  }
}

function createAdapterStatus(
  details: readonly PublicAdapterDetail[],
  loadedAt: string
): SystemHealth["adapterStatus"] {
  return Object.fromEntries(
    details.map((detail) => [
      detail.gameCode,
      {
        loaded: detail.loaded,
        displayName: detail.displayName,
        heroCount: detail.heroCount,
        rulesetCount: detail.rulesetCount,
        lastLoadedAt: detail.loaded ? loadedAt : undefined,
        error: detail.error?.message
      }
    ])
  );
}

export async function loadLocalGameAdapters(
  options: LoadLocalAdaptersOptions = {}
): Promise<LoadedLocalAdapters> {
  const loadedAt = options.now ?? new Date().toISOString();
  const registryResult = loadGameAdapters(LOCAL_STATIC_ADAPTERS);

  if (!registryResult.ok) {
    const failedDetails = LOCAL_STATIC_ADAPTERS.map((adapter) =>
      createFailedDetail(adapter, registryResult.error.code, registryResult.error.message)
    );

    return {
      registry: createEmptyGameAdapterRegistry(),
      knownAdapterIds: [...KNOWN_LOCAL_ADAPTER_IDS],
      loadedAt,
      adapters: failedDetails,
      adapterStatus: createAdapterStatus(failedDetails, loadedAt)
    };
  }

  const details = await Promise.all(listGameAdapters(registryResult.value).map(createAdapterDetail));

  return {
    registry: registryResult.value,
    knownAdapterIds: [...KNOWN_LOCAL_ADAPTER_IDS],
    loadedAt,
    adapters: details,
    adapterStatus: createAdapterStatus(details, loadedAt)
  };
}

export function listPublicAdapterSummaries(
  adapterState: LoadedLocalAdapters
): PublicAdapterSummary[] {
  return adapterState.adapters.map((detail) => toSummary(detail));
}

export function getPublicAdapterDetail(
  adapterState: LoadedLocalAdapters,
  adapterId: GameCode
): PublicAdapterDetail | null {
  return adapterState.adapters.find((detail) => detail.gameCode === adapterId) ?? null;
}

export function validateEventPackageAdapterReferences(
  snapshot: LoadedEventPackage,
  adapterState: LoadedLocalAdapters
): AdapterValidationWarning[] {
  const loadedAdapterIds = new Set(
    adapterState.adapters.filter((adapter) => adapter.loaded).map((adapter) => adapter.gameCode)
  );
  const warnings = new Map<string, AdapterValidationWarning>();

  function addWarning(path: string, adapterId: GameCode): void {
    if (loadedAdapterIds.has(adapterId)) {
      return;
    }

    const key = `${path}:${adapterId}`;
    warnings.set(key, {
      path,
      code: "ADAPTER_NOT_LOADED",
      message: `Event package references adapter "${adapterId}", but no loaded local adapter is available for it.`,
      adapterId,
      severity: "warning"
    });
  }

  snapshot.event.gameCodes.forEach((gameCode, index) => {
    addWarning(`event.json.event.gameCodes[${index}]`, gameCode);
  });
  addWarning("event.json.defaults.gameCode", snapshot.defaults.gameCode);

  Object.keys(snapshot.defaults.rulesetByGameCode).forEach((gameCode) => {
    addWarning(`event.json.defaults.rulesetByGameCode.${gameCode}`, gameCode);
  });

  snapshot.matches.forEach((match, matchIndex) => {
    addWarning(`matches.json.matches[${matchIndex}].gameCode`, match.gameCode);
  });

  snapshot.games.forEach((game, gameIndex) => {
    addWarning(`matches.json.games[${gameIndex}].gameCode`, game.gameCode);
  });

  snapshot.rulesets.forEach((ruleset, rulesetIndex) => {
    addWarning(`rulesets[${rulesetIndex}].gameCode`, ruleset.gameCode);
  });

  return [...warnings.values()].sort((firstWarning, secondWarning) =>
    firstWarning.path.localeCompare(secondWarning.path)
  );
}
