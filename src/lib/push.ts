// RF41, #77: native push through the Expo push service (APNs and FCM credentials live in the EAS project,
// never here). No Next imports. Never throws: a failed push must not lose the in-app notice (RF38).

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export type PushMessage = { to: string; title: string; body: string; data?: Record<string, string>; sound?: "default" };

/** Expo tokens look like ExponentPushToken[xxxx] (or the newer ExpoPushToken[xxxx]). */
export function isExpoPushToken(token: unknown): token is string {
  return typeof token === "string" && /^Expo(nent)?PushToken\[[A-Za-z0-9_-]{10,}\]$/.test(token);
}

export function parsePushTokenBody(raw: unknown): { token: string; platform: "ios" | "android" } | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  if (!isExpoPushToken(b.token)) return null;
  if (b.platform !== "ios" && b.platform !== "android") return null;
  return { token: b.token, platform: b.platform };
}

/** One message per token; the Expo service takes up to 100 messages per request. */
export function buildPushMessages(tokens: string[], title: string, body: string, href?: string | null): PushMessage[] {
  return tokens.filter(isExpoPushToken).map((to) => ({ to, title, body: body.slice(0, 240), sound: "default" as const, ...(href ? { data: { href } } : {}) }));
}

/** Tokens the Expo service reports as DeviceNotRegistered: the app was removed, so we drop them. */
export function deadTokens(messages: PushMessage[], tickets: unknown): string[] {
  if (!Array.isArray(tickets)) return [];
  return tickets.flatMap((t, i) => (t?.status === "error" && t?.details?.error === "DeviceNotRegistered" && messages[i] ? [messages[i].to] : []));
}

export type PushResult = { sent: number; dead: string[] };

export async function sendPush(messages: PushMessage[], fetchFn: typeof fetch = fetch): Promise<PushResult> {
  if (messages.length === 0) return { sent: 0, dead: [] };
  try {
    const res = await fetchFn(EXPO_PUSH_URL, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(messages.slice(0, 100)),
    });
    if (!res.ok) return { sent: 0, dead: [] };
    const json = (await res.json().catch(() => null)) as { data?: unknown } | null;
    const dead = deadTokens(messages, json?.data);
    return { sent: messages.length - dead.length, dead };
  } catch {
    return { sent: 0, dead: [] };
  }
}
