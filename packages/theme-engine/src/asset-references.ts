import type {
  ResolvedThemeAssetPath,
  ThemeAssetResolutionOptions,
  ThemeEngineResult,
  ThemeValidationIssue
} from "./types.js";

const ASSET_ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;
const ASSET_PATH_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/;
const SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

function errorIssue(
  path: string,
  code: string,
  message: string
): ThemeValidationIssue {
  return {
    path,
    code,
    message,
    severity: "error"
  };
}

function success(value: ResolvedThemeAssetPath): ThemeEngineResult<ResolvedThemeAssetPath> {
  return { ok: true, value };
}

function failure(issue: ThemeValidationIssue): ThemeEngineResult<ResolvedThemeAssetPath> {
  return {
    ok: false,
    error: {
      code: issue.code,
      message: issue.message,
      issues: [issue]
    }
  };
}

function getAssetReferenceKind(reference: string): ResolvedThemeAssetPath["kind"] | undefined {
  if (ASSET_ID_PATTERN.test(reference)) {
    return "asset-id";
  }

  if (reference.startsWith("assets/") && ASSET_PATH_PATTERN.test(reference)) {
    return "local-path";
  }

  return undefined;
}

export function resolveThemeAssetPath(
  assetReference: string,
  options: ThemeAssetResolutionOptions = {}
): ThemeEngineResult<ResolvedThemeAssetPath> {
  const path = options.path ?? "asset";
  const reference = assetReference.trim();

  if (reference.length === 0) {
    return failure(errorIssue(path, "theme-asset-empty", `${path} must be a non-empty local asset reference.`));
  }

  if (
    SCHEME_PATTERN.test(reference) ||
    reference.startsWith("//") ||
    reference.startsWith("/") ||
    reference.startsWith("\\") ||
    reference.startsWith("~")
  ) {
    return failure(
      errorIssue(
        path,
        "theme-asset-external",
        `${path} must be a local event-package asset path or asset ID.`
      )
    );
  }

  if (reference.includes("\\") || reference.includes("?") || reference.includes("#")) {
    return failure(
      errorIssue(
        path,
        "theme-asset-unsafe-character",
        `${path} must use clean forward-slash relative paths or asset IDs.`
      )
    );
  }

  const segments = reference.split("/");
  if (
    segments.some((segment) => segment.length === 0 || segment === "." || segment === "..") ||
    reference.toLowerCase().includes("%2e")
  ) {
    return failure(
      errorIssue(
        path,
        "theme-asset-path-traversal",
        `${path} must not contain path traversal or empty path segments.`
      )
    );
  }

  const kind = getAssetReferenceKind(reference);
  if (!kind) {
    return failure(
      errorIssue(
        path,
        "theme-asset-invalid-format",
        `${path} must be an asset ID or a relative path under assets/.`
      )
    );
  }

  return success({
    reference,
    kind
  });
}

export function isLocalThemeAssetReference(assetReference: string): boolean {
  return resolveThemeAssetPath(assetReference).ok;
}
