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
  AOV_SAMPLE_ADAPTER_METADATA,
  AOV_SAMPLE_DATA_SOURCE,
  AOV_SAMPLE_DISPLAY_NAME,
  AOV_SAMPLE_GAME_CODE,
  AOV_SAMPLE_HEROES
} from "./data";

const AOV_SAMPLE_SUPPORTED_PHASE_TYPES = ["BAN", "PICK"] as const;

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
        reason: "AOV sample adapter validation failed.",
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
    addIssue(issues, "aov-sample-asset-reference-invalid", `${path} must be a local relative asset reference.`, {
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
    addIssue(issues, "aov-sample-metadata-invalid", `${path}.metadata must be JSON-serializable object data.`, {
      path: `${path}.metadata`
    });
  }
}

export function hasAovSampleHero(heroId: string): boolean {
  const normalizedHeroId = heroId.trim();

  return AOV_SAMPLE_HEROES.some((hero) => hero.id === normalizedHeroId);
}

export function validateAovSampleAdapterMetadata(
  metadata: unknown = AOV_SAMPLE_ADAPTER_METADATA
): DraftValidationResult {
  const issues: DraftValidationIssue[] = [];

  if (!isRecord(metadata)) {
    return {
      valid: false,
      reason: "AOV sample adapter metadata must be an object.",
      issues: [
        {
          code: "aov-sample-metadata-required-object",
          message: "AOV sample adapter metadata must be an object."
        }
      ]
    };
  }

  if (metadata.gameCode !== AOV_SAMPLE_GAME_CODE) {
    addIssue(issues, "aov-sample-metadata-game-code-mismatch", "metadata.gameCode must be aov.", {
      path: "metadata.gameCode",
      expectedGameCode: AOV_SAMPLE_GAME_CODE
    });
  }

  if (metadata.displayName !== AOV_SAMPLE_DISPLAY_NAME) {
    addIssue(issues, "aov-sample-metadata-display-name-mismatch", "metadata.displayName must label the static sample adapter.", {
      path: "metadata.displayName",
      expectedDisplayName: AOV_SAMPLE_DISPLAY_NAME
    });
  }

  if (metadata.mode !== "static-manual-sample") {
    addIssue(issues, "aov-sample-metadata-mode-invalid", "metadata.mode must be static-manual-sample.", {
      path: "metadata.mode"
    });
  }

  if (metadata.dataSource !== AOV_SAMPLE_DATA_SOURCE) {
    addIssue(issues, "aov-sample-metadata-source-invalid", "metadata.dataSource must identify local static sample data.", {
      path: "metadata.dataSource"
    });
  }

  return toResult(issues);
}

export function validateAovSampleHero(hero: unknown): DraftValidationResult {
  const issues: DraftValidationIssue[] = [];

  if (!isRecord(hero)) {
    return {
      valid: false,
      reason: "AOV sample selectable entity must be an object.",
      issues: [
        {
          code: "aov-sample-hero-required-object",
          message: "AOV sample selectable entity must be an object."
        }
      ]
    };
  }

  if (typeof hero.id !== "string" || hero.id.trim().length === 0) {
    addIssue(issues, "aov-sample-hero-id-required", "hero.id must be a non-empty string.", {
      path: "hero.id"
    });
  }

  if (hero.gameCode !== AOV_SAMPLE_GAME_CODE) {
    addIssue(issues, "aov-sample-hero-game-code-mismatch", "hero.gameCode must be aov.", {
      path: "hero.gameCode",
      expectedGameCode: AOV_SAMPLE_GAME_CODE
    });
  }

  if (typeof hero.displayName !== "string" || hero.displayName.trim().length === 0) {
    addIssue(issues, "aov-sample-hero-display-name-required", "hero.displayName must be a non-empty string.", {
      path: "hero.displayName"
    });
  }

  if (hero.localizedNames !== undefined) {
    if (!isRecord(hero.localizedNames)) {
      addIssue(issues, "aov-sample-localized-names-invalid", "hero.localizedNames must be a string map.", {
        path: "hero.localizedNames"
      });
    } else {
      Object.entries(hero.localizedNames).forEach(([locale, displayName]) => {
        if (typeof displayName !== "string" || displayName.trim().length === 0) {
          addIssue(issues, "aov-sample-localized-name-invalid", "Localized names must be non-empty strings.", {
            path: `hero.localizedNames.${locale}`
          });
        }
      });
    }
  }

  if (hero.roleTags !== undefined) {
    if (!Array.isArray(hero.roleTags)) {
      addIssue(issues, "aov-sample-role-tags-invalid", "hero.roleTags must be an array of strings.", {
        path: "hero.roleTags"
      });
    } else {
      hero.roleTags.forEach((roleTag, index) => {
        if (typeof roleTag !== "string" || roleTag.trim().length === 0) {
          addIssue(issues, "aov-sample-role-tag-invalid", "hero.roleTags entries must be non-empty strings.", {
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

export function validateAovSampleHeroes(
  heroes: readonly Hero[] = AOV_SAMPLE_HEROES
): DraftValidationResult {
  const issues: DraftValidationIssue[] = [];
  const heroIds = new Set<string>();

  heroes.forEach((hero, heroIndex) => {
    const validation = validateAovSampleHero(hero);

    validation.issues?.forEach((issue) => {
      addIssue(issues, issue.code, issue.message, {
        ...(isRecord(issue.details) ? issue.details : {}),
        path: `heroes[${heroIndex}]`
      });
    });

    if (heroIds.has(hero.id)) {
      addIssue(issues, "aov-sample-hero-id-duplicate", "Hero IDs must be unique within the sample pool.", {
        path: `heroes[${heroIndex}].id`,
        heroId: hero.id
      });
    }

    heroIds.add(hero.id);
  });

  if (heroes.length === 0) {
    addIssue(issues, "aov-sample-heroes-empty", "The AOV sample adapter must expose local selectable entities.", {
      path: "heroes"
    });
  }

  return toResult(issues);
}

export function validateAovSampleRulesetCompatibility(ruleset: unknown): DraftValidationResult {
  const baseValidation = validateDraftRuleset(ruleset);
  const issues = [...(baseValidation.issues ?? [])];

  if (!isRecord(ruleset)) {
    return baseValidation;
  }

  if (ruleset.gameCode !== AOV_SAMPLE_GAME_CODE) {
    addIssue(issues, "aov-sample-ruleset-game-code-mismatch", "ruleset.gameCode must be aov.", {
      path: "ruleset.gameCode",
      expectedGameCode: AOV_SAMPLE_GAME_CODE
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
        !(AOV_SAMPLE_SUPPORTED_PHASE_TYPES as readonly string[]).includes(phase.type)
      ) {
        addIssue(
          issues,
          "aov-sample-ruleset-phase-unsupported",
          "AOV sample v0.1 rulesets support BAN and PICK phases only.",
          { path: `ruleset.phases[${phaseIndex}].type`, phaseType: phase.type }
        );
      }
    });

    if (ruleset.allowDuplicateHeroes === false && requiredSelectionSlots > AOV_SAMPLE_HEROES.length) {
      addIssue(
        issues,
        "aov-sample-ruleset-pool-too-small",
        "The local sample hero pool must be large enough for the no-duplicate ruleset.",
        {
          requiredSelectionSlots,
          availableHeroes: AOV_SAMPLE_HEROES.length
        }
      );
    }
  }

  return toResult(issues);
}

export function validateAovSampleDraftAction(
  state: DraftState,
  action: DraftAction
): DraftValidationResult {
  const issues: DraftValidationIssue[] = [];

  if (state.gameCode !== AOV_SAMPLE_GAME_CODE) {
    addIssue(issues, "aov-sample-state-game-code-mismatch", "Draft state gameCode must be aov.", {
      stateGameCode: state.gameCode,
      expectedGameCode: AOV_SAMPLE_GAME_CODE
    });
  }

  if ((action.type === "BAN" || action.type === "PICK") && action.team !== "BLUE" && action.team !== "RED") {
    addIssue(
      issues,
      "aov-sample-action-team-invalid",
      "AOV sample BAN/PICK actions must use BLUE or RED team side.",
      { actionId: action.id, team: action.team }
    );
  }

  if ((action.status === "HOVER" || action.status === "LOCKED") && !action.heroId) {
    addIssue(
      issues,
      "aov-sample-action-hero-required",
      "AOV sample hovered or locked actions require a hero ID.",
      { actionId: action.id, status: action.status }
    );
  }

  if (action.heroId && !hasAovSampleHero(action.heroId)) {
    addIssue(issues, "aov-sample-action-hero-unknown", "AOV sample action references an unknown hero.", {
      actionId: action.id,
      heroId: action.heroId
    });
  }

  return toResult(issues);
}

export function assertAovSampleHero(hero: Hero): Hero {
  const result = validateAovSampleHero(hero);

  if (!result.valid) {
    throw new Error(result.reason ?? "AOV sample hero validation failed.");
  }

  return hero;
}
