// RF04, issue #62: signed OAuth state for the Expo app.
import { describe, expect, it } from "vitest";
import { signAppState, verifyAppState } from "@/lib/strava/app-state";

const KEY = Buffer.alloc(32, 7).toString("base64");
const OTHER = Buffer.alloc(32, 9).toString("base64");

describe("app OAuth state", () => {
  const now = new Date("2026-11-19T12:00:00Z");
  const s = signAppState({ userId: "u1", redirect: "gearlog://configuracoes" }, KEY, now);

  it("round-trips", () => {
    expect(verifyAppState(s, KEY, now)).toEqual({ userId: "u1", redirect: "gearlog://configuracoes" });
  });
  it("rejects another key, tampering and expiry", () => {
    expect(verifyAppState(s, OTHER, now)).toBeNull();
    const [a, body, mac] = s.split(".");
    const forged = Buffer.from(JSON.stringify({ u: "u2", r: "gearlog://x", e: now.getTime() + 1e6 })).toString("base64url");
    expect(verifyAppState(`${a}.${forged}.${mac}`, KEY, now)).toBeNull();
    expect(body).toBeTruthy();
    expect(verifyAppState(s, KEY, new Date(now.getTime() + 11 * 60 * 1000))).toBeNull();
  });
  it("rejects cookie-style states", () => {
    expect(verifyAppState("abc123", KEY, now)).toBeNull();
    expect(verifyAppState(null, KEY, now)).toBeNull();
  });
});
