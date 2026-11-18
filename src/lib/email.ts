// RF29, RF38 (OPEN-47, decided 18/11/2026): single e-mail sender, backed by Resend.
// No Next imports so the Node API can reuse it. RESEND_API_KEY and EMAIL_FROM come from Infisical
// (RNF01); the key is never logged. Without them nothing is sent and the in-app notice remains.

export type EmailMessage = { to: string | string[]; subject: string; text: string };
export type EmailResult = { sent: true } | { sent: false; reason: "not_configured" | "failed" };

export function emailConfig(env: Record<string, string | undefined> = process.env): { apiKey: string; from: string } | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.EMAIL_FROM?.trim();
  return apiKey && from ? { apiKey, from } : null;
}

/** Sends one e-mail through the Resend API. Never throws: callers must not fail because of e-mail. */
export async function sendEmail(
  message: EmailMessage,
  deps: { env?: Record<string, string | undefined>; fetchFn?: typeof fetch } = {},
): Promise<EmailResult> {
  const config = emailConfig(deps.env);
  const recipients = (Array.isArray(message.to) ? message.to : [message.to]).filter(Boolean);
  if (!config || recipients.length === 0) return { sent: false, reason: "not_configured" };
  try {
    const res = await (deps.fetchFn ?? fetch)("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: config.from, to: recipients, subject: message.subject, text: message.text }),
    });
    return res.ok ? { sent: true } : { sent: false, reason: "failed" };
  } catch {
    return { sent: false, reason: "failed" };
  }
}

/**
 * Compatibility with the marketplace alerts (RF22/RF38): same behavior as before, returns nothing
 * when not configured and throws on an API failure. New code should prefer `sendEmail`.
 */
export async function sendWithResend(to: string, subject: string, text: string): Promise<void> {
  const result = await sendEmail({ to, subject, text });
  if (!result.sent && result.reason === "failed") throw new Error("Resend request failed");
}
