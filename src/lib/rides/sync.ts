// RF05, RF06, RF13, RNF05, RNF06, ADR-007: bring rides from the athlete's source into the DB.
import "server-only";
import { prisma } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto";
import { stravaApiBaseUrl, tokenEncryptionKey } from "@/lib/env";
import { ConnectorError, connectorGet } from "@/lib/connector/client";
import { getStravaOAuthConfig } from "@/lib/strava/link-account";
import { needsRefresh, refreshAccessToken } from "@/lib/strava/oauth";
import { parseConnectorActivities, parseSourceBikes, parseStravaActivities, type RideInput, type SourceBike } from "@/lib/rides/map";

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

async function connectorCall(userId: string, path: "/v1/gearlog/bikes" | "/v1/gearlog/activities"): Promise<unknown> {
  const conn = await prisma.connectorConnection.findUnique({ where: { userId } });
  if (!conn) throw new SyncError("not_linked");
  try {
    return await connectorGet(conn.baseUrl, decrypt(conn.apiKeyEncrypted, tokenEncryptionKey()), path);
  } catch (e) {
    throw new SyncError(e instanceof ConnectorError ? e.code : "unexpected");
  }
}

async function fetchRides(userId: string, source: "STRAVA" | "CONNECTOR"): Promise<RideInput[]> {
  if (source === "CONNECTOR") return parseConnectorActivities(await connectorCall(userId, "/v1/gearlog/activities"));
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

/** RF05: bikes (gear) of the athlete's source, to link with GearLog bikes. */
export async function listSourceBikes(userId: string, source: "MANUAL" | "STRAVA" | "CONNECTOR"): Promise<SourceBike[] | null> {
  if (source === "MANUAL") return null;
  try {
    if (source === "CONNECTOR") return parseSourceBikes(await connectorCall(userId, "/v1/gearlog/bikes"));
    return parseSourceBikes(await stravaGet(await stravaAccessToken(userId), "/athlete"));
  } catch {
    return null; // RNF06: the page still works without the source
  }
}

/**
 * RF06, RF13: imports the rides of the athlete's source. Existing rides are updated (same
 * externalId), never duplicated. On failure nothing stored changes and the error is recorded.
 */
export async function syncRides(userId: string): Promise<{ imported: number }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { activitySource: true } });
  if (user.activitySource === "MANUAL") throw new SyncError("not_linked");
  const source = user.activitySource;
  try {
    const rides = await fetchRides(userId, source);
    const bikes = await prisma.bike.findMany({ where: { userId, stravaGearId: { not: null } }, select: { id: true, stravaGearId: true } });
    const bikeByGear = new Map(bikes.map((b) => [b.stravaGearId!, b.id]));
    await prisma.$transaction(
      rides.map((r) => {
        const data = {
          source,
          stravaGearId: r.stravaGearId,
          bikeId: r.stravaGearId ? (bikeByGear.get(r.stravaGearId) ?? null) : null,
          sportType: r.sportType,
          startDate: r.startDate,
          distanceKm: r.distanceKm,
          movingHours: r.movingHours,
        };
        return prisma.ride.upsert({
          where: { userId_externalId: { userId, externalId: r.externalId } },
          update: data,
          create: { ...data, userId, externalId: r.externalId },
        });
      }),
    );
    await prisma.user.update({ where: { id: userId }, data: { lastSyncAt: new Date(), lastSyncError: null } });
    return { imported: rides.length };
  } catch (e) {
    const code = e instanceof SyncError ? e.code : "unexpected";
    console.error(`[sync] ${source} failed: ${code}`); // code only, never tokens or keys
    await prisma.user.update({ where: { id: userId }, data: { lastSyncError: code } });
    throw e instanceof SyncError ? e : new SyncError("unexpected");
  }
}
