// RF06, ADR-011: the admin registers (once) the Strava webhook subscription of the central app.
import { NextResponse } from "next/server";
import { appUrl, stravaCentralApp, tokenEncryptionKey } from "@/lib/env";
import { getCurrentAdmin } from "@/lib/session";
import { webhookVerifyToken } from "@/lib/strava/webhook";

export async function POST() {
  const target = new URL("/admin", appUrl());
  if (!(await getCurrentAdmin())) return NextResponse.redirect(new URL("/", appUrl()), 303);
  const app = stravaCentralApp();
  if (!app) {
    target.searchParams.set("erro", "strava_app_missing");
    return NextResponse.redirect(target, 303);
  }
  try {
    const res = await fetch("https://www.strava.com/api/v3/push_subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: app.clientId,
        client_secret: app.clientSecret,
        callback_url: `${appUrl()}/api/strava/webhook`,
        verify_token: webhookVerifyToken(tokenEncryptionKey()),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    // 201 created; 400 usually means it already exists (Strava allows one per app).
    target.searchParams.set(res.ok ? "ok" : "erro", res.ok ? "strava_webhook" : "strava_webhook_falhou");
  } catch {
    target.searchParams.set("erro", "strava_webhook_falhou");
  }
  return NextResponse.redirect(target, 303);
}
