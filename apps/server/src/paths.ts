import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export function getRepositoryRoot(): string {
  return resolve(fileURLToPath(new URL("../../../", import.meta.url)));
}

export function getDefaultEventPackagePath(repositoryRoot = getRepositoryRoot()): string {
  return join(repositoryRoot, "event-packages", "sample-event");
}

export function resolveLocalPath(inputPath: string, basePath: string): string {
  return resolve(isAbsolute(inputPath) ? inputPath : join(basePath, inputPath));
}

export function toPortablePath(pathValue: string): string {
  return pathValue.split(sep).join("/");
}

export function toDisplayPath(absolutePath: string, repositoryRoot = getRepositoryRoot()): string {
  const relativePath = relative(repositoryRoot, absolutePath);

  if (relativePath.length > 0 && !relativePath.startsWith("..") && !isAbsolute(relativePath)) {
    return toPortablePath(relativePath);
  }

  return "[external-local-path]";
}
