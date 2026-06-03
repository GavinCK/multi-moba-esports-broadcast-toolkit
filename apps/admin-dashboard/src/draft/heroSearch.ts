import type { Hero, JsonValue } from "@mmbt/shared-types";

const ROMAN_TO_NUMBER = new Map<string, string>([
  ["i", "1"],
  ["ii", "2"],
  ["iii", "3"],
  ["iv", "4"],
  ["v", "5"],
  ["vi", "6"],
  ["vii", "7"],
  ["viii", "8"],
  ["ix", "9"],
  ["x", "10"]
]);

const NUMBER_TO_ROMAN = new Map(Array.from(ROMAN_TO_NUMBER, ([roman, number]) => [number, roman]));

function isStringArray(value: JsonValue | undefined): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function getMetadataString(hero: Hero, key: string): string | null {
  const value = hero.metadata?.[key];

  return typeof value === "string" ? value : null;
}

function replaceWords(
  value: string,
  replacements: Map<string, string>
): string {
  return value
    .split(" ")
    .map((part) => replacements.get(part) ?? part)
    .join(" ");
}

export function normalizeHeroSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['\u2019`´.]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, " ");
}

export function normalizeLiteralHeroSearchText(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

export function createHeroSearchVariants(value: string): string[] {
  const normalized = normalizeHeroSearchText(value);
  const literal = normalizeLiteralHeroSearchText(value);
  const variants = new Set<string>();

  if (literal) {
    variants.add(literal);
    variants.add(literal.replace(/\s+/g, ""));
  }

  if (!normalized) {
    return [...variants].filter((variant) => variant.length > 0);
  }

  variants.add(normalized);
  variants.add(normalized.replace(/\s+/g, ""));
  const withoutAnd = normalized.replace(/\band\b/g, " ").replace(/\s+/g, " ").trim();

  if (withoutAnd) {
    variants.add(withoutAnd);
    variants.add(withoutAnd.replace(/\s+/g, ""));
  }

  const romanAsNumbers = replaceWords(normalized, ROMAN_TO_NUMBER);
  const numbersAsRoman = replaceWords(normalized, NUMBER_TO_ROMAN);

  variants.add(romanAsNumbers);
  variants.add(romanAsNumbers.replace(/\s+/g, ""));
  variants.add(numbersAsRoman);
  variants.add(numbersAsRoman.replace(/\s+/g, ""));

  return [...variants].filter((variant) => variant.length > 0);
}

export function getHeroSearchTextValues(hero: Hero): string[] {
  const aliases = isStringArray(hero.metadata?.searchAliases) ? hero.metadata.searchAliases : [];
  const metadataValues = [
    getMetadataString(hero, "dataDragonId"),
    getMetadataString(hero, "dataDragonKey"),
    getMetadataString(hero, "normalizedKey")
  ].filter((value): value is string => Boolean(value));

  return [
    hero.id,
    hero.displayName,
    ...Object.values(hero.localizedNames ?? {}),
    ...(hero.roleTags ?? []),
    ...aliases,
    ...metadataValues
  ];
}

export function heroMatchesSearch(hero: Hero, query: string): boolean {
  const queryVariants = createHeroSearchVariants(query);

  if (queryVariants.length === 0) {
    return true;
  }

  const heroVariants = getHeroSearchTextValues(hero).flatMap((value) => createHeroSearchVariants(value));

  return queryVariants.some((queryVariant) =>
    heroVariants.some((heroVariant) => heroVariant.includes(queryVariant))
  );
}
