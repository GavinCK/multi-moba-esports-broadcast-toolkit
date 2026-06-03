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

  it("posts JSON bodies through the documented ApiResponse envelope", async () => {
    const requests: Array<{ path: string; init: RequestInit | undefined }> = [];
    const client = createDashboardApiClient({
      fetchFn: async (path, init) => {
        requests.push({ path: String(path), init });

        return new Response(
          JSON.stringify({
            ok: true,
            data: {
              accepted: true
            }
          }),
          { status: 200 }
        );
      }
    });

    await expect(
      client.post<{ accepted: boolean }>("/api/drafts/draft_001/start", {
        operatorId: "draft-operator"
      })
    ).resolves.toEqual({ accepted: true });

    expect(requests).toHaveLength(1);
    expect(requests[0]?.path).toBe("/api/drafts/draft_001/start");
    expect(requests[0]?.init?.method).toBe("POST");
    expect(requests[0]?.init?.body).toBe(JSON.stringify({ operatorId: "draft-operator" }));
  });

  it("patches JSON bodies through the documented ApiResponse envelope", async () => {
    const requests: Array<{ path: string; init: RequestInit | undefined }> = [];
    const client = createDashboardApiClient({
      fetchFn: async (path, init) => {
        requests.push({ path: String(path), init });

        return new Response(
          JSON.stringify({
            ok: true,
            data: {
              accepted: true
            }
          }),
          { status: 200 }
        );
      }
    });

    await expect(
      client.patch<{ accepted: boolean }>("/api/matches/match_001/presentation", {
        matchLabel: "Grand Final"
      })
    ).resolves.toEqual({ accepted: true });

    expect(requests).toHaveLength(1);
    expect(requests[0]?.path).toBe("/api/matches/match_001/presentation");
    expect(requests[0]?.init?.method).toBe("PATCH");
    expect(requests[0]?.init?.body).toBe(JSON.stringify({ matchLabel: "Grand Final" }));
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
