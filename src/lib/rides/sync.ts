// RF05, RF06, RF13, RNF05, RNF06, ADR-007, ADR-011: bring rides from Strava (direct API) into the DB.
import "server-only";
import { prisma } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto";
import { stravaApiBaseUrl, tokenEncryptionKey } from "@/lib/env";
import { getStravaOAuthConfig } from "@/lib/strava/link-account";
import { needsRefresh, refreshAccessToken } from "@/lib/strava/oauth";
import { parseSourceBikes, parseStravaActivities, type RideInput, type SourceBike } from "@/lib/rides/map";

export type SourceBikeOption = SourceBike;

export class SyncError extends Error {
  constructor(readonly code: "not_linked" | "unreachable" | "unauthorized" | "bad_response" | "unexpected") {
    super(`Sync failed: ${code}`);
    this.name = "SyncError";
  }
}

const STRAVA_PAGE_SIZE = 100;
const STRAVA_MAX_PAGES = 10; // RNF05: at most 10 requests per manual sync

/** Returns a valid Strava access token, refreshing and storing it when close to expiry. */
async function stravaAccessToken(userId: string): Promise<string> {
  const conn = await prisma.stravaConnection.findUnique({ where: { userId } });
  if (!conn?.accessTokenEncrypted || !conn.refreshTokenEncrypted || !conn.expiresAt) throw new SyncError("not_linked");
  const key = tokenEncryptionKey();
  if (!needsRefresh(conn.expiresAt)) return decrypt(conn.accessTokenEncrypted, key);
  const config = await getStravaOAuthConfig(userId);
  if (!config) throw new SyncError("not_linked");
  try {
    const token = await refreshAccessToken(config, decrypt(conn.refreshTokenEncrypted, key));
    await prisma.stravaConnection.update({
      where: { userId },
      data: { accessTokenEncrypted: encrypt(token.accessToken, key), refreshTokenEncrypted: encrypt(token.refreshToken, key), expiresAt: token.expiresAt },
    });
    return token.accessToken;
  } catch {
    throw new SyncError("unauthorized");
  }
}

async function stravaGet(token: string, path: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${stravaApiBaseUrl()}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new SyncError("unreachable");
  }
  if (res.status === 401 || res.status === 403) throw new SyncError("unauthorized");
  if (!res.ok) throw new SyncError(res.status === 429 ? "unreachable" : "bad_response");
  try {
    return await res.json();
  } catch {
    throw new SyncError("bad_response");
  }
}

async function fetchRides(userId: string): Promise<RideInput[]> {
  const token = await stravaAccessToken(userId);
  // Incremental: from one day before the newest imported ride (edits of recent rides are picked up).
  const newest = await prisma.ride.findFirst({ where: { userId, source: "STRAVA" }, orderBy: { startDate: "desc" } });
  const after = newest ? Math.floor(newest.startDate.getTime() / 1000) - 86_400 : 0;
  const rides: RideInput[] = [];
  for (let page = 1; page <= STRAVA_MAX_PAGES; page++) {
    const raw = await stravaGet(token, `/athlete/activities?after=${after}&page=${page}&per_page=${STRAVA_PAGE_SIZE}`);
    rides.push(...parseStravaActivities(raw));
    if (!Array.isArray(raw) || raw.length < STRAVA_PAGE_SIZE) break;
  }
  return rides;
}

/** RF05: bikes (gear) of the athlete's Strava account, to link with GearLog bikes. */
export async function listSourceBikes(userId: string, source: "MANUAL" | "STRAVA"): Promise<SourceBike[] | null> {
  if (source === "MANUAL") return null;
  try {
    return parseSourceBikes(await stravaGet(await stravaAccessToken(userId), "/athlete"));
  } catch {
    return null; // RNF06: the page still works without Strava
  }
}

/** Upserts rides by (userId, externalId): never duplicates, keeps a bike the athlete chose by hand. */
export async function saveRides(userId: string, rides: RideInput[]): Promise<void> {
  const bikes = await prisma.bike.findMany({ where: { userId, stravaGearId: { not: null } }, select: { id: true, stravaGearId: true } });
  const bikeByGear = new Map(bikes.map((b) => [b.stravaGearId!, b.id]));
  const chosen = new Set((await prisma.ride.findMany({ where: { userId, bikeChosen: true }, select: { externalId: true } })).map((r) => r.externalId));
  await prisma.$transaction(
    rides.map((r) => {
      // OPEN-20: a bike the athlete chose by hand stays while Strava sends no gear for the ride.
      const keepChoice = !r.stravaGearId && chosen.has(r.externalId);
      const gearBike = r.stravaGearId ? (bikeByGear.get(r.stravaGearId) ?? null) : null;
      const data = {
        source: "STRAVA" as const,
        stravaGearId: r.stravaGearId,
        ...(keepChoice ? {} : { bikeId: gearBike, bikeChosen: false }),
        sportType: r.sportType,
        startDate: r.startDate,
        distanceKm: r.distanceKm,
        movingHours: r.movingHours,
      };
      return prisma.ride.upsert({
        where: { userId_externalId: { userId, externalId: r.externalId } },
        update: data,
        create: { ...data, bikeId: gearBike, userId, externalId: r.externalId },
      });
    }),
  );
}

/** ADR-011: one activity (webhook event). Returns the access token's owner view of the activity, or null if not a ride. */
export async function fetchActivity(userId: string, activityId: string): Promise<RideInput | null> {
  const raw = await stravaGet(await stravaAccessToken(userId), `/activities/${encodeURIComponent(activityId)}`);
  return parseStravaActivities([raw])[0] ?? null;
}

/**
 * RF06, RF13: imports the rides of the athlete's source. Existing rides are updated (same
 * externalId), never duplicated. On failure nothing stored changes and the error is recorded.
 */
export async function syncRides(userId: string): Promise<{ imported: number }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { activitySource: true } });
  if (user.activitySource === "MANUAL") throw new SyncError("not_linked");
  try {
    const rides = await fetchRides(userId);
    await saveRides(userId, rides);
    await prisma.user.update({ where: { id: userId }, data: { lastSyncAt: new Date(), lastSyncError: null } });
    return { imported: rides.length };
  } catch (e) {
    const code = e instanceof SyncError ? e.code : "unexpected";
    console.error(`[sync] STRAVA failed: ${code}`); // code only, never tokens or keys
    await prisma.user.update({ where: { id: userId }, data: { lastSyncError: code } });
    throw e instanceof SyncError ? e : new SyncError("unexpected");
  }
}
