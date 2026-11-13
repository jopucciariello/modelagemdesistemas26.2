// RF04, RF32-RF34, ADR-005, ADR-006: Google role assignment and the connector safety rules.
import { describe, expect, it, vi } from "vitest";
import { roleForEmail } from "@/lib/google/oidc";
import { ConnectorError, connectorActivitiesPath, connectorGet } from "@/lib/connector/client";
import { ConnectorUrlError, isPrivateAddress, validateConnectorUrl } from "@/lib/connector/url";
import { safeReturnPath } from "@/lib/redirects";

const publicResolver = async () => ["203.0.113.10"];
const codeOf = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return (e as ConnectorUrlError | ConnectorError).code;
  }
  return "no-error";
};

describe("RF04 / ADR-005: role from Google e-mail", () => {
  it("makes listed e-mails admin (case-insensitive) and every other verified e-mail an athlete", () => {
    expect(roleForEmail("Admin@Example.com", "admin@example.com, x@y.com")).toBe("ADMIN");
    expect(roleForEmail("someone@gmail.com", "admin@example.com")).toBe("ATHLETE");
    expect(roleForEmail("someone@gmail.com", "")).toBe("ATHLETE");
  });
  it("only returns to known same-site paths", () => {
    expect(safeReturnPath("/admin")).toBe("/admin");
    expect(safeReturnPath("/fonte")).toBe("/fonte");
    expect(safeReturnPath("https://evil.example")).toBe("/");
    expect(safeReturnPath("//evil.example")).toBe("/");
    expect(safeReturnPath(null)).toBe("/");
  });
});

describe("RF34 / ADR-006: connector URL (SSRF)", () => {
  it("accepts an https URL and strips trailing slashes", async () => {
    expect(await validateConnectorUrl("https://strava.example.com/", publicResolver)).toBe("https://strava.example.com");
  });
  it("rejects http, credentials, localhost and private literals", async () => {
    expect(await codeOf(validateConnectorUrl("http://strava.example.com", publicResolver))).toBe("not_https");
    expect(await codeOf(validateConnectorUrl("https://u:p@strava.example.com", publicResolver))).toBe("invalid_url");
    expect(await codeOf(validateConnectorUrl("https://localhost", publicResolver))).toBe("private_address");
    expect(await codeOf(validateConnectorUrl("https://127.0.0.1", publicResolver))).toBe("private_address");
    expect(await codeOf(validateConnectorUrl("https://169.254.169.254/latest", publicResolver))).toBe("private_address");
    expect(await codeOf(validateConnectorUrl("https://[::1]/", publicResolver))).toBe("private_address");
    expect(await codeOf(validateConnectorUrl("not a url", publicResolver))).toBe("invalid_url");
  });
  it("rejects a public name that resolves to a private address", async () => {
    expect(await codeOf(validateConnectorUrl("https://evil.example.com", async () => ["10.0.0.5"]))).toBe("private_address");
    expect(await codeOf(validateConnectorUrl("https://nx.example.com", async () => []))).toBe("invalid_url");
  });
  it("classifies private ranges", () => {
    for (const a of ["10.1.2.3", "172.16.0.1", "192.168.1.1", "100.64.0.1", "0.0.0.0", "fd00::1", "fe80::1", "::ffff:10.0.0.1"]) {
      expect(isPrivateAddress(a)).toBe(true);
    }
    for (const a of ["8.8.8.8", "172.32.0.1", "203.0.113.10"]) expect(isPrivateAddress(a)).toBe(false);
  });
});

describe("RF34: connector client", () => {
  const ok = (body: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status }));
  it("sends the API key as Bearer and returns the JSON", async () => {
    const fetchFn = ok({ linked: true });
    const data = await connectorGet("https://c.example.com", "KEY", "/v1/gearlog/status", fetchFn as unknown as typeof fetch);
    expect(data).toEqual({ linked: true });
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://c.example.com/v1/gearlog/status");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer KEY");
    expect(init.redirect).toBe("error");
  });
  it("RF06: asks /activities for the whole history with the required since parameter", async () => {
    expect(connectorActivitiesPath()).toBe("/v1/gearlog/activities?since=1970-01-01T00%3A00%3A00.000Z");
    const fetchFn = ok({ activities: [] });
    await connectorGet("https://c.example.com", "KEY", connectorActivitiesPath(), fetchFn as unknown as typeof fetch);
    const [url] = fetchFn.mock.calls[0] as unknown as [string];
    expect(new URL(url).searchParams.get("since")).toBe("1970-01-01T00:00:00.000Z");
  });
  it("maps 401, 5xx, network failure and bad JSON to error codes without leaking the key", async () => {
    const call = (f: unknown) => connectorGet("https://c.example.com", "SECRET-KEY", "/v1/gearlog/bikes", f as typeof fetch);
    expect(await codeOf(call(ok({}, 401)))).toBe("unauthorized");
    expect(await codeOf(call(ok({}, 503)))).toBe("bad_response");
    expect(await codeOf(call(vi.fn(async () => { throw new Error("boom SECRET-KEY"); })))).toBe("unreachable");
    expect(await codeOf(call(vi.fn(async () => new Response("<html>", { status: 200 }))))).toBe("bad_response");
    try {
      await call(vi.fn(async () => { throw new Error("boom SECRET-KEY"); }));
    } catch (e) {
      expect((e as Error).message).not.toContain("SECRET-KEY");
    }
  });
});

describe("RF34: connector status contract", () => {
  it("parses a status and rejects payloads that are not one", async () => {
    const { parseConnectorStatus } = await import("@/lib/connector/types");
    const s = parseConnectorStatus({ linked: true, stravaAthleteId: "9", lastSyncAt: "2026-11-12T16:30:00.000Z", lastError: null, pendingJobs: 0, webhookSubscribed: true });
    expect(s).toMatchObject({ linked: true, stravaAthleteId: "9", pendingJobs: 0, lastError: null });
    expect(parseConnectorStatus({ ok: true })).toBeNull();
    expect(parseConnectorStatus("x")).toBeNull();
    expect(parseConnectorStatus(null)).toBeNull();
  });
});
