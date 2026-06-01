import {
  createDraftState,
  getCurrentActionSlots,
  getCurrentPhase
} from "@mmbt/core-draft";
import type {
  DraftAction,
  DraftActionType,
  DraftPhaseDefinition,
  DraftRuleset,
  DraftState,
  GameCode,
  Hero,
  TeamSide
} from "@mmbt/shared-types";

import type { LoadedLocalAdapters, PublicAdapterDetail } from "./adapter-loader.js";
import type { EventPackageGameInstance, LoadedEventPackage } from "./event-package-loader.js";

export interface DraftRuntimeEntry {
  draft: DraftState;
  matchId: string;
  gameId: string;
  gameNumber: number;
  gameCode: GameCode;
  rulesetId: string;
  ruleset: DraftRuleset;
  heroes: Hero[];
}

export interface DraftRuntimeState {
  drafts: Record<string, DraftRuntimeEntry>;
}

export interface DraftSummary {
  id: string;
  matchId: string;
  gameId: string;
  gameNumber: number;
  gameCode: GameCode;
  rulesetId: string;
  status: DraftState["status"];
  currentPhaseIndex: number;
  currentPhase: DraftPhaseDefinition | null;
  currentActionIds: string[];
  timer: DraftState["timer"];
  actionCounts: {
    total: number;
    pending: number;
    hover: number;
    locked: number;
    skipped: number;
    cancelled: number;
  };
  lockedHeroIds: string[];
  bannedHeroIds: string[];
  pickedHeroIds: string[];
  updatedAt?: string;
}

export interface DraftSnapshot {
  summary: DraftSummary;
  draft: DraftState;
}

export interface DraftMutationSummary {
  id: string;
  matchId: string;
  gameId: string;
  gameNumber: number;
  gameCode: GameCode;
  rulesetId: string;
  status: DraftState["status"];
  currentPhaseIndex: number;
  currentPhaseId: string | null;
  actionId?: string;
  actionType?: DraftActionType;
  team?: TeamSide | "NONE";
  heroId?: string | null;
  lockedHeroCount: number;
  bannedHeroCount: number;
  pickedHeroCount: number;
}

export interface CreateDraftRuntimeOptions {
  eventPackage: LoadedEventPackage | null;
  adapters: LoadedLocalAdapters;
  now: string;
}

export interface CreateDraftRuntimeEntryOptions {
  eventPackage: LoadedEventPackage;
  adapters: LoadedLocalAdapters;
  game: EventPackageGameInstance;
  draftId?: string;
  now: string;
  operatorId?: string;
}

function cloneDraftState(draft: DraftState): DraftState {
  return JSON.parse(JSON.stringify(draft)) as DraftState;
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

function findAdapter(adapters: LoadedLocalAdapters, gameCode: GameCode): PublicAdapterDetail | null {
  return adapters.adapters.find((adapter) => adapter.gameCode === gameCode && adapter.loaded) ?? null;
}

function findRuleset(
  eventPackage: LoadedEventPackage,
  adapters: LoadedLocalAdapters,
  game: EventPackageGameInstance
): DraftRuleset | null {
  const packageRuleset = eventPackage.rulesets.find(
    (ruleset) => ruleset.id === game.rulesetId && ruleset.gameCode === game.gameCode
  );

  if (packageRuleset) {
    return cloneRuleset(packageRuleset);
  }

  const adapter = findAdapter(adapters, game.gameCode);
  const adapterRuleset = adapter?.rulesets.find(
    (ruleset) => ruleset.id === game.rulesetId && ruleset.gameCode === game.gameCode
  );

  return adapterRuleset ? cloneRuleset(adapterRuleset) : null;
}

function getHeroesForGame(adapters: LoadedLocalAdapters, gameCode: GameCode): Hero[] {
  const adapter = findAdapter(adapters, gameCode);

  return adapter ? adapter.heroes.map((hero) => ({ ...hero })) : [];
}

function getDraftId(game: EventPackageGameInstance): string {
  return game.draftId ?? `draft_${game.id}`;
}

export function createDraftRuntimeEntry(options: CreateDraftRuntimeEntryOptions): DraftRuntimeEntry | null {
  const ruleset = findRuleset(options.eventPackage, options.adapters, options.game);

  if (!ruleset) {
    return null;
  }

  const draftResult = createDraftState({
    id: options.draftId ?? getDraftId(options.game),
    gameId: options.game.id,
    ruleset,
    now: options.now,
    operatorId: options.operatorId,
    metadata: {
      matchId: options.game.matchId,
      gameNumber: options.game.gameNumber,
      source: "event-package"
    }
  });

  if (!draftResult.ok) {
    return null;
  }

  return {
    draft: draftResult.value,
    matchId: options.game.matchId,
    gameId: options.game.id,
    gameNumber: options.game.gameNumber,
    gameCode: options.game.gameCode,
    rulesetId: options.game.rulesetId,
    ruleset,
    heroes: getHeroesForGame(options.adapters, options.game.gameCode)
  };
}

export function createDraftRuntime(options: CreateDraftRuntimeOptions): DraftRuntimeState {
  if (!options.eventPackage) {
    return { drafts: {} };
  }

  const drafts: Record<string, DraftRuntimeEntry> = {};

  options.eventPackage.games.forEach((game) => {
    const entry = createDraftRuntimeEntry({
      eventPackage: options.eventPackage as LoadedEventPackage,
      adapters: options.adapters,
      game,
      now: options.now
    });

    if (!entry) {
      return;
    }

    drafts[entry.draft.id] = entry;
  });

  return { drafts };
}

function countActions(actions: readonly DraftAction[]): DraftSummary["actionCounts"] {
  return {
    total: actions.length,
    pending: actions.filter((action) => action.status === "PENDING").length,
    hover: actions.filter((action) => action.status === "HOVER").length,
    locked: actions.filter((action) => action.status === "LOCKED").length,
    skipped: actions.filter((action) => action.status === "SKIPPED").length,
    cancelled: actions.filter((action) => action.status === "CANCELLED").length
  };
}

export function createDraftSummary(entry: DraftRuntimeEntry): DraftSummary {
  return {
    id: entry.draft.id,
    matchId: entry.matchId,
    gameId: entry.gameId,
    gameNumber: entry.gameNumber,
    gameCode: entry.gameCode,
    rulesetId: entry.rulesetId,
    status: entry.draft.status,
    currentPhaseIndex: entry.draft.currentPhaseIndex,
    currentPhase: getCurrentPhase(entry.draft, entry.ruleset),
    currentActionIds: getCurrentActionSlots(entry.draft, entry.ruleset).map((action) => action.id),
    timer: { ...entry.draft.timer },
    actionCounts: countActions(entry.draft.actions),
    lockedHeroIds: [...entry.draft.lockedHeroIds],
    bannedHeroIds: [...entry.draft.bannedHeroIds],
    pickedHeroIds: [...entry.draft.pickedHeroIds],
    updatedAt: entry.draft.updatedAt
  };
}

export function createDraftSnapshot(entry: DraftRuntimeEntry): DraftSnapshot {
  return {
    summary: createDraftSummary(entry),
    draft: cloneDraftState(entry.draft)
  };
}

export function listDraftSummaries(
  draftRuntime: DraftRuntimeState,
  filters: { matchId?: string; gameId?: string } = {}
): DraftSummary[] {
  return Object.values(draftRuntime.drafts)
    .filter((entry) => !filters.matchId || entry.matchId === filters.matchId)
    .filter((entry) => !filters.gameId || entry.gameId === filters.gameId)
    .sort((firstEntry, secondEntry) => firstEntry.draft.id.localeCompare(secondEntry.draft.id))
    .map(createDraftSummary);
}

export function getCurrentDraftForMatch(
  draftRuntime: DraftRuntimeState,
  eventPackage: LoadedEventPackage | null,
  matchId: string
): DraftRuntimeEntry | null {
  const match = eventPackage?.matches.find((item) => item.id === matchId);

  if (!match) {
    return null;
  }

  const currentGame = match.games.find((game) => game.gameNumber === match.currentGameNumber) ?? match.games[0];

  if (!currentGame) {
    return null;
  }

  return (
    Object.values(draftRuntime.drafts).find(
      (entry) => entry.matchId === matchId && entry.gameId === currentGame.id
    ) ?? null
  );
}

export function getDraftEntryByIdOrMatch(
  draftRuntime: DraftRuntimeState,
  eventPackage: LoadedEventPackage | null,
  idOrMatchId: string
): DraftRuntimeEntry | null {
  return draftRuntime.drafts[idOrMatchId] ?? getCurrentDraftForMatch(draftRuntime, eventPackage, idOrMatchId);
}

export function hasHero(entry: DraftRuntimeEntry, heroId: string): boolean {
  return entry.heroes.some((hero) => hero.id === heroId);
}

export function createDraftMutationSummary(
  entry: DraftRuntimeEntry,
  actionId?: string
): DraftMutationSummary {
  const action = actionId ? entry.draft.actions.find((item) => item.id === actionId) : undefined;
  const phase = getCurrentPhase(entry.draft, entry.ruleset);

  return {
    id: entry.draft.id,
    matchId: entry.matchId,
    gameId: entry.gameId,
    gameNumber: entry.gameNumber,
    gameCode: entry.gameCode,
    rulesetId: entry.rulesetId,
    status: entry.draft.status,
    currentPhaseIndex: entry.draft.currentPhaseIndex,
    currentPhaseId: phase?.id ?? null,
    actionId: action?.id,
    actionType: action?.type,
    team: action?.team,
    heroId: action?.heroId,
    lockedHeroCount: entry.draft.lockedHeroIds.length,
    bannedHeroCount: entry.draft.bannedHeroIds.length,
    pickedHeroCount: entry.draft.pickedHeroIds.length
  };
}
