import type {
  DraftAction,
  DraftRuleset,
  DraftState,
  DraftValidationResult,
  Hero
} from "./draft";
import type { GameCode } from "./match";

export type GameAssetType =
  | "HERO_ICON"
  | "HERO_SPLASH"
  | "HERO_SQUARE"
  | "ROLE_ICON"
  | "ITEM_ICON"
  | "SPELL_ICON"
  | "RUNE_ICON";

export interface GameAdapterCapabilities {
  supportsManualDraft: boolean;
  supportsClientReader: boolean;
  supportsIngameHud: boolean;
  supportsPostGameStats: boolean;
  supportsAssetSync: boolean;
  supportsLocalization?: boolean;
  supportsCustomRulesets?: boolean;
}

export interface GameAdapter {
  gameCode: GameCode;
  displayName: string;
  version?: string;
  capabilities: GameAdapterCapabilities;
  loadHeroes(): Promise<Hero[]>;
  loadDefaultRulesets(): Promise<DraftRuleset[]>;
  getHeroById(heroId: string): Hero | null;
  searchHeroes(query: string): Hero[];
  validateDraftAction(
    state: DraftState,
    action: DraftAction
  ): DraftValidationResult;
  getAssetUrl(assetType: GameAssetType, id: string): string | null;
}
