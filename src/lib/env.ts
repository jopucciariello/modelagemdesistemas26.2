// Reads required configuration from the environment. Secrets never reach the client.
import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. See .env.example.`);
  }
  return value;
}

export function stravaConfig() {
  return {
    clientId: required("STRAVA_CLIENT_ID"),
    clientSecret: required("STRAVA_CLIENT_SECRET"),
    callbackUrl: required("STRAVA_CALLBACK_URL"),
    oauthBaseUrl: process.env.STRAVA_OAUTH_BASE_URL ?? "https://www.strava.com/oauth",
  };
}

export function tokenEncryptionKey(): string {
  return required("TOKEN_ENCRYPTION_KEY");
}

export function appUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}
