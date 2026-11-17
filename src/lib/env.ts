// Reads required configuration from the environment. Secrets never reach the client.
import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. See .env.example.`);
  }
  return value;
}

/**
 * RF04, RF32: the GearLog central Strava app, from Infisical. Null while it is not registered yet,
 * in which case the central option is hidden. Never log these values.
 */
export function stravaCentralApp(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.STRAVA_CLIENT_ID?.trim();
  const clientSecret = process.env.STRAVA_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

/** ADR-006: athletes may use their own app (RF33); callback and base URLs are global. */
export function stravaCallbackUrl(): string {
  return process.env.STRAVA_CALLBACK_URL ?? `${appUrl()}/auth/strava/callback`;
}

export function stravaOauthBaseUrl(): string {
  return process.env.STRAVA_OAUTH_BASE_URL ?? "https://www.strava.com/oauth";
}

export function tokenEncryptionKey(): string {
  return required("TOKEN_ENCRYPTION_KEY");
}

export function appUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

export function googleConfig() {
  return {
    clientId: required("GOOGLE_CLIENT_ID"),
    clientSecret: required("GOOGLE_CLIENT_SECRET"),
    callbackUrl: required("GOOGLE_CALLBACK_URL"),
    authorizeUrl: process.env.GOOGLE_AUTHORIZE_URL ?? "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: process.env.GOOGLE_TOKEN_URL ?? "https://oauth2.googleapis.com/token",
  };
}

/** RB17: raw ADMIN_EMAILS list (comma-separated). Empty means nobody is admin. */
export function adminEmailsSetting(): string {
  return process.env.ADMIN_EMAILS ?? "";
}

/** RF06: base of the Strava API v3 (or a Strava-compatible mock in tests). */
export function stravaApiBaseUrl(): string {
  return process.env.STRAVA_API_BASE_URL ?? "https://www.strava.com/api/v3";
}
