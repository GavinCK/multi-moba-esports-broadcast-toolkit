import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sourceRoot = dirname(fileURLToPath(import.meta.url));

function listProductionSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return listProductionSourceFiles(fullPath);
    }

    if (!/\.(ts|tsx)$/.test(entry) || /\.test\.(ts|tsx)$/.test(entry)) {
      return [];
    }

    return [fullPath];
  });
}

function readProductionSource(): string {
  return listProductionSourceFiles(sourceRoot)
    .map((filePath) => readFileSync(filePath, "utf8"))
    .join("\n");
}

describe("overlay source guardrails", () => {
  it("does not call mutation REST endpoints", () => {
    const source = readProductionSource();

    expect(source).not.toMatch(
      /fetch\(.*POST|method:\s*["']POST|axios\.post|\/api\/drafts\/.*\/start|\/api\/drafts\/.*\/pause|\/api\/drafts\/.*\/resume|\/api\/drafts\/.*\/undo|\/api\/drafts\/.*\/redo|\/api\/drafts\/.*\/reset|\/api\/drafts\/.*\/complete|\/api\/drafts\/.*\/actions\/.*\/hover|\/api\/drafts\/.*\/actions\/.*\/lock|\/api\/production\/state|\/api\/production\/preview|\/api\/production\/take|\/api\/production\/clear|\/api\/production\/emergency/
    );
  });

  it("does not emit mutation Socket.IO events", () => {
    const source = readProductionSource();

    expect(source).not.toMatch(
      /emit\([^;\n]*(draft:start|draft:pause|draft:resume|draft:hover|draft:lock|draft:undo|draft:reset|draft:complete|production:set-state|graphics:take|emergency:trigger|emergency:clear)/
    );
  });

  it("does not add forbidden future-scope integrations", () => {
    const source = readProductionSource();

    expect(source).not.toMatch(
      /OBSWebSocket|obs-websocket|vMix|Companion|StreamDeck|Stream Deck|sqlite|prisma|cloudSync|databaseUrl|auth|login|Riot|LCU|Data Dragon|DataDragon|Garena|Tencent|TiMi|autoPick|autoBan|playerAutomation|champion-select|ingame-hud|objective tracker/
    );
  });
});
