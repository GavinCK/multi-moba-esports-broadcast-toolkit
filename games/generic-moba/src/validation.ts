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

import { GENERIC_MOBA_GAME_CODE, GENERIC_MOBA_HEROES } from "./data";

const GENERIC_MOBA_SUPPORTED_PHASE_TYPES = ["BAN", "PICK"] as const;

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
        reason: "Generic MOBA adapter validation failed.",
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
    addIssue(issues, "generic-moba-asset-reference-invalid", `${path} must be a local relative asset reference.`, {
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
    addIssue(issues, "generic-moba-metadata-invalid", `${path}.metadata must be JSON-serializable object data.`, {
      path: `${path}.metadata`
    });
  }
}

export function hasGenericMobaHero(heroId: string): boolean {
  const normalizedHeroId = heroId.trim();

  return GENERIC_MOBA_HEROES.some((hero) => hero.id === normalizedHeroId);
}

export function validateGenericMobaHero(hero: unknown): DraftValidationResult {
  const issues: DraftValidationIssue[] = [];

  if (!isRecord(hero)) {
    return {
      valid: false,
      reason: "Generic MOBA hero must be an object.",
      issues: [
        {
          code: "generic-moba-hero-required-object",
          message: "Generic MOBA hero must be an object."
        }
      ]
    };
  }

  if (typeof hero.id !== "string" || hero.id.trim().length === 0) {
    addIssue(issues, "generic-moba-hero-id-required", "hero.id must be a non-empty string.", {
      path: "hero.id"
    });
  }

  if (hero.gameCode !== GENERIC_MOBA_GAME_CODE) {
    addIssue(issues, "generic-moba-hero-game-code-mismatch", "hero.gameCode must be generic-moba.", {
      path: "hero.gameCode",
      expectedGameCode: GENERIC_MOBA_GAME_CODE
    });
  }

  if (typeof hero.displayName !== "string" || hero.displayName.trim().length === 0) {
    addIssue(issues, "generic-moba-hero-display-name-required", "hero.displayName must be a non-empty string.", {
      path: "hero.displayName"
    });
  }

  if (hero.localizedNames !== undefined) {
    if (!isRecord(hero.localizedNames)) {
      addIssue(issues, "generic-moba-localized-names-invalid", "hero.localizedNames must be a string map.", {
        path: "hero.localizedNames"
      });
    } else {
      Object.entries(hero.localizedNames).forEach(([locale, displayName]) => {
        if (typeof displayName !== "string" || displayName.trim().length === 0) {
          addIssue(issues, "generic-moba-localized-name-invalid", "Localized hero names must be non-empty strings.", {
            path: `hero.localizedNames.${locale}`
          });
        }
      });
    }
  }

  if (hero.roleTags !== undefined) {
    if (!Array.isArray(hero.roleTags)) {
      addIssue(issues, "generic-moba-role-tags-invalid", "hero.roleTags must be an array of strings.", {
        path: "hero.roleTags"
      });
    } else {
      hero.roleTags.forEach((roleTag, index) => {
        if (typeof roleTag !== "string" || roleTag.trim().length === 0) {
          addIssue(issues, "generic-moba-role-tag-invalid", "hero.roleTags entries must be non-empty strings.", {
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

export function validateGenericMobaRulesetCompatibility(ruleset: unknown): DraftValidationResult {
  const baseValidation = validateDraftRuleset(ruleset);
  const issues = [...(baseValidation.issues ?? [])];

  if (!isRecord(ruleset)) {
    return baseValidation;
  }

  if (ruleset.gameCode !== GENERIC_MOBA_GAME_CODE) {
    addIssue(issues, "generic-moba-ruleset-game-code-mismatch", "ruleset.gameCode must be generic-moba.", {
      path: "ruleset.gameCode",
      expectedGameCode: GENERIC_MOBA_GAME_CODE
    });
  }

  if (Array.isArray(ruleset.phases)) {
    ruleset.phases.forEach((phase, phaseIndex) => {
      if (!isRecord(phase)) {
        return;
      }

      if (
        typeof phase.type === "string" &&
        !(GENERIC_MOBA_SUPPORTED_PHASE_TYPES as readonly string[]).includes(phase.type)
      ) {
        addIssue(
          issues,
          "generic-moba-ruleset-phase-unsupported",
          "Generic MOBA v0.1 rulesets support BAN and PICK phases only.",
          { path: `ruleset.phases[${phaseIndex}].type`, phaseType: phase.type }
        );
      }
    });
  }

  return toResult(issues);
}

export function validateGenericMobaDraftAction(
  state: DraftState,
  action: DraftAction
): DraftValidationResult {
  const issues: DraftValidationIssue[] = [];

  if (state.gameCode !== GENERIC_MOBA_GAME_CODE) {
    addIssue(issues, "generic-moba-state-game-code-mismatch", "Draft state gameCode must be generic-moba.", {
      stateGameCode: state.gameCode,
      expectedGameCode: GENERIC_MOBA_GAME_CODE
    });
  }

  if ((action.type === "BAN" || action.type === "PICK") && action.team !== "BLUE" && action.team !== "RED") {
    addIssue(
      issues,
      "generic-moba-action-team-invalid",
      "Generic MOBA BAN/PICK actions must use BLUE or RED team side.",
      { actionId: action.id, team: action.team }
    );
  }

  if ((action.status === "HOVER" || action.status === "LOCKED") && !action.heroId) {
    addIssue(
      issues,
      "generic-moba-action-hero-required",
      "Generic MOBA hovered or locked actions require a heroId.",
      { actionId: action.id, status: action.status }
    );
  }

  if (action.heroId && !hasGenericMobaHero(action.heroId)) {
    addIssue(issues, "generic-moba-action-hero-unknown", "Generic MOBA action references an unknown hero.", {
      actionId: action.id,
      heroId: action.heroId
    });
  }

  return toResult(issues);
}

export function assertGenericMobaHero(hero: Hero): Hero {
  const result = validateGenericMobaHero(hero);

  if (!result.valid) {
    throw new Error(result.reason ?? "Generic MOBA hero validation failed.");
  }

  return hero;
}
