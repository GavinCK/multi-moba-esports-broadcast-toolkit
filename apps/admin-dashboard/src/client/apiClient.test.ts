import { describe, expect, it } from "vitest";

import { createDashboardApiClient, DashboardApiError } from "./apiClient";

describe("createDashboardApiClient", () => {
  it("unwraps successful ApiResponse envelopes", async () => {
    const client = createDashboardApiClient({
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            ok: true,
            data: {
              status: "OK"
            }
          }),
          { status: 200 }
        )
    });

    await expect(client.get<{ status: string }>("/api/health")).resolves.toEqual({
      status: "OK"
    });
  });

  it("throws a typed error for ApiResponse failures", async () => {
    const client = createDashboardApiClient({
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            ok: false,
            error: {
              code: "SERVER_OFFLINE",
              message: "Server is offline."
            }
          }),
          { status: 503 }
        )
    });

    await expect(client.get("/api/state")).rejects.toMatchObject({
      code: "SERVER_OFFLINE",
      message: "Server is offline.",
      status: 503
    } satisfies Partial<DashboardApiError>);
  });

  it("rejects responses that do not use the documented envelope", async () => {
    const client = createDashboardApiClient({
      fetchFn: async () => new Response(JSON.stringify({ status: "OK" }), { status: 200 })
    });

    await expect(client.get("/api/health")).rejects.toMatchObject({
      code: "INVALID_RESPONSE"
    } satisfies Partial<DashboardApiError>);
  });
});
