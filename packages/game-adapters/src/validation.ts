import type {
  DraftValidationIssue,
  DraftValidationResult,
  GameAdapterCapabilities,
  JsonObject
} from "@mmbt/shared-types";

const REQUIRED_CAPABILITY_FLAGS = [
  "supportsManualDraft",
  "supportsClientReader",
  "supportsIngameHud",
  "supportsPostGameStats",
  "supportsAssetSync"
] as const satisfies readonly (keyof GameAdapterCapabilities)[];

const REQUIRED_ADAPTER_METHODS = [
  "loadHeroes",
  "loadDefaultRulesets",
  "getHeroById",
  "searchHeroes",
  "validateDraftAction",
  "getAssetUrl"
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
        reason: "Game adapter failed validation.",
        issues: [...issues]
      };
}

export function validateGameAdapter(adapter: unknown): DraftValidationResult {
  const issues: DraftValidationIssue[] = [];

  if (!isRecord(adapter)) {
    return {
      valid: false,
      reason: "Game adapter must be an object.",
      issues: [
        {
          code: "adapter-required-object",
          message: "Game adapter must be an object."
        }
      ]
    };
  }

  if (typeof adapter.gameCode !== "string" || adapter.gameCode.trim().length === 0) {
    addIssue(issues, "adapter-game-code-required", "adapter.gameCode must be a non-empty string.", {
      path: "adapter.gameCode"
    });
  }

  if (typeof adapter.displayName !== "string" || adapter.displayName.trim().length === 0) {
    addIssue(issues, "adapter-display-name-required", "adapter.displayName must be a non-empty string.", {
      path: "adapter.displayName"
    });
  }

  if (adapter.version !== undefined && (typeof adapter.version !== "string" || adapter.version.trim().length === 0)) {
    addIssue(issues, "adapter-version-invalid", "adapter.version must be a non-empty string when provided.", {
      path: "adapter.version"
    });
  }

  const capabilities = adapter.capabilities;

  if (!isRecord(capabilities)) {
    addIssue(issues, "adapter-capabilities-required", "adapter.capabilities must be an object.", {
      path: "adapter.capabilities"
    });
  } else {
    REQUIRED_CAPABILITY_FLAGS.forEach((flag) => {
      if (typeof capabilities[flag] !== "boolean") {
        addIssue(
          issues,
          "adapter-capability-invalid",
          `adapter.capabilities.${flag} must be a boolean.`,
          { path: `adapter.capabilities.${flag}` }
        );
      }
    });
  }

  REQUIRED_ADAPTER_METHODS.forEach((methodName) => {
    if (typeof adapter[methodName] !== "function") {
      addIssue(issues, "adapter-method-required", `adapter.${methodName} must be a function.`, {
        path: `adapter.${methodName}`
      });
    }
  });

  return toResult(issues);
}
