// RF14: a typed ride is validated the same way for the site and the app.
import { describe, expect, it } from "vitest";
import { parseManualRide } from "@/lib/rides/manual";
import { toRideDto } from "@/lib/rides-dto";

const ok = { date: "2026-11-18", distanceKm: "42,5", movingHours: "1.5", sportType: "Ride" };

describe("parseManualRide", () => {
  it("accepts pt-BR and dot decimals and keeps cycling sport types", () => {
    expect(parseManualRide(ok)).toMatchObject({ distanceKm: 42.5, movingHours: 1.5, sportType: "Ride" });
    expect(parseManualRide({ ...ok, sportType: "VirtualRide" })?.sportType).toBe("VirtualRide");
  });

  it("falls back to Ride for unknown sports", () => {
    expect(parseManualRide({ ...ok, sportType: "Swim" })?.sportType).toBe("Ride");
  });

  it("refuses bad dates, empty rides and absurd values", () => {
    expect(parseManualRide({ ...ok, date: "18/11/2026" })).toBeNull();
    expect(parseManualRide({ ...ok, distanceKm: "0", movingHours: "0" })).toBeNull();
    expect(parseManualRide({ ...ok, distanceKm: "2001" })).toBeNull();
    expect(parseManualRide({ ...ok, movingHours: "73" })).toBeNull();
    expect(parseManualRide({ ...ok, distanceKm: "" })).toBeNull();
    expect(parseManualRide({ ...ok, distanceKm: "-3" })).toBeNull();
  });
});

describe("toRideDto", () => {
  const base = { id: "r1", sportType: "Ride", startDate: new Date("2026-11-18T15:00:00Z"), distanceKm: 40, movingHours: 1.5 };
  it("lets the athlete choose the bike only for source rides without one", () => {
    expect(toRideDto({ ...base, source: "STRAVA", stravaGearId: null, bike: null }).canChooseBike).toBe(true);
    expect(toRideDto({ ...base, source: "STRAVA", stravaGearId: "b123", bike: null }).canChooseBike).toBe(false);
    expect(toRideDto({ ...base, source: "MANUAL", stravaGearId: null, bike: { id: "b", name: "Gravel" } })).toMatchObject({ canChooseBike: false, manual: true, bikeName: "Gravel" });
  });
});
