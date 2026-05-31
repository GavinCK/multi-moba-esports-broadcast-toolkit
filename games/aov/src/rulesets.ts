import type { DraftRuleset } from "@mmbt/shared-types";

import { AOV_SAMPLE_DATA_SOURCE, AOV_SAMPLE_GAME_CODE } from "./data.js";

export const AOV_SAMPLE_STANDARD_RULESET_ID = "aov-sample-standard-5v5" as const;

export const AOV_SAMPLE_STANDARD_RULESET: DraftRuleset = {
  id: AOV_SAMPLE_STANDARD_RULESET_ID,
  gameCode: AOV_SAMPLE_GAME_CODE,
  name: "AOV Sample Standard 5v5",
  description: "Static local manual AOV-like sample ruleset for v0.1 adapter testing.",
  version: "0.1.0",
  allowDuplicateHeroes: false,
  globalBanAcrossSeries: false,
  globalPickAcrossSeries: false,
  metadata: {
    sampleOnly: true,
    mode: "manual-static",
    dataSource: AOV_SAMPLE_DATA_SOURCE
  },
  phases: [
    { id: "aov-ban-blue-1", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Ban 1", allowHover: true, autoAdvance: true },
    { id: "aov-ban-red-1", type: "BAN", team: "RED", count: 1, timeSeconds: 30, label: "Red Ban 1", allowHover: true, autoAdvance: true },
    { id: "aov-ban-blue-2", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Ban 2", allowHover: true, autoAdvance: true },
    { id: "aov-ban-red-2", type: "BAN", team: "RED", count: 1, timeSeconds: 30, label: "Red Ban 2", allowHover: true, autoAdvance: true },
    { id: "aov-pick-blue-1", type: "PICK", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Pick 1", allowHover: true, autoAdvance: true },
    { id: "aov-pick-red-1-2", type: "PICK", team: "RED", count: 2, timeSeconds: 60, label: "Red Picks 1-2", allowHover: true, autoAdvance: true },
    { id: "aov-pick-blue-2-3", type: "PICK", team: "BLUE", count: 2, timeSeconds: 60, label: "Blue Picks 2-3", allowHover: true, autoAdvance: true },
    { id: "aov-pick-red-3", type: "PICK", team: "RED", count: 1, timeSeconds: 30, label: "Red Pick 3", allowHover: true, autoAdvance: true },
    { id: "aov-ban-red-3", type: "BAN", team: "RED", count: 1, timeSeconds: 30, label: "Red Ban 3", allowHover: true, autoAdvance: true },
    { id: "aov-ban-blue-3", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Ban 3", allowHover: true, autoAdvance: true },
    { id: "aov-ban-red-4", type: "BAN", team: "RED", count: 1, timeSeconds: 30, label: "Red Ban 4", allowHover: true, autoAdvance: true },
    { id: "aov-ban-blue-4", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Ban 4", allowHover: true, autoAdvance: true },
    { id: "aov-pick-red-4", type: "PICK", team: "RED", count: 1, timeSeconds: 30, label: "Red Pick 4", allowHover: true, autoAdvance: true },
    { id: "aov-pick-blue-4-5", type: "PICK", team: "BLUE", count: 2, timeSeconds: 60, label: "Blue Picks 4-5", allowHover: true, autoAdvance: true },
    { id: "aov-pick-red-5", type: "PICK", team: "RED", count: 1, timeSeconds: 30, label: "Red Pick 5", allowHover: true, autoAdvance: true }
  ]
};

export function cloneDraftRuleset(ruleset: DraftRuleset): DraftRuleset {
  return {
    ...ruleset,
    phases: ruleset.phases.map((phase) => ({ ...phase, metadata: phase.metadata ? { ...phase.metadata } : undefined })),
    metadata: ruleset.metadata ? { ...ruleset.metadata } : undefined
  };
}

export function getAovSampleDefaultRulesets(): DraftRuleset[] {
  return [cloneDraftRuleset(AOV_SAMPLE_STANDARD_RULESET)];
}
