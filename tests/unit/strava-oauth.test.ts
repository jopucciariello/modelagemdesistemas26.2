// RF04: link the Strava account via OAuth 2.0 (docs/integracao-strava.md §2).
import { describe, expect, it, vi } from "vitest";
import {
  buildAuthorizeUrl,
  exchangeCode,
  missingScopes,
  needsRefresh,
  refreshAccessToken,
  REQUIRED_SCOPES,
  StravaOAuthError,
  validateCallback,
} from "@/lib/strava/oauth";

const config = {
  clientId: "12345",
  clientSecret: "test-secret",
  callbackUrl: "http://localhost:3000/auth/strava/callback",
  oauthBaseUrl: "https://www.strava.com/oauth",
};
const ALL_SCOPES = "read,profile:read_all,activity:read_all";

describe("RF04 authorize URL", () => {
  it("points to Strava with client, callback, code flow, scopes and state", () => {
    const url = new URL(buildAuthorizeUrl(config, "state-abc"));
    expect(url.origin + url.pathname).toBe("https://www.strava.com/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("12345");
    expect(url.searchParams.get("redirect_uri")).toBe(config.callbackUrl);
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe(REQUIRED_SCOPES.join(","));
    expect(url.searchParams.get("state")).toBe("state-abc");
  });

  it("never puts the client secret in the URL", () => {
    expect(buildAuthorizeUrl(config, "s")).not.toContain("test-secret");
  });
});

describe("RF04 callback validation", () => {
  const ok = { code: "auth-code", scope: ALL_SCOPES, state: "s1", error: null };

  it("returns the code when state and scopes are valid", () => {
    expect(validateCallback(ok, "s1")).toBe("auth-code");
  });

  it("rejects a state mismatch (CSRF)", () => {
    expect(() => validateCallback(ok, "other")).toThrow(StravaOAuthError);
    expect(() => validateCallback(ok, undefined)).toThrow(/state/);
  });

  it("reports access_denied when the athlete cancels", () => {
    try {
      validateCallback({ ...ok, code: null, error: "access_denied" }, "s1");
      expect.unreachable();
    } catch (e) {
      expect((e as StravaOAuthError).code).toBe("access_denied");
    }
  });

  it("requires all scopes, including activity:read_all", () => {
    expect(missingScopes("read,profile:read_all")).toEqual(["activity:read_all"]);
    expect(missingScopes(null)).toEqual([...REQUIRED_SCOPES]);
    expect(missingScopes(ALL_SCOPES)).toEqual([]);
    expect(() => validateCallback({ ...ok, scope: "read" }, "s1")).toThrow(/scopes/);
  });
});

describe("RF04 token exchange", () => {
  const body = {
    access_token: "acc",
    refresh_token: "ref",
    expires_at: 1_800_000_000,
    athlete: { id: 134815, firstname: "Rafael", lastname: "Silva" },
  };

  it("posts the code to /oauth/token and maps the response", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    const token = await exchangeCode(config, "auth-code", fetchFn);

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://www.strava.com/oauth/token");
    expect(init.method).toBe("POST");
    const sent = new URLSearchParams(init.body);
    expect(sent.get("grant_type")).toBe("authorization_code");
    expect(sent.get("code")).toBe("auth-code");
    expect(sent.get("client_id")).toBe("12345");

    expect(token).toEqual({
      accessToken: "acc",
      refreshToken: "ref",
      expiresAt: new Date(1_800_000_000 * 1000),
      athlete: { id: "134815", firstname: "Rafael", lastname: "Silva" },
    });
  });

  it("refreshes with grant_type=refresh_token", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ...body, athlete: undefined }), { status: 200 }),
    );
    const token = await refreshAccessToken(config, "ref", fetchFn);
    const sent = new URLSearchParams(fetchFn.mock.calls[0][1].body);
    expect(sent.get("grant_type")).toBe("refresh_token");
    expect(sent.get("refresh_token")).toBe("ref");
    expect(token.athlete).toBeNull();
  });

  it("fails without leaking the response body", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('{"message":"Bad Request"}', { status: 400 }));
    await expect(exchangeCode(config, "bad", fetchFn)).rejects.toMatchObject({
      code: "token_exchange_failed",
      message: "Strava token endpoint returned HTTP 400.",
    });
  });
});

describe("RF04 token refresh timing", () => {
  const now = new Date("2026-11-10T12:00:00Z");
  it("refreshes within the margin before expiry", () => {
    expect(needsRefresh(new Date("2026-11-10T12:30:00Z"), now)).toBe(true);
    expect(needsRefresh(new Date("2026-11-10T17:00:00Z"), now)).toBe(false);
  });
});
