#!/usr/bin/env node
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..", "..", "..");
const DEFAULT_SOURCE = resolve(SCRIPT_DIRECTORY, "..", "src", "generated-champions.ts");
const DEFAULT_OUTPUT = resolve(
  REPOSITORY_ROOT,
  "event-packages",
  "sample-event",
  "assets",
  "hero-icons",
  "lol"
);
const DATA_DRAGON_CDN_BASE = "https://ddragon.leagueoflegends.com/cdn";
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

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
    "  pnpm --filter @mmbt/game-lol-sample champions:icons",
    "  pnpm --filter @mmbt/game-lol-sample champions:icons -- --force",
    "",
    "Options:",
    "  --source <path>    Generated champion metadata source. Defaults to games/lol/src/generated-champions.ts.",
    "  --output <path>    Icon output folder. Defaults to event-packages/sample-event/assets/hero-icons/lol.",
    "  --version <value>  Override the Data Dragon version recorded in generated metadata.",
    "  --force            Re-download and overwrite existing icon files.",
    "",
    "This is a pre-event/static asset preparation helper only. It is not used by live server startup."
  ].join("\n");
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function hasUsefulExistingFile(path) {
  try {
    const details = await stat(path);

    return details.isFile() && details.size > PNG_SIGNATURE.length;
  } catch {
    return false;
  }
}

function extractFirstMatch(sourceText, pattern, label) {
  const match = sourceText.match(pattern);
  const value = match?.[1]?.trim();

  if (!value) {
    throw new Error(`Could not read ${label} from generated champion metadata.`);
  }

  return value;
}

function extractGeneratedChampionMetadata(sourceText) {
  const version = extractFirstMatch(sourceText, /dataDragonVersion:\s*"([^"]+)"/u, "Data Dragon version");
  const ids = Array.from(sourceText.matchAll(/dataDragonId:\s*"([^"]+)"/gu))
    .map((match) => match[1]?.trim())
    .filter(Boolean);
  const uniqueIds = [...new Set(ids)];

  if (uniqueIds.length < 100) {
    throw new Error(`Refusing to prepare icons for suspiciously small LoL roster with ${uniqueIds.length} IDs.`);
  }

  if (uniqueIds.length !== ids.length) {
    throw new Error("Generated champion metadata contains duplicate Data Dragon IDs.");
  }

  return {
    version,
    championDataIds: uniqueIds
  };
}

function assertPngBytes(bytes, championDataId) {
  const isPng = PNG_SIGNATURE.every((value, index) => bytes[index] === value);

  if (!isPng) {
    throw new Error(`${championDataId}: downloaded file is not a PNG image.`);
  }
}

async function fetchIconBytes(version, championDataId) {
  const url = `${DATA_DRAGON_CDN_BASE}/${encodeURIComponent(version)}/img/champion/${encodeURIComponent(championDataId)}.png`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${championDataId}: request failed ${response.status} ${response.statusText}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  assertPngBytes(bytes, championDataId);

  return bytes;
}

async function prepareIcon({ outputDirectory, version, championDataId, force }) {
  const outputPath = resolve(outputDirectory, `${championDataId}.png`);

  if (!force && (await hasUsefulExistingFile(outputPath))) {
    return { status: "skipped", championDataId, outputPath };
  }

  const bytes = await fetchIconBytes(version, championDataId);
  await writeFile(outputPath, bytes);

  return { status: "downloaded", championDataId, outputPath };
}

async function main() {
  if (hasArg("--help") || hasArg("-h")) {
    console.log(usage());
    return;
  }

  const source = resolve(readArg("--source") ?? DEFAULT_SOURCE);
  const outputDirectory = resolve(readArg("--output") ?? DEFAULT_OUTPUT);
  const force = hasArg("--force");

  if (!(await fileExists(source))) {
    throw new Error(`Generated champion metadata was not found: ${source}`);
  }

  const sourceText = await readFile(source, "utf8");
  const metadata = extractGeneratedChampionMetadata(sourceText);
  const version = readArg("--version") ?? metadata.version;
  const summary = {
    expected: metadata.championDataIds.length,
    downloaded: 0,
    skippedExisting: 0,
    failed: []
  };

  await mkdir(outputDirectory, { recursive: true });

  for (const championDataId of metadata.championDataIds) {
    try {
      const result = await prepareIcon({
        outputDirectory,
        version,
        championDataId,
        force
      });

      if (result.status === "downloaded") {
        summary.downloaded += 1;
      } else {
        summary.skippedExisting += 1;
      }
    } catch (error) {
      summary.failed.push({
        championDataId,
        reason: error instanceof Error ? error.message : String(error)
      });
    }
  }

  console.log(`Expected icon count: ${summary.expected}`);
  console.log(`Downloaded count: ${summary.downloaded}`);
  console.log(`Skipped existing count: ${summary.skippedExisting}`);
  console.log(`Failed count: ${summary.failed.length}`);
  console.log(`Output folder: ${outputDirectory}`);
  console.log(`Data Dragon version: ${version}`);

  if (summary.failed.length > 0) {
    console.error("Failed icons:");
    summary.failed.forEach((failure) => {
      console.error(`- ${failure.championDataId}: ${failure.reason}`);
    });
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
