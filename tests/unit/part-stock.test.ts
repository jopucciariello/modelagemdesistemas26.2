// RF02, RF39: usage that travels with a part kept in stock (lifetime usage, no plan resets).
import { describe, expect, it } from "vitest";
import { computePlanWear } from "@/lib/wear";

describe("RF39 usage carried by a stocked part", () => {
  const plan = { intervalKm: null, intervalHours: null, action: "REPLACE" as const, lastServiceAt: null };
  const part = { installedAt: new Date("2026-01-01"), removedAt: new Date("2026-03-01"), initialKm: 100, initialHours: 5, wearsOnTrainer: true };
  const rides = [
    { startDate: new Date("2026-02-01"), distanceKm: 50, movingHours: 2, sportType: "Ride" },
    { startDate: new Date("2026-04-01"), distanceKm: 70, movingHours: 3, sportType: "Ride" },
  ];
  it("sums the initial usage and the rides while installed, ignoring later rides", () => {
    const w = computePlanWear(part, plan, rides);
    expect(w.km).toBe(150);
    expect(w.hours).toBe(7);
  });
});
