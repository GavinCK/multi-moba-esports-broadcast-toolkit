import type { DraftRuleset } from "@mmbt/shared-types";

import { LOL_SAMPLE_DATA_SOURCE, LOL_SAMPLE_GAME_CODE } from "./data.js";

export const LOL_SAMPLE_STANDARD_RULESET_ID = "lol-sample-standard-5v5" as const;

export const LOL_SAMPLE_STANDARD_RULESET: DraftRuleset = {
  id: LOL_SAMPLE_STANDARD_RULESET_ID,
  gameCode: LOL_SAMPLE_GAME_CODE,
  name: "LoL Sample Standard 5v5",
  description: "Static local manual sample ruleset for v0.1 adapter testing.",
  version: "0.1.0",
  allowDuplicateHeroes: false,
  globalBanAcrossSeries: false,
  globalPickAcrossSeries: false,
  metadata: {
    sampleOnly: true,
    mode: "manual-static",
    dataSource: LOL_SAMPLE_DATA_SOURCE
  },
  phases: [
    { id: "ban-blue-1", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Ban 1", allowHover: true, autoAdvance: true },
    { id: "ban-red-1", type: "BAN", team: "RED", count: 1, timeSeconds: 30, label: "Red Ban 1", allowHover: true, autoAdvance: true },
    { id: "ban-blue-2", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Ban 2", allowHover: true, autoAdvance: true },
    { id: "ban-red-2", type: "BAN", team: "RED", count: 1, timeSeconds: 30, label: "Red Ban 2", allowHover: true, autoAdvance: true },
    { id: "ban-blue-3", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Ban 3", allowHover: true, autoAdvance: true },
    { id: "ban-red-3", type: "BAN", team: "RED", count: 1, timeSeconds: 30, label: "Red Ban 3", allowHover: true, autoAdvance: true },
    { id: "pick-blue-1", type: "PICK", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Pick 1", allowHover: true, autoAdvance: true },
    { id: "pick-red-1-2", type: "PICK", team: "RED", count: 2, timeSeconds: 30, label: "Red Picks 1-2", allowHover: true, autoAdvance: true },
    { id: "pick-blue-2-3", type: "PICK", team: "BLUE", count: 2, timeSeconds: 30, label: "Blue Picks 2-3", allowHover: true, autoAdvance: true },
    { id: "pick-red-3", type: "PICK", team: "RED", count: 1, timeSeconds: 30, label: "Red Pick 3", allowHover: true, autoAdvance: true },
    { id: "ban-red-4", type: "BAN", team: "RED", count: 1, timeSeconds: 30, label: "Red Ban 4", allowHover: true, autoAdvance: true },
    { id: "ban-blue-4", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Ban 4", allowHover: true, autoAdvance: true },
    { id: "ban-red-5", type: "BAN", team: "RED", count: 1, timeSeconds: 30, label: "Red Ban 5", allowHover: true, autoAdvance: true },
    { id: "ban-blue-5", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Ban 5", allowHover: true, autoAdvance: true },
    { id: "pick-red-4", type: "PICK", team: "RED", count: 1, timeSeconds: 30, label: "Red Pick 4", allowHover: true, autoAdvance: true },
    { id: "pick-blue-4-5", type: "PICK", team: "BLUE", count: 2, timeSeconds: 30, label: "Blue Picks 4-5", allowHover: true, autoAdvance: true },
    { id: "pick-red-5", type: "PICK", team: "RED", count: 1, timeSeconds: 30, label: "Red Pick 5", allowHover: true, autoAdvance: true }
  ]
};

export function cloneDraftRuleset(ruleset: DraftRuleset): DraftRuleset {
  return {
    ...ruleset,
    phases: ruleset.phases.map((phase) => ({ ...phase, metadata: phase.metadata ? { ...phase.metadata } : undefined })),
    metadata: ruleset.metadata ? { ...ruleset.metadata } : undefined
  };
}

export function getLoLSampleDefaultRulesets(): DraftRuleset[] {
  return [cloneDraftRuleset(LOL_SAMPLE_STANDARD_RULESET)];
}
