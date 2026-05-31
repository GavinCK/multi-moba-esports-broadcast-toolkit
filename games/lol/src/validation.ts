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
  LOL_SAMPLE_ADAPTER_METADATA,
  LOL_SAMPLE_CHAMPIONS,
  LOL_SAMPLE_DATA_SOURCE,
  LOL_SAMPLE_DISPLAY_NAME,
  LOL_SAMPLE_GAME_CODE
} from "./data";

const LOL_SAMPLE_SUPPORTED_PHASE_TYPES = ["BAN", "PICK"] as const;

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
        reason: "LoL sample adapter validation failed.",
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
    addIssue(issues, "lol-sample-asset-reference-invalid", `${path} must be a local relative asset reference.`, {
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
    addIssue(issues, "lol-sample-metadata-invalid", `${path}.metadata must be JSON-serializable object data.`, {
      path: `${path}.metadata`
    });
  }
}

export function hasLoLSampleChampion(championId: string): boolean {
  const normalizedChampionId = championId.trim();

  return LOL_SAMPLE_CHAMPIONS.some((champion) => champion.id === normalizedChampionId);
}

export function validateLoLSampleAdapterMetadata(
  metadata: unknown = LOL_SAMPLE_ADAPTER_METADATA
): DraftValidationResult {
  const issues: DraftValidationIssue[] = [];

  if (!isRecord(metadata)) {
    return {
      valid: false,
      reason: "LoL sample adapter metadata must be an object.",
      issues: [
        {
          code: "lol-sample-metadata-required-object",
          message: "LoL sample adapter metadata must be an object."
        }
      ]
    };
  }

  if (metadata.gameCode !== LOL_SAMPLE_GAME_CODE) {
    addIssue(issues, "lol-sample-metadata-game-code-mismatch", "metadata.gameCode must be lol.", {
      path: "metadata.gameCode",
      expectedGameCode: LOL_SAMPLE_GAME_CODE
    });
  }

  if (metadata.displayName !== LOL_SAMPLE_DISPLAY_NAME) {
    addIssue(issues, "lol-sample-metadata-display-name-mismatch", "metadata.displayName must label the static sample adapter.", {
      path: "metadata.displayName",
      expectedDisplayName: LOL_SAMPLE_DISPLAY_NAME
    });
  }

  if (metadata.mode !== "static-manual-sample") {
    addIssue(issues, "lol-sample-metadata-mode-invalid", "metadata.mode must be static-manual-sample.", {
      path: "metadata.mode"
    });
  }

  if (metadata.dataSource !== LOL_SAMPLE_DATA_SOURCE) {
    addIssue(issues, "lol-sample-metadata-source-invalid", "metadata.dataSource must identify local static sample data.", {
      path: "metadata.dataSource"
    });
  }

  return toResult(issues);
}

export function validateLoLSampleChampion(champion: unknown): DraftValidationResult {
  const issues: DraftValidationIssue[] = [];

  if (!isRecord(champion)) {
    return {
      valid: false,
      reason: "LoL sample selectable entity must be an object.",
      issues: [
        {
          code: "lol-sample-champion-required-object",
          message: "LoL sample selectable entity must be an object."
        }
      ]
    };
  }

  if (typeof champion.id !== "string" || champion.id.trim().length === 0) {
    addIssue(issues, "lol-sample-champion-id-required", "champion.id must be a non-empty string.", {
      path: "champion.id"
    });
  }

  if (champion.gameCode !== LOL_SAMPLE_GAME_CODE) {
    addIssue(issues, "lol-sample-champion-game-code-mismatch", "champion.gameCode must be lol.", {
      path: "champion.gameCode",
      expectedGameCode: LOL_SAMPLE_GAME_CODE
    });
  }

  if (typeof champion.displayName !== "string" || champion.displayName.trim().length === 0) {
    addIssue(issues, "lol-sample-champion-display-name-required", "champion.displayName must be a non-empty string.", {
      path: "champion.displayName"
    });
  }

  if (champion.localizedNames !== undefined) {
    if (!isRecord(champion.localizedNames)) {
      addIssue(issues, "lol-sample-localized-names-invalid", "champion.localizedNames must be a string map.", {
        path: "champion.localizedNames"
      });
    } else {
      Object.entries(champion.localizedNames).forEach(([locale, displayName]) => {
        if (typeof displayName !== "string" || displayName.trim().length === 0) {
          addIssue(issues, "lol-sample-localized-name-invalid", "Localized names must be non-empty strings.", {
            path: `champion.localizedNames.${locale}`
          });
        }
      });
    }
  }

  if (champion.roleTags !== undefined) {
    if (!Array.isArray(champion.roleTags)) {
      addIssue(issues, "lol-sample-role-tags-invalid", "champion.roleTags must be an array of strings.", {
        path: "champion.roleTags"
      });
    } else {
      champion.roleTags.forEach((roleTag, index) => {
        if (typeof roleTag !== "string" || roleTag.trim().length === 0) {
          addIssue(issues, "lol-sample-role-tag-invalid", "champion.roleTags entries must be non-empty strings.", {
            path: `champion.roleTags[${index}]`
          });
        }
      });
    }
  }

  validateOptionalAssetReference(champion, "iconUrl", "champion.iconUrl", issues);
  validateOptionalAssetReference(champion, "splashUrl", "champion.splashUrl", issues);
  validateOptionalAssetReference(champion, "squareUrl", "champion.squareUrl", issues);
  validateOptionalMetadata(champion, "champion", issues);

  return toResult(issues);
}

export function validateLoLSampleChampions(
  champions: readonly Hero[] = LOL_SAMPLE_CHAMPIONS
): DraftValidationResult {
  const issues: DraftValidationIssue[] = [];
  const championIds = new Set<string>();

  champions.forEach((champion, championIndex) => {
    const validation = validateLoLSampleChampion(champion);

    validation.issues?.forEach((issue) => {
      addIssue(issues, issue.code, issue.message, {
        ...(isRecord(issue.details) ? issue.details : {}),
        path: `champions[${championIndex}]`
      });
    });

    if (championIds.has(champion.id)) {
      addIssue(issues, "lol-sample-champion-id-duplicate", "Champion IDs must be unique within the sample pool.", {
        path: `champions[${championIndex}].id`,
        championId: champion.id
      });
    }

    championIds.add(champion.id);
  });

  if (champions.length === 0) {
    addIssue(issues, "lol-sample-champions-empty", "The LoL sample adapter must expose local selectable entities.", {
      path: "champions"
    });
  }

  return toResult(issues);
}

export function validateLoLSampleRulesetCompatibility(ruleset: unknown): DraftValidationResult {
  const baseValidation = validateDraftRuleset(ruleset);
  const issues = [...(baseValidation.issues ?? [])];

  if (!isRecord(ruleset)) {
    return baseValidation;
  }

  if (ruleset.gameCode !== LOL_SAMPLE_GAME_CODE) {
    addIssue(issues, "lol-sample-ruleset-game-code-mismatch", "ruleset.gameCode must be lol.", {
      path: "ruleset.gameCode",
      expectedGameCode: LOL_SAMPLE_GAME_CODE
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
        !(LOL_SAMPLE_SUPPORTED_PHASE_TYPES as readonly string[]).includes(phase.type)
      ) {
        addIssue(
          issues,
          "lol-sample-ruleset-phase-unsupported",
          "LoL sample v0.1 rulesets support BAN and PICK phases only.",
          { path: `ruleset.phases[${phaseIndex}].type`, phaseType: phase.type }
        );
      }
    });

    if (ruleset.allowDuplicateHeroes === false && requiredSelectionSlots > LOL_SAMPLE_CHAMPIONS.length) {
      addIssue(
        issues,
        "lol-sample-ruleset-pool-too-small",
        "The local sample champion pool must be large enough for the no-duplicate ruleset.",
        {
          requiredSelectionSlots,
          availableChampions: LOL_SAMPLE_CHAMPIONS.length
        }
      );
    }
  }

  return toResult(issues);
}

export function validateLoLSampleDraftAction(
  state: DraftState,
  action: DraftAction
): DraftValidationResult {
  const issues: DraftValidationIssue[] = [];

  if (state.gameCode !== LOL_SAMPLE_GAME_CODE) {
    addIssue(issues, "lol-sample-state-game-code-mismatch", "Draft state gameCode must be lol.", {
      stateGameCode: state.gameCode,
      expectedGameCode: LOL_SAMPLE_GAME_CODE
    });
  }

  if ((action.type === "BAN" || action.type === "PICK") && action.team !== "BLUE" && action.team !== "RED") {
    addIssue(
      issues,
      "lol-sample-action-team-invalid",
      "LoL sample BAN/PICK actions must use BLUE or RED team side.",
      { actionId: action.id, team: action.team }
    );
  }

  if ((action.status === "HOVER" || action.status === "LOCKED") && !action.heroId) {
    addIssue(
      issues,
      "lol-sample-action-champion-required",
      "LoL sample hovered or locked actions require a champion ID.",
      { actionId: action.id, status: action.status }
    );
  }

  if (action.heroId && !hasLoLSampleChampion(action.heroId)) {
    addIssue(issues, "lol-sample-action-champion-unknown", "LoL sample action references an unknown champion.", {
      actionId: action.id,
      championId: action.heroId
    });
  }

  return toResult(issues);
}

export function assertLoLSampleChampion(champion: Hero): Hero {
  const result = validateLoLSampleChampion(champion);

  if (!result.valid) {
    throw new Error(result.reason ?? "LoL sample champion validation failed.");
  }

  return champion;
}
