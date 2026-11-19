// RF06, ADR-011: Strava webhook (push subscription). Pure helpers; the I/O lives in the routes.
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The `verify_token` of the subscription is derived from the encryption key, so no new secret is needed.
 * Strava sends it back in the validation request (GET) and we compare in constant time.
 */
export function webhookVerifyToken(base64Key: string): string {
  return createHmac("sha256", Buffer.from(base64Key, "base64")).update("strava-webhook-verify").digest("hex");
}

export function verifyTokenMatches(given: string | null, base64Key: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(webhookVerifyToken(base64Key));
  return a.length === b.length && timingSafeEqual(a, b);
}

export type WebhookEvent =
  | { kind: "activity-upsert"; ownerId: string; activityId: string }
  | { kind: "activity-delete"; ownerId: string; activityId: string }
  | { kind: "deauthorized"; ownerId: string }
  | { kind: "ignore" };

/** Reads a Strava push event: create/update/delete of an activity, or the athlete revoking access. */
export function parseWebhookEvent(raw: unknown): WebhookEvent {
  if (typeof raw !== "object" || raw === null) return { kind: "ignore" };
  const e = raw as Record<string, unknown>;
  const id = (v: unknown) => (typeof v === "number" || typeof v === "string") && /^\d+$/.test(String(v)) ? String(v) : null;
  const ownerId = id(e.owner_id);
  const objectId = id(e.object_id);
  if (!ownerId) return { kind: "ignore" };
  if (e.object_type === "athlete") {
    const updates = e.updates as Record<string, unknown> | undefined;
    return e.aspect_type === "update" && updates?.authorized === "false" ? { kind: "deauthorized", ownerId } : { kind: "ignore" };
  }
  if (e.object_type !== "activity" || !objectId) return { kind: "ignore" };
  if (e.aspect_type === "delete") return { kind: "activity-delete", ownerId, activityId: objectId };
  if (e.aspect_type === "create" || e.aspect_type === "update") return { kind: "activity-upsert", ownerId, activityId: objectId };
  return { kind: "ignore" };
}
