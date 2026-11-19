// RF06, ADR-011: apply a Strava webhook event to the database.
import "server-only";
import { prisma } from "@/lib/db";
import { fetchActivity, saveRides, SyncError } from "@/lib/rides/sync";
import type { WebhookEvent } from "@/lib/strava/webhook";

export async function handleWebhookEvent(event: WebhookEvent): Promise<void> {
  if (event.kind === "ignore") return;
  const connection = await prisma.stravaConnection.findFirst({ where: { stravaAthleteId: event.ownerId }, select: { userId: true } });
  if (!connection) return; // not a GearLog athlete (or already disconnected)
  const { userId } = connection;
  if (event.kind === "deauthorized") {
    // The athlete revoked GearLog at strava.com: drop the tokens, keep the rides already imported.
    await prisma.$transaction([
      prisma.stravaConnection.deleteMany({ where: { userId } }),
      prisma.user.update({ where: { id: userId }, data: { activitySource: "MANUAL" } }),
    ]);
    return;
  }
  if (event.kind === "activity-delete") {
    await prisma.ride.deleteMany({ where: { userId, source: "STRAVA", externalId: event.activityId } });
    return;
  }
  try {
    const ride = await fetchActivity(userId, event.activityId);
    if (ride) {
      await saveRides(userId, [ride]);
      await prisma.user.update({ where: { id: userId }, data: { lastSyncAt: new Date(), lastSyncError: null } });
    } else {
      // The activity is no longer a cycling one (type changed): remove what was imported before.
      await prisma.ride.deleteMany({ where: { userId, source: "STRAVA", externalId: event.activityId } });
    }
  } catch (e) {
    console.error(`[strava-webhook] activity failed: ${e instanceof SyncError ? e.code : "unexpected"}`);
  }
}
