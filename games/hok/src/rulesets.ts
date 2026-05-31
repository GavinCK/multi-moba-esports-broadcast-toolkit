import type { DraftRuleset } from "@mmbt/shared-types";

import { HOK_SAMPLE_DATA_SOURCE, HOK_SAMPLE_GAME_CODE } from "./data";

export const HOK_SAMPLE_GLOBAL_BP_RULESET_ID = "hok-sample-global-bp-5v5" as const;

export const HOK_SAMPLE_GLOBAL_BP_RULESET: DraftRuleset = {
  id: HOK_SAMPLE_GLOBAL_BP_RULESET_ID,
  gameCode: HOK_SAMPLE_GAME_CODE,
  name: "HoK Sample Global Ban/Pick 5v5",
  description: "Static local manual HoK-like sample ruleset for v0.1 adapter testing.",
  version: "0.1.0",
  allowDuplicateHeroes: false,
  globalBanAcrossSeries: true,
  globalPickAcrossSeries: true,
  metadata: {
    sampleOnly: true,
    mode: "manual-static",
    dataSource: HOK_SAMPLE_DATA_SOURCE,
    globalSeriesFlagsExposed: true
  },
  phases: [
    { id: "hok-ban-blue-1", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Ban 1", allowHover: true, autoAdvance: true },
    { id: "hok-ban-red-1", type: "BAN", team: "RED", count: 1, timeSeconds: 30, label: "Red Ban 1", allowHover: true, autoAdvance: true },
    { id: "hok-ban-blue-2", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Ban 2", allowHover: true, autoAdvance: true },
    { id: "hok-ban-red-2", type: "BAN", team: "RED", count: 1, timeSeconds: 30, label: "Red Ban 2", allowHover: true, autoAdvance: true },
    { id: "hok-ban-blue-3", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Ban 3", allowHover: true, autoAdvance: true },
    { id: "hok-ban-red-3", type: "BAN", team: "RED", count: 1, timeSeconds: 30, label: "Red Ban 3", allowHover: true, autoAdvance: true },
    { id: "hok-ban-blue-4", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Ban 4", allowHover: true, autoAdvance: true },
    { id: "hok-ban-red-4", type: "BAN", team: "RED", count: 1, timeSeconds: 30, label: "Red Ban 4", allowHover: true, autoAdvance: true },
    { id: "hok-pick-blue-1", type: "PICK", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Pick 1", allowHover: true, autoAdvance: true },
    { id: "hok-pick-red-1-2", type: "PICK", team: "RED", count: 2, timeSeconds: 60, label: "Red Picks 1-2", allowHover: true, autoAdvance: true },
    { id: "hok-pick-blue-2-3", type: "PICK", team: "BLUE", count: 2, timeSeconds: 60, label: "Blue Picks 2-3", allowHover: true, autoAdvance: true },
    { id: "hok-pick-red-3", type: "PICK", team: "RED", count: 1, timeSeconds: 30, label: "Red Pick 3", allowHover: true, autoAdvance: true },
    { id: "hok-pick-red-4", type: "PICK", team: "RED", count: 1, timeSeconds: 30, label: "Red Pick 4", allowHover: true, autoAdvance: true },
    { id: "hok-pick-blue-4-5", type: "PICK", team: "BLUE", count: 2, timeSeconds: 60, label: "Blue Picks 4-5", allowHover: true, autoAdvance: true },
    { id: "hok-pick-red-5", type: "PICK", team: "RED", count: 1, timeSeconds: 30, label: "Red Pick 5", allowHover: true, autoAdvance: true }
  ]
};

export function cloneDraftRuleset(ruleset: DraftRuleset): DraftRuleset {
  return {
    ...ruleset,
    phases: ruleset.phases.map((phase) => ({ ...phase, metadata: phase.metadata ? { ...phase.metadata } : undefined })),
    metadata: ruleset.metadata ? { ...ruleset.metadata } : undefined
  };
}

export function getHokSampleDefaultRulesets(): DraftRuleset[] {
  return [cloneDraftRuleset(HOK_SAMPLE_GLOBAL_BP_RULESET)];
}
