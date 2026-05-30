import { describe, expect, expectTypeOf, it } from "vitest";
import * as workspaceExports from "./index";
import type {
  ApiResponse,
  DraftAction,
  DraftRuleset,
  GameAdapter,
  GameCode,
  GraphicTakeState,
  Hero,
  JsonValue,
  SocketEnvelope,
  ThemeConfig
} from "./index";

type ExamplePayload = {
  message: string;
  ids: string[];
};

describe("shared type contracts", () => {
  it("exports type-only contracts without runtime feature logic", () => {
    expect(Object.keys(workspaceExports)).toEqual([]);
  });

  it("keeps API and socket payloads strongly typed", () => {
    expectTypeOf<ApiResponse<ExamplePayload>["data"]>().toEqualTypeOf<
      ExamplePayload | undefined
    >();
    expectTypeOf<SocketEnvelope<ExamplePayload>["payload"]>().toEqualTypeOf<
      ExamplePayload
    >();
  });

  it("keeps draft and adapter contracts game-agnostic", () => {
    type AdapterHeroes = Awaited<ReturnType<GameAdapter["loadHeroes"]>>;

    expectTypeOf<AdapterHeroes>().toEqualTypeOf<Hero[]>();
    expectTypeOf<DraftRuleset["gameCode"]>().toEqualTypeOf<GameCode>();
    expectTypeOf<DraftAction["heroId"]>().toEqualTypeOf<string | null>();
  });

  it("keeps extensible payload fields JSON-shaped", () => {
    expectTypeOf<GraphicTakeState["previewPayload"]>().toEqualTypeOf<
      JsonValue | null
    >();
    expectTypeOf<ThemeConfig["colors"]["blueTeam"]>().toEqualTypeOf<string>();
  });
});
