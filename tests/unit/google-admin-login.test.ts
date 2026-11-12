// ADR-002, RB17: admins log in with Google; only allow-listed, verified e-mails get in.
import { describe, expect, it, vi } from "vitest";
import {
  buildGoogleAuthorizeUrl,
  exchangeGoogleCode,
  GoogleLoginError,
  isAuthorizedAdmin,
  parseAdminEmails,
  pkceChallenge,
  validateGoogleCallback,
  verifyIdTokenClaims,
} from "@/lib/google/oidc";

const config = {
  clientId: "client-123.apps.googleusercontent.com",
  clientSecret: "google-secret",
  callbackUrl: "http://localhost:3000/auth/google/callback",
  authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
};
const now = new Date("2026-11-12T12:00:00Z");

function jwt(claims: Record<string, unknown>): string {
  const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${enc({ alg: "RS256" })}.${enc(claims)}.signature`;
}
const validClaims = {
  iss: "https://accounts.google.com",
  aud: config.clientId,
  exp: now.getTime() / 1000 + 3600,
  nonce: "n1",
  sub: "1098",
  email: "Admin@Example.com",
  email_verified: true,
  name: "Beatriz",
};
const codeOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as GoogleLoginError).code;
  }
  return "no-error";
};

describe("ADR-002 Google authorize URL", () => {
  it("uses the code flow with openid email, state, nonce and PKCE S256", () => {
    const url = new URL(buildGoogleAuthorizeUrl(config, { state: "s", nonce: "n", codeVerifier: "v" }));
    expect(url.origin + url.pathname).toBe(config.authorizeUrl);
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toContain("openid");
    expect(url.searchParams.get("scope")).toContain("email");
    expect(url.searchParams.get("state")).toBe("s");
    expect(url.searchParams.get("nonce")).toBe("n");
    expect(url.searchParams.get("code_challenge")).toBe(pkceChallenge("v"));
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.toString()).not.toContain("google-secret");
  });
});

describe("ADR-002 callback", () => {
  it("returns the code for a matching state", () => {
    expect(validateGoogleCallback({ code: "c", state: "s", error: null }, "s")).toBe("c");
  });
  it("rejects state mismatch and cancellation", () => {
    expect(codeOf(() => validateGoogleCallback({ code: "c", state: "x", error: null }, "s"))).toBe("invalid_state");
    expect(codeOf(() => validateGoogleCallback({ code: null, state: "s", error: "access_denied" }, "s"))).toBe(
      "access_denied",
    );
  });
  it("exchanges the code with the PKCE verifier", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id_token: "tok" })));
    await expect(exchangeGoogleCode(config, "c", "verifier", fetchFn)).resolves.toBe("tok");
    const sent = new URLSearchParams(fetchFn.mock.calls[0][1].body);
    expect(sent.get("code_verifier")).toBe("verifier");
    expect(sent.get("grant_type")).toBe("authorization_code");
  });
});

describe("ADR-002 ID token claims", () => {
  const expected = { clientId: config.clientId, nonce: "n1" };
  it("accepts a valid token and normalizes the e-mail", () => {
    expect(verifyIdTokenClaims(jwt(validClaims), expected, now)).toEqual({
      subject: "1098",
      email: "admin@example.com",
      name: "Beatriz",
    });
  });
  it.each([
    ["issuer", { iss: "https://evil.example" }],
    ["audience", { aud: "other-client" }],
    ["expiry", { exp: now.getTime() / 1000 - 1 }],
    ["nonce", { nonce: "other" }],
  ])("rejects a wrong %s", (_label, override) => {
    expect(codeOf(() => verifyIdTokenClaims(jwt({ ...validClaims, ...override }), expected, now))).toBe(
      "invalid_id_token",
    );
  });
  it("rejects an unverified e-mail", () => {
    expect(codeOf(() => verifyIdTokenClaims(jwt({ ...validClaims, email_verified: false }), expected, now))).toBe(
      "email_not_verified",
    );
  });
  it("rejects a malformed token", () => {
    expect(codeOf(() => verifyIdTokenClaims("not-a-jwt", expected, now))).toBe("invalid_id_token");
  });
});

describe("RB17 admin allow-list", () => {
  it("parses comma/space separated, case-insensitive e-mails", () => {
    expect([...parseAdminEmails(" A@x.com, b@Y.com ;c@z.com ")]).toEqual(["a@x.com", "b@y.com", "c@z.com"]);
  });
  it("authorizes only listed e-mails", () => {
    expect(isAuthorizedAdmin("A@X.com", "a@x.com,b@y.com")).toBe(true);
    expect(isAuthorizedAdmin("other@x.com", "a@x.com")).toBe(false);
    expect(isAuthorizedAdmin("a@x.com", "")).toBe(false);
    expect(isAuthorizedAdmin(null, "a@x.com")).toBe(false);
  });
});
