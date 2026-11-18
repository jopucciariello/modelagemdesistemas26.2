// RF06, RF34: POST /v1/gearlog/sync with the athlete's own key; 202 / 429 / 409 are surfaced, never retried.
import { describe, expect, it, vi } from "vitest";
import { CONNECTOR_SYNC_SINCE_DAYS, connectorRequestSync } from "@/lib/connector/client";
import { refreshMessage } from "@/lib/rides/refresh-message";

const now = new Date("2026-11-18T00:00:00Z");
const run = (res: Response | Error) => {
  const fetchFn = vi.fn(async () => {
    if (res instanceof Error) throw res;
    return res;
  });
  return { fetchFn, result: connectorRequestSync("https://strava.example.com", "athlete-key", now, fetchFn as unknown as typeof fetch) };
};

describe("connectorRequestSync", () => {
  it("posts to /v1/gearlog/sync with the athlete key and a since window", async () => {
    const { fetchFn, result } = run(new Response("{}", { status: 202 }));
    expect(await result).toEqual({ status: "queued" });
    const [url, init] = (fetchFn.mock.calls as unknown as [string, RequestInit][])[0];
    expect(url).toBe("https://strava.example.com/v1/gearlog/sync");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer athlete-key");
    expect(JSON.parse(String(init.body))).toEqual({ since: new Date(now.getTime() - CONNECTOR_SYNC_SINCE_DAYS * 86_400_000).toISOString() });
  });

  it("reports retryAfterSeconds on 429 and calls only once", async () => {
    const { fetchFn, result } = run(new Response(JSON.stringify({ retryAfterSeconds: 1800 }), { status: 429 }));
    expect(await result).toEqual({ status: "rate_limited", retryAfterSeconds: 1800 });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("maps 409 to not_linked and network errors or 5xx to failed", async () => {
    expect(await run(new Response("{}", { status: 409 })).result).toEqual({ status: "not_linked" });
    expect(await run(new Error("down")).result).toEqual({ status: "failed" });
    expect(await run(new Response("", { status: 500 })).result).toEqual({ status: "failed" });
  });
});

describe("refreshMessage", () => {
  it("shows the wait time on a rate limit", () => {
    expect(refreshMessage("rate_limited", 1800)).toContain("em 30 min");
    expect(refreshMessage("limite", null)).toContain("mais tarde");
    expect(refreshMessage(undefined, null)).toBeNull();
  });
});
