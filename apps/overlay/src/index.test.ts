import { describe, expect, it } from "vitest";

import { overlayWorkspace } from "./index";

describe("overlay workspace metadata", () => {
  it("declares TQ-090 route shell coverage as read-only", () => {
    expect(overlayWorkspace.status).toBe("overlay-shell");
    expect(overlayWorkspace.readOnlyBroadcastOutput).toBe(true);
    expect(overlayWorkspace.routes).toEqual([
      "/overlay/program",
      "/overlay/preview",
      "/overlay/draft/:matchId",
      "/overlay/scorebug/:matchId",
      "/overlay/emergency"
    ]);
  });
});
