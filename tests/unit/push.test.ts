// RF41, #77: Expo push helpers (no network, no database).
import { describe, expect, it, vi } from "vitest";
import { buildPushMessages, deadTokens, isExpoPushToken, parsePushTokenBody, sendPush } from "@/lib/push";

const T1 = "ExponentPushToken[abcdefghij1234567890]";
const T2 = "ExpoPushToken[zzzzzzzzzz9999999999]";

describe("token validation", () => {
  it("accepts Expo tokens only", () => {
    expect(isExpoPushToken(T1)).toBe(true);
    expect(isExpoPushToken(T2)).toBe(true);
    expect(isExpoPushToken("fcm:abc")).toBe(false);
    expect(isExpoPushToken(null)).toBe(false);
    expect(isExpoPushToken("ExponentPushToken[]")).toBe(false);
  });
  it("needs a valid token and a mobile platform", () => {
    expect(parsePushTokenBody({ token: T1, platform: "ios" })).toEqual({ token: T1, platform: "ios" });
    expect(parsePushTokenBody({ token: T1, platform: "web" })).toBeNull();
    expect(parsePushTokenBody({ token: "x", platform: "ios" })).toBeNull();
    expect(parsePushTokenBody(null)).toBeNull();
  });
});

describe("buildPushMessages", () => {
  it("makes one message per valid token, trims the body and carries the link", () => {
    const m = buildPushMessages([T1, "lixo", T2], "GearLog", "x".repeat(300), "/mercado/1");
    expect(m).toHaveLength(2);
    expect(m[0]).toMatchObject({ to: T1, title: "GearLog", data: { href: "/mercado/1" } });
    expect(m[0].body).toHaveLength(240);
    expect(buildPushMessages([T1], "a", "b")[0].data).toBeUndefined();
  });
});

describe("sendPush", () => {
  const msgs = buildPushMessages([T1, T2], "GearLog", "oi");
  it("reports tokens whose device is gone", async () => {
    const tickets = [{ status: "ok" }, { status: "error", details: { error: "DeviceNotRegistered" } }];
    expect(deadTokens(msgs, tickets)).toEqual([T2]);
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({ data: tickets }), { status: 200 }));
    expect(await sendPush(msgs, fetchFn as unknown as typeof fetch)).toEqual({ sent: 1, dead: [T2] });
  });
  it("never throws and sends nothing without messages", async () => {
    expect(await sendPush([])).toEqual({ sent: 0, dead: [] });
    const boom = vi.fn(async () => { throw new Error("rede"); });
    expect(await sendPush(msgs, boom as unknown as typeof fetch)).toEqual({ sent: 0, dead: [] });
    const bad = vi.fn(async () => new Response("x", { status: 500 }));
    expect(await sendPush(msgs, bad as unknown as typeof fetch)).toEqual({ sent: 0, dead: [] });
  });
});
