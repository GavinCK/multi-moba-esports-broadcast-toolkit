function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isJsonValue(
  value: unknown,
  seen: ReadonlySet<object> = new Set<object>()
): boolean {
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
