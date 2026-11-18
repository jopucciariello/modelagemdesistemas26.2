// RF06, RF34: the admin refresh of the connector is best effort and only reaches the configured origin.
import { describe, expect, it, vi } from "vitest";
import { CONNECTOR_BACKFILL_DAYS, connectorAdminRefresh } from "@/lib/connector/client";

const admin = { url: "https://strava.example.com", apiKey: "admin-key" };
const now = new Date("2026-11-18T00:00:00Z");

describe("connectorAdminRefresh", () => {
  it("calls /admin/sync then /admin/backfill with the window", async () => {
    const fetchFn = vi.fn(async () => new Response("{}", { status: 200 }));
    expect(await connectorAdminRefresh("https://strava.example.com", admin, now, fetchFn as unknown as typeof fetch)).toBe(true);
    const calls = fetchFn.mock.calls as unknown as [string, RequestInit][];
    expect(calls.map((c) => c[0])).toEqual(["https://strava.example.com/admin/sync", "https://strava.example.com/admin/backfill"]);
    const since = new Date(now.getTime() - CONNECTOR_BACKFILL_DAYS * 86_400_000).toISOString();
    expect(JSON.parse(String(calls[1][1].body))).toEqual({ since });
  });

  it("never sends the admin key to another origin or when not configured", async () => {
    const fetchFn = vi.fn();
    expect(await connectorAdminRefresh("https://other.example.com", admin, now, fetchFn as unknown as typeof fetch)).toBe(false);
    expect(await connectorAdminRefresh("https://strava.example.com", null, now, fetchFn as unknown as typeof fetch)).toBe(false);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("does not throw when the connector is down", async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error("down");
    });
    expect(await connectorAdminRefresh("https://strava.example.com", admin, now, fetchFn as unknown as typeof fetch)).toBe(false);
  });
});
