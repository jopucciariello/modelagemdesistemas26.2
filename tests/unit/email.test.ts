// RF29, RF38, OPEN-47: Resend sender (no network: fetch is injected).
import { describe, expect, it, vi } from "vitest";
import { emailConfig, sendEmail } from "@/lib/email";

const env = { RESEND_API_KEY: "re_test", EMAIL_FROM: "GearLog <aviso@gearlog.jopucci.com>" };
const msg = { to: ["a@x.com", "b@x.com"], subject: "Oi", text: "Texto" };

describe("emailConfig", () => {
  it("needs both variables", () => {
    expect(emailConfig(env)).toEqual({ apiKey: "re_test", from: env.EMAIL_FROM });
    expect(emailConfig({ RESEND_API_KEY: "x" })).toBeNull();
    expect(emailConfig({})).toBeNull();
  });
});

describe("sendEmail", () => {
  it("sends nothing when not configured", async () => {
    const fetchFn = vi.fn();
    expect(await sendEmail(msg, { env: {}, fetchFn })).toEqual({ sent: false, reason: "not_configured" });
    expect(fetchFn).not.toHaveBeenCalled();
  });
  it("posts to Resend with the bearer key", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true });
    expect(await sendEmail(msg, { env, fetchFn })).toEqual({ sent: true });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test");
    expect(JSON.parse(init.body)).toMatchObject({ from: env.EMAIL_FROM, to: ["a@x.com", "b@x.com"], subject: "Oi", text: "Texto" });
  });
  it("never throws on API or network failure", async () => {
    expect(await sendEmail(msg, { env, fetchFn: vi.fn().mockResolvedValue({ ok: false }) })).toEqual({ sent: false, reason: "failed" });
    expect(await sendEmail(msg, { env, fetchFn: vi.fn().mockRejectedValue(new Error("x")) })).toEqual({ sent: false, reason: "failed" });
  });
  it("skips empty recipients", async () => {
    expect(await sendEmail({ ...msg, to: [] }, { env, fetchFn: vi.fn() })).toEqual({ sent: false, reason: "not_configured" });
  });
});

import { sendWithResend } from "@/lib/email";

describe("sendWithResend (marketplace compatibility)", () => {
  it("does nothing without configuration", async () => {
    const saved = { k: process.env.RESEND_API_KEY, f: process.env.EMAIL_FROM };
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    await expect(sendWithResend("a@x.com", "s", "t")).resolves.toBeUndefined();
    if (saved.k) process.env.RESEND_API_KEY = saved.k;
    if (saved.f) process.env.EMAIL_FROM = saved.f;
  });
});
