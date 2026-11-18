// RF38: e-mail copy of notifications through Resend's HTTP API. Needs RESEND_API_KEY and EMAIL_FROM (Infisical);
// without them nothing is sent and the in-app notification stays the only channel.
import "server-only";

export async function sendWithResend(to: string, subject: string, text: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}`);
}
