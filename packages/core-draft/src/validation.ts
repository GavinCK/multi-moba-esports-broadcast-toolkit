import type {
  DraftActionType,
  DraftPhaseTeam,
  DraftValidationIssue,
  DraftValidationResult,
  JsonObject
} from "@mmbt/shared-types";

import { DRAFT_ACTION_TYPES, DRAFT_PHASE_TEAMS, SUPPORTED_PHASE_TYPES, TEAM_SIDES } from "./constants.js";

function addIssue(
  issues: DraftValidationIssue[],
  code: string,
  message: string,
  details?: JsonObject
): void {
  issues.push({ code, message, details });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJsonValue(value: unknown, seen: ReadonlySet<object> = new Set<object>()): boolean {
  if (value === null) {
    return true;
  }

  if (typeof value === "string" || typeof value === "boolean") {
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

function validateOptionalJsonObject(
  record: Record<string, unknown>,
  field: string,
  path: string,
  issues: DraftValidationIssue[]
): void {
  const value = record[field];

  if (value === undefined) {
    return;
  }

  if (!isRecord(value) || !isJsonValue(value)) {
    addIssue(issues, "draft-invalid-json-object", `${path} must be JSON-serializable object data.`, {
      path
    });
  }
}

function validateOptionalBoolean(
  record: Record<string, unknown>,
  field: string,
  path: string,
  issues: DraftValidationIssue[]
): void {
  const value = record[field];

  if (value !== undefined && typeof value !== "boolean") {
    addIssue(issues, "draft-invalid-boolean", `${path} must be a boolean when provided.`, { path });
  }
}

function validateRequiredString(
  record: Record<string, unknown>,
  field: string,
  path: string,
  issues: DraftValidationIssue[]
): string | undefined {
  const value = record[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    addIssue(issues, "draft-required-string", `${path} must be a non-empty string.`, { path });
    return undefined;
  }

  return value;
}

function validateRequiredBoolean(
  record: Record<string, unknown>,
  field: string,
  path: string,
  issues: DraftValidationIssue[]
): void {
  if (typeof record[field] !== "boolean") {
    addIssue(issues, "draft-required-boolean", `${path} must be a boolean.`, { path });
  }
}

function validatePhaseType(value: unknown, path: string, issues: DraftValidationIssue[]): DraftActionType | undefined {
  if (typeof value !== "string" || !DRAFT_ACTION_TYPES.includes(value as DraftActionType)) {
    addIssue(issues, "draft-invalid-phase-type", `${path} must be a supported draft action type.`, { path });
    return undefined;
  }

  const phaseType = value as DraftActionType;

  if (!(SUPPORTED_PHASE_TYPES as readonly string[]).includes(phaseType)) {
    addIssue(issues, "draft-unsupported-phase-type", `${path} ${phaseType} is reserved for a later task.`, {
      path,
      phaseType
    });
  }

  return phaseType;
}

function validatePhaseTeam(value: unknown, phaseType: DraftActionType | undefined, path: string, issues: DraftValidationIssue[]): DraftPhaseTeam | undefined {
  if (typeof value !== "string" || !DRAFT_PHASE_TEAMS.includes(value as DraftPhaseTeam)) {
    addIssue(issues, "draft-invalid-phase-team", `${path} must be a supported draft phase team.`, { path });
    return undefined;
  }

  const phaseTeam = value as DraftPhaseTeam;

  if (phaseTeam === "AUTO") {
    addIssue(issues, "draft-unsupported-auto-team", `${path} AUTO is reserved for a later task.`, { path });
    return phaseTeam;
  }

  if ((phaseType === "BAN" || phaseType === "PICK") && !(TEAM_SIDES as readonly string[]).includes(phaseTeam)) {
    addIssue(issues, "draft-invalid-phase-team", `${path} must be a concrete team side for BAN/PICK phases.`, {
      path,
      phaseType,
      phaseTeam
    });
  }

  if (phaseType === "BREAK" && phaseTeam !== "NONE") {
    addIssue(issues, "draft-invalid-phase-team", `${path} must be NONE for BREAK phases.`, {
      path,
      phaseType,
      phaseTeam
    });
  }

  return phaseTeam;
}

export function validateDraftRuleset(ruleset: unknown): DraftValidationResult {
  const issues: DraftValidationIssue[] = [];

  if (!isRecord(ruleset)) {
    return {
      valid: false,
      reason: "Draft ruleset must be an object.",
      issues: [
        {
          code: "draft-ruleset-required-object",
          message: "Draft ruleset must be an object."
        }
      ]
    };
  }

  validateRequiredString(ruleset, "id", "ruleset.id", issues);
  validateRequiredString(ruleset, "gameCode", "ruleset.gameCode", issues);
  validateRequiredString(ruleset, "name", "ruleset.name", issues);
  validateRequiredBoolean(ruleset, "allowDuplicateHeroes", "ruleset.allowDuplicateHeroes", issues);
  validateRequiredBoolean(ruleset, "globalBanAcrossSeries", "ruleset.globalBanAcrossSeries", issues);
  validateRequiredBoolean(ruleset, "globalPickAcrossSeries", "ruleset.globalPickAcrossSeries", issues);
  validateOptionalJsonObject(ruleset, "metadata", "ruleset.metadata", issues);

  if (!Array.isArray(ruleset.phases)) {
    addIssue(issues, "draft-phases-required-array", "ruleset.phases must be a non-empty array.", {
      path: "ruleset.phases"
    });
  } else if (ruleset.phases.length === 0) {
    addIssue(issues, "draft-phases-empty", "ruleset.phases must contain at least one phase.", {
      path: "ruleset.phases"
    });
  } else {
    const phaseIds = new Set<string>();

    ruleset.phases.forEach((phase, phaseIndex) => {
      const phasePath = `ruleset.phases[${phaseIndex}]`;

      if (!isRecord(phase)) {
        addIssue(issues, "draft-phase-required-object", `${phasePath} must be an object.`, {
          path: phasePath
        });
        return;
      }

      const phaseId = validateRequiredString(phase, "id", `${phasePath}.id`, issues);

      if (phaseId) {
        if (phaseIds.has(phaseId)) {
          addIssue(issues, "draft-phase-id-duplicate", `${phasePath}.id duplicates phase id "${phaseId}".`, {
            path: `${phasePath}.id`,
            phaseId
          });
        }

        phaseIds.add(phaseId);
      }

      const phaseType = validatePhaseType(phase.type, `${phasePath}.type`, issues);
      validatePhaseTeam(phase.team, phaseType, `${phasePath}.team`, issues);

      if (!Number.isInteger(phase.count) || (phase.count as number) < 1) {
        addIssue(issues, "draft-phase-count-invalid", `${phasePath}.count must be a positive integer.`, {
          path: `${phasePath}.count`
        });
      }

      if (!Number.isInteger(phase.timeSeconds) || (phase.timeSeconds as number) < 0) {
        addIssue(issues, "draft-phase-time-invalid", `${phasePath}.timeSeconds must be a non-negative integer.`, {
          path: `${phasePath}.timeSeconds`
        });
      }

      if (phase.label !== undefined && (typeof phase.label !== "string" || phase.label.trim().length === 0)) {
        addIssue(issues, "draft-phase-label-invalid", `${phasePath}.label must be a non-empty string when provided.`, {
          path: `${phasePath}.label`
        });
      }

      validateOptionalBoolean(phase, "allowHover", `${phasePath}.allowHover`, issues);
      validateOptionalBoolean(phase, "autoAdvance", `${phasePath}.autoAdvance`, issues);
      validateOptionalJsonObject(phase, "metadata", `${phasePath}.metadata`, issues);
    });
  }

  if (issues.length > 0) {
    return {
      valid: false,
      reason: "Draft ruleset failed validation.",
      issues
    };
  }

  return {
    valid: true
  };
}
