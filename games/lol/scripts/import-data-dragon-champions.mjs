#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_PRIMARY_LANGUAGE = "en_US";
const DEFAULT_LOCALIZED_LANGUAGE = "zh_TW";
const DEFAULT_LOCALIZED_LOCALE = "zh-TW";
const DEFAULT_OUTPUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "generated-champions.ts"
);
const DATA_DRAGON_VERSION_URL = "https://ddragon.leagueoflegends.com/api/versions.json";

const LOCALE_BY_DATA_DRAGON_LANGUAGE = new Map([
  ["zh_TW", DEFAULT_LOCALIZED_LOCALE]
]);

function readArg(name) {
  const index = process.argv.indexOf(name);

  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasArg(name) {
  return process.argv.includes(name);
}

function usage() {
  return [
    "Usage:",
    "  pnpm --filter @mmbt/game-lol-sample champions:import",
    "  pnpm --filter @mmbt/game-lol-sample champions:import -- --input-en-us ./en_US/champion.json --input-zh-tw ./zh_TW/champion.json --version 16.11.1",
    "",
    "Options:",
    "  --input <path>                 Legacy alias for --input-en-us.",
    "  --input-en-us <path>           Use a local en_US Data Dragon champion.json file.",
    "  --input-zh-tw <path>           Use a local zh_TW Data Dragon champion.json file.",
    "  --localized-input <path>       Alias for --input-zh-tw.",
    "  --version <value>              Data Dragon version to download or record for local input.",
    "  --language <code>              Primary Data Dragon language code. Defaults to en_US.",
    "  --localized-language <code>    Localized Data Dragon language code. Defaults to zh_TW.",
    "  --localized-locale <code>      Shared Hero localizedNames locale key. Defaults to zh-TW.",
    "  --output <path>                Generated TypeScript file. Defaults to games/lol/src/generated-champions.ts.",
    "",
    "This is a development/pre-event import helper only. Runtime code imports the generated local file."
  ].join("\n");
}

async function readJsonFromPath(path) {
  const text = await readFile(resolve(path), "utf8");

  return JSON.parse(text);
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed ${response.status} ${response.statusText}: ${url}`);
  }

  return response.json();
}

async function resolveLatestVersion() {
  const versions = await fetchJson(DATA_DRAGON_VERSION_URL);

  if (!Array.isArray(versions) || typeof versions[0] !== "string") {
    throw new Error("Data Dragon versions response did not contain a latest version.");
  }

  return versions[0];
}

async function loadChampionPayload({ input, version, language }) {
  return input
    ? readJsonFromPath(input)
    : fetchJson(`https://ddragon.leagueoflegends.com/cdn/${version}/data/${language}/champion.json`);
}

function extractChampionRecords(payload) {
  if (!payload || typeof payload !== "object" || !payload.data || typeof payload.data !== "object") {
    throw new Error("Expected Data Dragon champion.json shape with a data object.");
  }

  return Object.values(payload.data)
    .map((champion) => ({
      dataDragonId: String(champion.id ?? "").trim(),
      riotKey: String(champion.key ?? "").trim(),
      displayName: String(champion.name ?? "").trim(),
      tags: Array.isArray(champion.tags)
        ? champion.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : []
    }))
    .filter((champion) => champion.dataDragonId && champion.riotKey && champion.displayName)
    .sort((first, second) => first.displayName.localeCompare(second.displayName, "en"));
}

function createRecordLookup(records) {
  const byDataDragonId = new Map();
  const byRiotKey = new Map();

  records.forEach((record) => {
    byDataDragonId.set(record.dataDragonId, record);
    byRiotKey.set(record.riotKey, record);
  });

  return { byDataDragonId, byRiotKey };
}

function mergeChampionRecords({ primaryRecords, localizedRecords, localizedLocale }) {
  const localizedLookup = createRecordLookup(localizedRecords);

  return primaryRecords.map((record) => {
    const localizedRecord =
      localizedLookup.byDataDragonId.get(record.dataDragonId) ??
      localizedLookup.byRiotKey.get(record.riotKey);
    const localizedName = localizedRecord?.displayName?.trim();

    return localizedName
      ? {
          ...record,
          localizedNames: {
            [localizedLocale]: localizedName
          }
        }
      : record;
  });
}

function getLocalizedCoverage(records, localizedLocale) {
  return records.filter((record) => {
    const localizedName = record.localizedNames?.[localizedLocale];

    return typeof localizedName === "string" && localizedName.trim().length > 0;
  }).length;
}

function quote(value) {
  return JSON.stringify(value);
}

function renderRecord(record) {
  const localizedNames = record.localizedNames
    ? `, localizedNames: ${quote(record.localizedNames)}`
    : "";

  return `  { dataDragonId: ${quote(record.dataDragonId)}, riotKey: ${quote(record.riotKey)}, displayName: ${quote(record.displayName)}, tags: ${quote(record.tags)}${localizedNames} }`;
}

function renderGeneratedSource({
  records,
  version,
  primaryLanguage,
  localizedLanguage,
  localizedLocale
}) {
  const rows = records
    .map((record) => renderRecord(record))
    .join(",\n");
  const localizedCoverage = getLocalizedCoverage(records, localizedLocale);

  return `export interface LoLGeneratedChampionRecord {
  dataDragonId: string;
  riotKey: string;
  displayName: string;
  tags: readonly string[];
  localizedNames?: Readonly<Record<string, string>>;
}

export const LOL_GENERATED_CHAMPION_SOURCE = Object.freeze({
  dataDragonVersion: ${quote(version)},
  language: ${quote(primaryLanguage)},
  localizedLanguages: ${quote([localizedLanguage])},
  localizedLocales: ${quote({ [localizedLanguage]: localizedLocale })},
  localizedNameCoverage: ${quote({ [localizedLocale]: localizedCoverage })},
  importedAt: ${quote(new Date().toISOString().slice(0, 10))},
  importSource: "Riot Data Dragon champion.json static data",
  localIconPathConvention: "assets/hero-icons/lol/<ChampionDataId>.png",
  localSquarePathConvention: "assets/hero-icons/lol/<ChampionDataId>.png",
  approvedArtworkIncluded: false
});

export const LOL_GENERATED_CHAMPION_RECORDS = [
${rows}
] as const satisfies readonly LoLGeneratedChampionRecord[];
`;
}

async function main() {
  if (hasArg("--help") || hasArg("-h")) {
    console.log(usage());
    return;
  }

  const input = readArg("--input");
  const primaryInput = readArg("--input-en-us") ?? input;
  const localizedInput = readArg("--input-zh-tw") ?? readArg("--localized-input");
  const primaryLanguage = readArg("--language") ?? DEFAULT_PRIMARY_LANGUAGE;
  const localizedLanguage = readArg("--localized-language") ?? DEFAULT_LOCALIZED_LANGUAGE;
  const localizedLocale =
    readArg("--localized-locale") ??
    LOCALE_BY_DATA_DRAGON_LANGUAGE.get(localizedLanguage) ??
    localizedLanguage.replace("_", "-");
  const output = resolve(readArg("--output") ?? DEFAULT_OUTPUT);
  const requestedVersion = readArg("--version");
  const version =
    requestedVersion ?? (primaryInput && localizedInput ? "local-file" : await resolveLatestVersion());
  const primaryPayload = await loadChampionPayload({
    input: primaryInput,
    version,
    language: primaryLanguage
  });
  const localizedPayload = await loadChampionPayload({
    input: localizedInput,
    version,
    language: localizedLanguage
  });
  const primaryRecords = extractChampionRecords(primaryPayload);
  const localizedRecords = extractChampionRecords(localizedPayload);
  const records = mergeChampionRecords({
    primaryRecords,
    localizedRecords,
    localizedLocale
  });

  if (records.length < 100) {
    throw new Error(`Refusing to generate suspiciously small LoL roster with ${records.length} records.`);
  }

  await mkdir(dirname(output), { recursive: true });
  await writeFile(
    output,
    renderGeneratedSource({
      records,
      version,
      primaryLanguage,
      localizedLanguage,
      localizedLocale
    }),
    "utf8"
  );

  console.log(`Generated ${records.length} LoL champions at ${output}`);
  console.log(`Source version: ${version}; language: ${primaryLanguage}`);
  console.log(
    `Localized names: ${getLocalizedCoverage(records, localizedLocale)}/${records.length} ${localizedLocale} from ${localizedLanguage}`
  );
  console.log("Champion artwork was not downloaded. Place approved local icons under assets/hero-icons/lol/.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
