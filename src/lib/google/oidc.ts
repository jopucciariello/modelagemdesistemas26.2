// ADR-002: admin login with Google (OpenID Connect, authorization code + PKCE).
// Pure functions; `fetch` and `now` are injectable for tests.
import { createHash } from "node:crypto";

export const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export interface GoogleOidcConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  authorizeUrl: string;
  tokenUrl: string;
}

export interface GoogleIdentity {
  subject: string;
  email: string;
  name: string;
}

export type GoogleLoginErrorCode =
  | "access_denied"
  | "invalid_state"
  | "token_exchange_failed"
  | "invalid_id_token"
  | "email_not_verified"
  | "not_authorized";

export class GoogleLoginError extends Error {
  constructor(message: string, readonly code: GoogleLoginErrorCode) {
    super(message);
    this.name = "GoogleLoginError";
  }
}

export function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function buildGoogleAuthorizeUrl(
  config: GoogleOidcConfig,
  params: { state: string; nonce: string; codeVerifier: string },
): string {
  const url = new URL(config.authorizeUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.callbackUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", params.state);
  url.searchParams.set("nonce", params.nonce);
  url.searchParams.set("code_challenge", pkceChallenge(params.codeVerifier));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export function validateGoogleCallback(
  params: { code: string | null; state: string | null; error: string | null },
  expectedState: string | undefined,
): string {
  if (!expectedState || params.state !== expectedState) {
    throw new GoogleLoginError("OAuth state mismatch.", "invalid_state");
  }
  if (params.error || !params.code) {
    throw new GoogleLoginError("Google login was cancelled.", "access_denied");
  }
  return params.code;
}

function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const parts = jwt.split(".");
  if (parts.length !== 3) throw new GoogleLoginError("Malformed ID token.", "invalid_id_token");
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    throw new GoogleLoginError("Malformed ID token.", "invalid_id_token");
  }
}

/**
 * Validates the ID token claims. The token comes straight from Google's token endpoint over
 * TLS, authenticated with the client secret, so OIDC Core §3.1.3.7 lets us skip the signature
 * check; we still check issuer, audience, expiry, nonce and e-mail verification.
 */
export function verifyIdTokenClaims(
  idToken: string,
  expected: { clientId: string; nonce: string },
  now: Date = new Date(),
): GoogleIdentity {
  const claims = decodeJwtPayload(idToken);
  const fail = (msg: string) => new GoogleLoginError(msg, "invalid_id_token");
  if (!GOOGLE_ISSUERS.includes(String(claims.iss))) throw fail("Unexpected issuer.");
  const aud = claims.aud;
  if (!(aud === expected.clientId || (Array.isArray(aud) && aud.includes(expected.clientId)))) {
    throw fail("Unexpected audience.");
  }
  if (typeof claims.exp !== "number" || claims.exp * 1000 <= now.getTime()) throw fail("Expired ID token.");
  if (claims.nonce !== expected.nonce) throw fail("Nonce mismatch.");
  if (typeof claims.sub !== "string" || typeof claims.email !== "string") throw fail("Missing claims.");
  if (claims.email_verified !== true) {
    throw new GoogleLoginError("Google e-mail is not verified.", "email_not_verified");
  }
  return {
    subject: claims.sub,
    email: claims.email.toLowerCase(),
    name: typeof claims.name === "string" && claims.name ? claims.name : claims.email,
  };
}

export async function exchangeGoogleCode(
  config: GoogleOidcConfig,
  code: string,
  codeVerifier: string,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  const response = await fetchFn(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.callbackUrl,
      grant_type: "authorization_code",
      code,
      code_verifier: codeVerifier,
    }),
  });
  if (!response.ok) {
    throw new GoogleLoginError(`Google token endpoint returned HTTP ${response.status}.`, "token_exchange_failed");
  }
  const body = (await response.json()) as { id_token?: string };
  if (!body.id_token) throw new GoogleLoginError("No ID token in response.", "invalid_id_token");
  return body.id_token;
}

/** RB17: parse ADMIN_EMAILS (comma or whitespace separated, case-insensitive). */
export function parseAdminEmails(setting: string): Set<string> {
  return new Set(
    setting
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAuthorizedAdmin(email: string | null | undefined, setting: string): boolean {
  if (!email) return false;
  return parseAdminEmails(setting).has(email.toLowerCase());
}
