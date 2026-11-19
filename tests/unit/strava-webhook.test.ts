// RF06, ADR-011: Strava webhook events and the validation token.
import { describe, expect, it } from "vitest";
import { parseWebhookEvent, verifyTokenMatches, webhookVerifyToken } from "@/lib/strava/webhook";

const KEY = Buffer.alloc(32, 7).toString("base64");

describe("webhook verify token", () => {
  it("accepts only the derived token", () => {
    expect(verifyTokenMatches(webhookVerifyToken(KEY), KEY)).toBe(true);
    expect(verifyTokenMatches("outro", KEY)).toBe(false);
    expect(verifyTokenMatches(null, KEY)).toBe(false);
  });
});

describe("parseWebhookEvent", () => {
  it("reads create, update and delete of an activity", () => {
    expect(parseWebhookEvent({ object_type: "activity", aspect_type: "create", object_id: 11, owner_id: 22 })).toEqual({ kind: "activity-upsert", ownerId: "22", activityId: "11" });
    expect(parseWebhookEvent({ object_type: "activity", aspect_type: "update", object_id: 11, owner_id: 22, updates: { title: "x" } }).kind).toBe("activity-upsert");
    expect(parseWebhookEvent({ object_type: "activity", aspect_type: "delete", object_id: 11, owner_id: 22 }).kind).toBe("activity-delete");
  });
  it("reads the athlete revoking access", () => {
    expect(parseWebhookEvent({ object_type: "athlete", aspect_type: "update", object_id: 22, owner_id: 22, updates: { authorized: "false" } })).toEqual({ kind: "deauthorized", ownerId: "22" });
  });
  it("ignores everything else", () => {
    expect(parseWebhookEvent(null).kind).toBe("ignore");
    expect(parseWebhookEvent({ object_type: "athlete", aspect_type: "update", owner_id: 22, updates: { title: "x" } }).kind).toBe("ignore");
    expect(parseWebhookEvent({ object_type: "activity", aspect_type: "create", object_id: "abc", owner_id: 22 }).kind).toBe("ignore");
  });
});
