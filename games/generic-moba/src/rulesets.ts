import type { DraftRuleset } from "@mmbt/shared-types";

import { GENERIC_MOBA_GAME_CODE } from "./data.js";

export const GENERIC_MOBA_STANDARD_RULESET_ID = "generic-moba-standard-5v5" as const;

export const GENERIC_MOBA_STANDARD_RULESET: DraftRuleset = {
  id: GENERIC_MOBA_STANDARD_RULESET_ID,
  gameCode: GENERIC_MOBA_GAME_CODE,
  name: "Generic MOBA Standard 5v5",
  description: "Simple generic manual draft for local rehearsal and adapter tests.",
  allowDuplicateHeroes: false,
  globalBanAcrossSeries: false,
  globalPickAcrossSeries: false,
  phases: [
    { id: "ban-1-blue", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Ban 1", allowHover: true, autoAdvance: true },
    { id: "ban-1-red", type: "BAN", team: "RED", count: 1, timeSeconds: 30, label: "Red Ban 1", allowHover: true, autoAdvance: true },
    { id: "ban-2-blue", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Ban 2", allowHover: true, autoAdvance: true },
    { id: "ban-2-red", type: "BAN", team: "RED", count: 1, timeSeconds: 30, label: "Red Ban 2", allowHover: true, autoAdvance: true },
    { id: "ban-3-blue", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Ban 3", allowHover: true, autoAdvance: true },
    { id: "ban-3-red", type: "BAN", team: "RED", count: 1, timeSeconds: 30, label: "Red Ban 3", allowHover: true, autoAdvance: true },
    { id: "pick-1-blue", type: "PICK", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Pick 1", allowHover: true, autoAdvance: true },
    { id: "pick-1-red", type: "PICK", team: "RED", count: 2, timeSeconds: 60, label: "Red Picks 1-2", allowHover: true, autoAdvance: true },
    { id: "pick-2-blue", type: "PICK", team: "BLUE", count: 2, timeSeconds: 60, label: "Blue Picks 2-3", allowHover: true, autoAdvance: true },
    { id: "pick-2-red", type: "PICK", team: "RED", count: 1, timeSeconds: 30, label: "Red Pick 3", allowHover: true, autoAdvance: true },
    { id: "pick-3-red", type: "PICK", team: "RED", count: 1, timeSeconds: 30, label: "Red Pick 4", allowHover: true, autoAdvance: true },
    { id: "pick-3-blue", type: "PICK", team: "BLUE", count: 2, timeSeconds: 60, label: "Blue Picks 4-5", allowHover: true, autoAdvance: true },
    { id: "pick-4-red", type: "PICK", team: "RED", count: 1, timeSeconds: 30, label: "Red Pick 5", allowHover: true, autoAdvance: true }
  ]
};

export function cloneDraftRuleset(ruleset: DraftRuleset): DraftRuleset {
  return {
    ...ruleset,
    phases: ruleset.phases.map((phase) => ({ ...phase })),
    metadata: ruleset.metadata ? { ...ruleset.metadata } : undefined
  };
}

export function getGenericMobaDefaultRulesets(): DraftRuleset[] {
  return [cloneDraftRuleset(GENERIC_MOBA_STANDARD_RULESET)];
}
