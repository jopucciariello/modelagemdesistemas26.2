// #71, RF26, RF27, #69: request parsing of the workshop API (no database).
import { describe, expect, it } from "vitest";
import { bearerToken } from "@/lib/api/bearer";
import { parseBookBody, parseOrigin } from "@/lib/api/oficinas";

describe("bearerToken", () => {
  const req = (h?: string) => new Request("http://x/", { headers: h ? { authorization: h } : {} });
  it("reads a bearer token", () => expect(bearerToken(req("Bearer abc123"))).toBe("abc123"));
  it("rejects other schemes and a missing header", () => {
    expect(bearerToken(req("Basic abc"))).toBeNull();
    expect(bearerToken(req())).toBeNull();
  });
});

describe("parseBookBody", () => {
  const ok = { workshopId: "w", serviceId: "s", bikeId: "b", startsAt: "2026-11-20T12:00:00.000Z", shareHistory: true };
  it("accepts a valid body and keeps the consent choice", () => {
    expect(parseBookBody(ok)).toMatchObject({ workshopId: "w", shareHistory: true });
    expect(parseBookBody({ ...ok, shareHistory: undefined })?.shareHistory).toBe(false);
  });
  it("rejects invalid bodies", () => {
    expect(parseBookBody(null)).toBeNull();
    expect(parseBookBody({ ...ok, startsAt: "ontem" })).toBeNull();
    expect(parseBookBody({ ...ok, bikeId: "" })).toBeNull();
    expect(parseBookBody({ ...ok, serviceId: 5 })).toBeNull();
  });
});

describe("parseOrigin", () => {
  it("reads lat and lng", () => expect(parseOrigin(new URL("http://x/?lat=-23.5&lng=-46.6"))).toEqual({ latitude: -23.5, longitude: -46.6 }));
  it("is null when missing or out of range", () => {
    expect(parseOrigin(new URL("http://x/"))).toBeNull();
    expect(parseOrigin(new URL("http://x/?lat=99&lng=0"))).toBeNull();
    expect(parseOrigin(new URL("http://x/?lat=abc&lng=0"))).toBeNull();
  });
});
