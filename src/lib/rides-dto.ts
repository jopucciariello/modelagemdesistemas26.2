// RF14, OPEN-20: JSON shape of the recent rides for the Expo app (issue #64). Pure.
export type RideRow = {
  id: string;
  source: "MANUAL" | "STRAVA";
  sportType: string;
  startDate: Date;
  distanceKm: number;
  movingHours: number;
  stravaGearId: string | null;
  bike: { id: string; name: string } | null;
};

export type RideDto = {
  id: string;
  source: RideRow["source"];
  sportType: string;
  date: string;
  distanceKm: number;
  movingHours: number;
  bikeId: string | null;
  bikeName: string | null;
  /** The source sent no bike, so the athlete may choose one (OPEN-20). */
  canChooseBike: boolean;
  /** Only rides typed by hand can be deleted. */
  manual: boolean;
};

export function toRideDto(r: RideRow): RideDto {
  return {
    id: r.id,
    source: r.source,
    sportType: r.sportType,
    date: r.startDate.toISOString(),
    distanceKm: r.distanceKm,
    movingHours: r.movingHours,
    bikeId: r.bike?.id ?? null,
    bikeName: r.bike?.name ?? null,
    canChooseBike: r.source !== "MANUAL" && r.stravaGearId === null,
    manual: r.source === "MANUAL",
  };
}
