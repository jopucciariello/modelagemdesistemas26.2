// RF34: contract of the strava-connector /v1/gearlog API (units: km, hours, ISO-8601 UTC).
export type ConnectorStatus = {
  linked: boolean;
  stravaAthleteId?: string | null;
  lastSyncAt?: string | null;
  lastError?: string | null;
  tokenExpiresAt?: string | null;
  webhookSubscribed?: boolean;
  pendingJobs?: number;
};

export type ConnectorBike = {
  stravaGearId: string;
  name: string;
  brand?: string;
  model?: string;
  frameType?: number;
  totalDistanceKm: number;
  primary: boolean;
  retired: boolean;
};

export type ConnectorActivity = {
  stravaActivityId: string;
  stravaGearId: string | null;
  sportType: "Ride" | "MountainBikeRide" | "GravelRide" | "EBikeRide" | "EMountainBikeRide" | "VirtualRide";
  startDate: string;
  distanceKm: number;
  movingHours: number;
  elevationGainM?: number;
  trainer: boolean;
  manual: boolean;
};

/** Narrows an unknown connector payload to a status, or null when it is not one. */
export function parseConnectorStatus(raw: unknown): ConnectorStatus | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.linked !== "boolean") return null;
  const str = (v: unknown) => (typeof v === "string" ? v : null);
  return {
    linked: r.linked,
    stravaAthleteId: str(r.stravaAthleteId),
    lastSyncAt: str(r.lastSyncAt),
    lastError: str(r.lastError),
    tokenExpiresAt: str(r.tokenExpiresAt),
    webhookSubscribed: typeof r.webhookSubscribed === "boolean" ? r.webhookSubscribed : undefined,
    pendingJobs: typeof r.pendingJobs === "number" ? r.pendingJobs : undefined,
  };
}
