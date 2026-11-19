// RF06, RB03, RB12: turn rides from a source into GearLog rides (pure).
import { isCyclingSport } from "@/lib/wear";

export type RideInput = {
  externalId: string;
  stravaGearId: string | null;
  sportType: string;
  startDate: Date;
  distanceKm: number;
  movingHours: number;
};

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null);

/** Strava SummaryActivity: metres and seconds, converted here (docs/integracao-strava.md §0). */
export function parseStravaActivities(raw: unknown): RideInput[] {
  if (!Array.isArray(raw)) return [];
  const rides: RideInput[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const r = item as Record<string, unknown>;
    const sport = typeof r.sport_type === "string" ? r.sport_type : r.type;
    const startDate = typeof r.start_date === "string" ? new Date(r.start_date) : null;
    const metres = num(r.distance);
    const seconds = num(r.moving_time); // RB12: moving time, not elapsed
    if (typeof r.id !== "number" && typeof r.id !== "string") continue;
    if (!startDate || Number.isNaN(startDate.getTime()) || metres === null || seconds === null) continue;
    if (typeof sport !== "string" || !isCyclingSport(sport)) continue;
    rides.push({
      externalId: String(r.id),
      stravaGearId: typeof r.gear_id === "string" ? r.gear_id : null,
      sportType: sport,
      startDate,
      distanceKm: metres / 1000,
      movingHours: seconds / 3600,
    });
  }
  return rides;
}

export type SourceBike = { stravaGearId: string; name: string };

/** RF05: bikes of the Strava athlete (GET /athlete -> bikes[]). */
export function parseSourceBikes(raw: unknown): SourceBike[] {
  const r = raw as Record<string, unknown> | null;
  const list = Array.isArray(r?.bikes) ? (r!.bikes as unknown[]) : [];
  const bikes: SourceBike[] = [];
  for (const item of list) {
    if (typeof item !== "object" || item === null) continue;
    const b = item as Record<string, unknown>;
    const id = typeof b.id === "string" ? b.id : null;
    if (id) bikes.push({ stravaGearId: id, name: typeof b.name === "string" ? b.name : id });
  }
  return bikes;
}
