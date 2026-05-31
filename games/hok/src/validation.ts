import { validateDraftRuleset } from "@mmbt/core-draft";
import type {
  DraftAction,
  DraftState,
  DraftValidationIssue,
  DraftValidationResult,
  Hero,
  JsonObject,
  JsonValue
} from "@mmbt/shared-types";

import {
  HOK_SAMPLE_ADAPTER_METADATA,
  HOK_SAMPLE_DATA_SOURCE,
  HOK_SAMPLE_DISPLAY_NAME,
  HOK_SAMPLE_GAME_CODE,
  HOK_SAMPLE_HEROES
} from "./data.js";

const HOK_SAMPLE_SUPPORTED_PHASE_TYPES = ["BAN", "PICK"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJsonValue(value: unknown, seen: ReadonlySet<object> = new Set<object>()): value is JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (Array.isArray(value)) {
    return value.every((item) => isJsonValue(item, seen));
  }

  if (!isRecord(value) || seen.has(value)) {
    return false;
  }

  const nextSeen = new Set(seen);
  nextSeen.add(value);

  return Object.values(value).every((item) => isJsonValue(item, nextSeen));
}

function addIssue(
  issues: DraftValidationIssue[],
  code: string,
  message: string,
  details?: JsonObject
): void {
  issues.push({ code, message, details });
}

function toResult(issues: readonly DraftValidationIssue[]): DraftValidationResult {
  return issues.length === 0
    ? { valid: true }
    : {
        valid: false,
        reason: "HoK sample adapter validation failed.",
        issues: [...issues]
      };
}

function isLocalAssetReference(value: string): boolean {
  const reference = value.trim();

  return (
    reference.length > 0 &&
    !reference.includes("://") &&
    !reference.startsWith("/") &&
    !reference.startsWith("\\") &&
    !reference.includes("..") &&
    !reference.includes("?") &&
    !reference.includes("#")
  );
}

function validateOptionalAssetReference(
  record: Record<string, unknown>,
  field: string,
  path: string,
  issues: DraftValidationIssue[]
): void {
  const value = record[field];

  if (value === undefined) {
    return;
  }

  if (typeof value !== "string" || !isLocalAssetReference(value)) {
    addIssue(issues, "hok-sample-asset-reference-invalid", `${path} must be a local relative asset reference.`, {
      path
    });
  }
}

function validateOptionalMetadata(
  record: Record<string, unknown>,
  path: string,
  issues: DraftValidationIssue[]
): void {
  const metadata = record.metadata;

  if (metadata === undefined) {
    return;
  }

  if (!isRecord(metadata) || !isJsonValue(metadata)) {
    addIssue(issues, "hok-sample-metadata-invalid", `${path}.metadata must be JSON-serializable object data.`, {
      path: `${path}.metadata`
    });
  }
}

export function hasHokSampleHero(heroId: string): boolean {
  const normalizedHeroId = heroId.trim();

  return HOK_SAMPLE_HEROES.some((hero) => hero.id === normalizedHeroId);
}

export function validateHokSampleAdapterMetadata(
  metadata: unknown = HOK_SAMPLE_ADAPTER_METADATA
): DraftValidationResult {
  const issues: DraftValidationIssue[] = [];

  if (!isRecord(metadata)) {
    return {
      valid: false,
      reason: "HoK sample adapter metadata must be an object.",
      issues: [
        {
          code: "hok-sample-metadata-required-object",
          message: "HoK sample adapter metadata must be an object."
        }
      ]
    };
  }

  if (metadata.gameCode !== HOK_SAMPLE_GAME_CODE) {
    addIssue(issues, "hok-sample-metadata-game-code-mismatch", "metadata.gameCode must be hok.", {
      path: "metadata.gameCode",
      expectedGameCode: HOK_SAMPLE_GAME_CODE
    });
  }

  if (metadata.displayName !== HOK_SAMPLE_DISPLAY_NAME) {
    addIssue(issues, "hok-sample-metadata-display-name-mismatch", "metadata.displayName must label the static sample adapter.", {
      path: "metadata.displayName",
      expectedDisplayName: HOK_SAMPLE_DISPLAY_NAME
    });
  }

  if (metadata.mode !== "static-manual-sample") {
    addIssue(issues, "hok-sample-metadata-mode-invalid", "metadata.mode must be static-manual-sample.", {
      path: "metadata.mode"
    });
  }

  if (metadata.dataSource !== HOK_SAMPLE_DATA_SOURCE) {
    addIssue(issues, "hok-sample-metadata-source-invalid", "metadata.dataSource must identify local static sample data.", {
      path: "metadata.dataSource"
    });
  }

  return toResult(issues);
}

export function validateHokSampleHero(hero: unknown): DraftValidationResult {
  const issues: DraftValidationIssue[] = [];

  if (!isRecord(hero)) {
    return {
      valid: false,
      reason: "HoK sample selectable entity must be an object.",
      issues: [
        {
          code: "hok-sample-hero-required-object",
          message: "HoK sample selectable entity must be an object."
        }
      ]
    };
  }

  if (typeof hero.id !== "string" || hero.id.trim().length === 0) {
    addIssue(issues, "hok-sample-hero-id-required", "hero.id must be a non-empty string.", {
      path: "hero.id"
    });
  }

  if (hero.gameCode !== HOK_SAMPLE_GAME_CODE) {
    addIssue(issues, "hok-sample-hero-game-code-mismatch", "hero.gameCode must be hok.", {
      path: "hero.gameCode",
      expectedGameCode: HOK_SAMPLE_GAME_CODE
    });
  }

  if (typeof hero.displayName !== "string" || hero.displayName.trim().length === 0) {
    addIssue(issues, "hok-sample-hero-display-name-required", "hero.displayName must be a non-empty string.", {
      path: "hero.displayName"
    });
  }

  if (hero.localizedNames !== undefined) {
    if (!isRecord(hero.localizedNames)) {
      addIssue(issues, "hok-sample-localized-names-invalid", "hero.localizedNames must be a string map.", {
        path: "hero.localizedNames"
      });
    } else {
      Object.entries(hero.localizedNames).forEach(([locale, displayName]) => {
        if (typeof displayName !== "string" || displayName.trim().length === 0) {
          addIssue(issues, "hok-sample-localized-name-invalid", "Localized names must be non-empty strings.", {
            path: `hero.localizedNames.${locale}`
          });
        }
      });
    }
  }

  if (hero.roleTags !== undefined) {
    if (!Array.isArray(hero.roleTags)) {
      addIssue(issues, "hok-sample-role-tags-invalid", "hero.roleTags must be an array of strings.", {
        path: "hero.roleTags"
      });
    } else {
      hero.roleTags.forEach((roleTag, index) => {
        if (typeof roleTag !== "string" || roleTag.trim().length === 0) {
          addIssue(issues, "hok-sample-role-tag-invalid", "hero.roleTags entries must be non-empty strings.", {
            path: `hero.roleTags[${index}]`
          });
        }
      });
    }
  }

  validateOptionalAssetReference(hero, "iconUrl", "hero.iconUrl", issues);
  validateOptionalAssetReference(hero, "splashUrl", "hero.splashUrl", issues);
  validateOptionalAssetReference(hero, "squareUrl", "hero.squareUrl", issues);
  validateOptionalMetadata(hero, "hero", issues);

  return toResult(issues);
}

export function validateHokSampleHeroes(
  heroes: readonly Hero[] = HOK_SAMPLE_HEROES
): DraftValidationResult {
  const issues: DraftValidationIssue[] = [];
  const heroIds = new Set<string>();

  heroes.forEach((hero, heroIndex) => {
    const validation = validateHokSampleHero(hero);

    validation.issues?.forEach((issue) => {
      addIssue(issues, issue.code, issue.message, {
        ...(isRecord(issue.details) ? issue.details : {}),
        path: `heroes[${heroIndex}]`
      });
    });

    if (heroIds.has(hero.id)) {
      addIssue(issues, "hok-sample-hero-id-duplicate", "Hero IDs must be unique within the sample pool.", {
        path: `heroes[${heroIndex}].id`,
        heroId: hero.id
      });
    }

    heroIds.add(hero.id);
  });

  if (heroes.length === 0) {
    addIssue(issues, "hok-sample-heroes-empty", "The HoK sample adapter must expose local selectable entities.", {
      path: "heroes"
    });
  }

  return toResult(issues);
}

export function validateHokSampleRulesetCompatibility(ruleset: unknown): DraftValidationResult {
  const baseValidation = validateDraftRuleset(ruleset);
  const issues = [...(baseValidation.issues ?? [])];

  if (!isRecord(ruleset)) {
    return baseValidation;
  }

  if (ruleset.gameCode !== HOK_SAMPLE_GAME_CODE) {
    addIssue(issues, "hok-sample-ruleset-game-code-mismatch", "ruleset.gameCode must be hok.", {
      path: "ruleset.gameCode",
      expectedGameCode: HOK_SAMPLE_GAME_CODE
    });
  }

  if (Array.isArray(ruleset.phases)) {
    const requiredSelectionSlots = ruleset.phases.reduce((slotCount, phase) => {
      if (!isRecord(phase) || (phase.type !== "BAN" && phase.type !== "PICK")) {
        return slotCount;
      }

      return Number.isInteger(phase.count) ? slotCount + (phase.count as number) : slotCount;
    }, 0);

    ruleset.phases.forEach((phase, phaseIndex) => {
      if (!isRecord(phase)) {
        return;
      }

      if (
        typeof phase.type === "string" &&
        !(HOK_SAMPLE_SUPPORTED_PHASE_TYPES as readonly string[]).includes(phase.type)
      ) {
        addIssue(
          issues,
          "hok-sample-ruleset-phase-unsupported",
          "HoK sample v0.1 rulesets support BAN and PICK phases only.",
          { path: `ruleset.phases[${phaseIndex}].type`, phaseType: phase.type }
        );
      }
    });

    if (ruleset.allowDuplicateHeroes === false && requiredSelectionSlots > HOK_SAMPLE_HEROES.length) {
      addIssue(
        issues,
        "hok-sample-ruleset-pool-too-small",
        "The local sample hero pool must be large enough for the no-duplicate ruleset.",
        {
          requiredSelectionSlots,
          availableHeroes: HOK_SAMPLE_HEROES.length
        }
      );
    }
  }

  return toResult(issues);
}

export function validateHokSampleDraftAction(
  state: DraftState,
  action: DraftAction
): DraftValidationResult {
  const issues: DraftValidationIssue[] = [];

  if (state.gameCode !== HOK_SAMPLE_GAME_CODE) {
    addIssue(issues, "hok-sample-state-game-code-mismatch", "Draft state gameCode must be hok.", {
      stateGameCode: state.gameCode,
      expectedGameCode: HOK_SAMPLE_GAME_CODE
    });
  }

  if ((action.type === "BAN" || action.type === "PICK") && action.team !== "BLUE" && action.team !== "RED") {
    addIssue(
      issues,
      "hok-sample-action-team-invalid",
      "HoK sample BAN/PICK actions must use BLUE or RED team side.",
      { actionId: action.id, team: action.team }
    );
  }

  if ((action.status === "HOVER" || action.status === "LOCKED") && !action.heroId) {
    addIssue(
      issues,
      "hok-sample-action-hero-required",
      "HoK sample hovered or locked actions require a hero ID.",
      { actionId: action.id, status: action.status }
    );
  }

  if (action.heroId && !hasHokSampleHero(action.heroId)) {
    addIssue(issues, "hok-sample-action-hero-unknown", "HoK sample action references an unknown hero.", {
      actionId: action.id,
      heroId: action.heroId
    });
  }

  return toResult(issues);
}

export function assertHokSampleHero(hero: Hero): Hero {
  const result = validateHokSampleHero(hero);

  if (!result.valid) {
    throw new Error(result.reason ?? "HoK sample hero validation failed.");
  }

  return hero;
}
