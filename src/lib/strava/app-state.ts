// RF04, issue #62: OAuth `state` for the Expo app. The app has no cookie session in the browser window,
// so the state itself carries the user and the return deep link, signed (HMAC-SHA256) and short-lived.
import { createHmac, timingSafeEqual } from "node:crypto";

const TTL_MS = 10 * 60 * 1000;

export interface AppState {
  userId: string;
  redirect: string;
}

function sign(body: string, base64Key: string): string {
  return createHmac("sha256", Buffer.from(base64Key, "base64")).update(`strava-app:${body}`).digest("base64url");
}

export function signAppState(s: AppState, base64Key: string, now: Date = new Date()): string {
  const body = Buffer.from(JSON.stringify({ u: s.userId, r: s.redirect, e: now.getTime() + TTL_MS })).toString("base64url");
  return `app.${body}.${sign(body, base64Key)}`;
}

/** Returns the state's content, or null when it is not an app state, was tampered with or expired. */
export function verifyAppState(state: string | null, base64Key: string, now: Date = new Date()): AppState | null {
  const parts = (state ?? "").split(".");
  if (parts.length !== 3 || parts[0] !== "app") return null;
  const [, body, mac] = parts;
  const expected = Buffer.from(sign(body, base64Key));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const raw = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { u?: unknown; r?: unknown; e?: unknown };
    if (typeof raw.u !== "string" || typeof raw.r !== "string" || typeof raw.e !== "number") return null;
    if (raw.e < now.getTime()) return null;
    return { userId: raw.u, redirect: raw.r };
  } catch {
    return null;
  }
}
