import { describe, expect, it } from "vitest";
import * as workspaceExports from "./index";

describe("workspace baseline", () => {
  it("keeps a skeleton marker export available", () => {
    const hasSkeletonMarker = Object.values(workspaceExports).some((value) => {
      const marker = value as { status?: unknown };

      return marker.status === "skeleton";
    });

    expect(hasSkeletonMarker).toBe(true);
  });
});
