// RF06-RF09, RF15, RB02-RB04, RB11-RB14, RB16 (ADR-007): wear rules, without DB or UI (RNF08).
import { describe, expect, it } from "vitest";
import { alertText, byWearDesc, computePlanWear, wearRatio, wearStatus, type WearPart, type WearPlan, type WearRide } from "@/lib/wear";

const d = (s: string) => new Date(s);
const part = (over: Partial<WearPart> = {}): WearPart => ({
  installedAt: d("2026-01-01T03:00:00Z"),
  removedAt: null,
  initialKm: 0,
  initialHours: 0,
  wearsOnTrainer: false,
  ...over,
});
const plan = (over: Partial<WearPlan> = {}): WearPlan => ({ intervalKm: 1000, intervalHours: null, action: "REPLACE", lastServiceAt: null, ...over });
const ride = (date: string, km: number, h: number, sportType = "Ride"): WearRide => ({ startDate: d(date), distanceKm: km, movingHours: h, sportType });

describe("RF06 / RB02: only rides while the part was installed count", () => {
  it("sums km and hours from installation until removal", () => {
    const rides = [
      ride("2025-12-31T10:00:00Z", 100, 4), // before installation
      ride("2026-01-01T10:00:00Z", 50, 2),
      ride("2026-02-01T10:00:00Z", 30, 1),
      ride("2026-03-01T10:00:00Z", 999, 9), // after removal
    ];
    const w = computePlanWear(part({ removedAt: d("2026-03-01T03:00:00Z") }), plan(), rides);
    expect(w.km).toBe(80);
    expect(w.hours).toBe(3);
  });
  it("adds the initial usage of a used part (RF02)", () => {
    const w = computePlanWear(part({ initialKm: 200, initialHours: 5 }), plan(), [ride("2026-01-02T10:00:00Z", 100, 3)]);
    expect(w.km).toBe(300);
    expect(w.hours).toBe(8);
  });
});

describe("RB03 / RB14: sport types and trainer rides", () => {
  it("ignores non-cycling activities", () => {
    expect(computePlanWear(part(), plan(), [ride("2026-01-02T10:00:00Z", 10, 1, "Run")]).km).toBe(0);
  });
  it("counts VirtualRide only for categories that wear on the trainer", () => {
    const rides = [ride("2026-01-02T10:00:00Z", 40, 1, "VirtualRide")];
    expect(computePlanWear(part({ wearsOnTrainer: false }), plan(), rides).km).toBe(0);
    expect(computePlanWear(part({ wearsOnTrainer: true }), plan(), rides).km).toBe(40);
  });
});

describe("RF07 / RB11: wear is the larger of the km and hours fractions", () => {
  it("uses the only metric when the plan has one", () => {
    expect(wearRatio(500, 100, { intervalKm: 1000, intervalHours: null })).toBe(0.5);
    expect(wearRatio(500, 25, { intervalKm: null, intervalHours: 50 })).toBe(0.5);
  });
  it("takes the metric reached first", () => {
    expect(wearRatio(200, 45, { intervalKm: 1000, intervalHours: 50 })).toBe(0.9);
  });
});

describe("RF08 / RF09 / RB04 / RB13: alerts at 80% and 100%", () => {
  it("classifies thresholds", () => {
    expect(wearStatus(0.79)).toBe("ok");
    expect(wearStatus(0.8)).toBe("near");
    expect(wearStatus(1)).toBe("due");
  });
  it("words the alert by the plan's action", () => {
    expect(alertText("near", "REPLACE")).toBe("Troca próxima");
    expect(alertText("due", "REPLACE")).toBe("Troca necessária");
    expect(alertText("near", "SERVICE")).toBe("Revisão próxima");
    expect(alertText("due", "SERVICE")).toBe("Revisão necessária");
    expect(alertText("ok", "SERVICE")).toBeNull();
  });
  it("raises the alert from rides", () => {
    const w = computePlanWear(part(), plan(), [ride("2026-01-02T10:00:00Z", 850, 30)]);
    expect(w.status).toBe("near");
    expect(w.alert).toBe("Troca próxima");
  });
});

describe("RB13 / RB16: a service restarts only that plan", () => {
  const fork = part({ initialHours: 10 });
  const rides = [ride("2026-01-10T10:00:00Z", 0, 40), ride("2026-02-10T10:00:00Z", 0, 6)];
  it("counts from the last service and drops the initial usage", () => {
    const lowers = plan({ intervalKm: null, intervalHours: 50, action: "SERVICE", lastServiceAt: d("2026-02-01T03:00:00Z") });
    expect(computePlanWear(fork, lowers, rides).hours).toBe(6);
  });
  it("keeps the other plan of the same part counting", () => {
    const full = plan({ intervalKm: null, intervalHours: 125, action: "SERVICE" });
    expect(computePlanWear(fork, full, rides).hours).toBe(56);
  });
});

describe("RF15: dashboard order", () => {
  it("sorts by wear, highest first", () => {
    const items = [{ id: "a", wear: { ratio: 0.2 } }, { id: "b", wear: { ratio: 1.1 } }, { id: "c", wear: { ratio: 0.8 } }];
    expect(byWearDesc(items).map((i) => i.id)).toEqual(["b", "c", "a"]);
  });
});
