// RF05, RF06, RF14, RF34, RB03, RB12: mapping rides and bikes from each source.
import { describe, expect, it } from "vitest";
import { parseConnectorActivities, parseSourceBikes, parseStravaActivities } from "@/lib/rides/map";
import { parseLocalDay, toLocalDay } from "@/lib/dates";

describe("RF34: connector activities (km and hours)", () => {
  it("keeps cycling rides and drops invalid items", () => {
    const rides = parseConnectorActivities({
      activities: [
        { stravaActivityId: "1", stravaGearId: "b1", sportType: "GravelRide", startDate: "2026-11-01T10:00:00Z", distanceKm: 42.5, movingHours: 1.8 },
        { stravaActivityId: "2", stravaGearId: null, sportType: "Run", startDate: "2026-11-01T10:00:00Z", distanceKm: 5, movingHours: 0.5 },
        { stravaActivityId: "3", sportType: "Ride", startDate: "not a date", distanceKm: 1, movingHours: 1 },
      ],
    });
    expect(rides).toEqual([
      { externalId: "1", stravaGearId: "b1", sportType: "GravelRide", startDate: new Date("2026-11-01T10:00:00Z"), distanceKm: 42.5, movingHours: 1.8 },
    ]);
  });
  it("accepts a bare list", () => {
    expect(parseConnectorActivities([{ stravaActivityId: 9, sportType: "Ride", startDate: "2026-11-01T10:00:00Z", distanceKm: 1, movingHours: 1 }])).toHaveLength(1);
  });
});

describe("RF06 / RB12: Strava activities (metres and seconds)", () => {
  it("converts to km and moving hours", () => {
    const [r] = parseStravaActivities([
      { id: 123, sport_type: "MountainBikeRide", start_date: "2026-11-02T09:00:00Z", distance: 25000, moving_time: 5400, elapsed_time: 9000, gear_id: "b9" },
    ]);
    expect(r).toMatchObject({ externalId: "123", stravaGearId: "b9", distanceKm: 25, movingHours: 1.5 });
  });
});

describe("RF05: source bikes", () => {
  it("reads connector and Strava shapes", () => {
    expect(parseSourceBikes([{ stravaGearId: "b1", name: "Trek" }])).toEqual([{ stravaGearId: "b1", name: "Trek" }]);
    expect(parseSourceBikes({ bikes: [{ id: "b2", name: "Scott" }] })).toEqual([{ stravaGearId: "b2", name: "Scott" }]);
  });
});

describe("RF14: dates typed by the athlete are days in São Paulo", () => {
  it("parses and formats round-trip", () => {
    const day = parseLocalDay("2026-11-12");
    expect(day?.toISOString()).toBe("2026-11-12T03:00:00.000Z");
    expect(toLocalDay(day!)).toBe("2026-11-12");
    expect(parseLocalDay("12/11/2026")).toBeNull();
  });
});
