// RF04: link the athlete's Strava account via OAuth 2.0.
// Contract: docs/integracao-strava.md §2. Pure functions; `fetch` is injectable for tests.

export const REQUIRED_SCOPES = ["read", "profile:read_all", "activity:read_all"] as const;

export interface StravaOAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  oauthBaseUrl: string;
}

export interface StravaTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  athlete: { id: string; firstname: string; lastname: string } | null;
}

export class StravaOAuthError extends Error {
  constructor(
    message: string,
    readonly code: "access_denied" | "missing_scope" | "invalid_state" | "token_exchange_failed",
  ) {
    super(message);
    this.name = "StravaOAuthError";
  }
}

export function buildAuthorizeUrl(config: StravaOAuthConfig, state: string): string {
  const url = new URL(`${config.oauthBaseUrl}/authorize`);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.callbackUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("approval_prompt", "auto");
  url.searchParams.set("scope", REQUIRED_SCOPES.join(","));
  url.searchParams.set("state", state);
  return url.toString();
}

/** Strava returns the scopes the athlete actually accepted in the callback `scope` param. */
export function missingScopes(grantedScope: string | null): string[] {
  const granted = new Set((grantedScope ?? "").split(",").map((s) => s.trim()).filter(Boolean));
  return REQUIRED_SCOPES.filter((s) => !granted.has(s));
}

export interface CallbackParams {
  code: string | null;
  scope: string | null;
  state: string | null;
  error: string | null;
}

/** Validates the redirect from Strava and returns the authorization code. */
export function validateCallback(params: CallbackParams, expectedState: string | undefined): string {
  if (!expectedState || params.state !== expectedState) {
    throw new StravaOAuthError("OAuth state mismatch.", "invalid_state");
  }
  if (params.error) {
    throw new StravaOAuthError(`Strava returned error: ${params.error}`, "access_denied");
  }
  const missing = missingScopes(params.scope);
  if (missing.length > 0) {
    throw new StravaOAuthError(`Missing Strava scopes: ${missing.join(", ")}`, "missing_scope");
  }
  if (!params.code) {
    throw new StravaOAuthError("Missing authorization code.", "access_denied");
  }
  return params.code;
}

interface RawTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: { id: number; firstname?: string; lastname?: string };
}

async function postToken(
  config: StravaOAuthConfig,
  body: Record<string, string>,
  fetchFn: typeof fetch,
): Promise<StravaTokenResponse> {
  const response = await fetchFn(`${config.oauthBaseUrl}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      ...body,
    }),
  });
  if (!response.ok) {
    // Never log the response body: it may echo credentials.
    throw new StravaOAuthError(
      `Strava token endpoint returned HTTP ${response.status}.`,
      "token_exchange_failed",
    );
  }
  const raw = (await response.json()) as RawTokenResponse;
  return {
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token,
    expiresAt: new Date(raw.expires_at * 1000),
    athlete: raw.athlete
      ? {
          id: String(raw.athlete.id),
          firstname: raw.athlete.firstname ?? "",
          lastname: raw.athlete.lastname ?? "",
        }
      : null,
  };
}

export function exchangeCode(
  config: StravaOAuthConfig,
  code: string,
  fetchFn: typeof fetch = fetch,
): Promise<StravaTokenResponse> {
  return postToken(config, { code, grant_type: "authorization_code" }, fetchFn);
}

export function refreshAccessToken(
  config: StravaOAuthConfig,
  refreshToken: string,
  fetchFn: typeof fetch = fetch,
): Promise<StravaTokenResponse> {
  return postToken(config, { refresh_token: refreshToken, grant_type: "refresh_token" }, fetchFn);
}

/** Refresh ahead of time: access tokens last ~6 h (docs/integracao-strava.md §2). */
export function needsRefresh(expiresAt: Date, now: Date = new Date(), marginSeconds = 3600): boolean {
  return expiresAt.getTime() - now.getTime() <= marginSeconds * 1000;
}
