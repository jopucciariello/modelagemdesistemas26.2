// RF06, ADR-011: Strava push subscription endpoint. GET answers the validation challenge,
// POST receives events. Strava expects a 200 within 2 s, so the work runs after the response.
import { after } from "next/server";
import { tokenEncryptionKey } from "@/lib/env";
import { parseWebhookEvent, verifyTokenMatches } from "@/lib/strava/webhook";
import { handleWebhookEvent } from "@/lib/strava/webhook-handler";

export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  if (p.get("hub.mode") !== "subscribe" || !verifyTokenMatches(p.get("hub.verify_token"), tokenEncryptionKey())) {
    return new Response("Forbidden", { status: 403 });
  }
  return Response.json({ "hub.challenge": p.get("hub.challenge") });
}

export async function POST(request: Request) {
  const event = parseWebhookEvent(await request.json().catch(() => null));
  after(() => handleWebhookEvent(event).catch(() => console.error("[strava-webhook] handler failed")));
  return new Response("ok", { status: 200 });
}
