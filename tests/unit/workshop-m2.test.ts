// RF25, RF26, RF27, RB21, RB23, #69: M2 pure rules.
import { describe, expect, it } from "vitest";
import { distanceKm, sortByDistance } from "@/lib/geo";
import { advanceStage, availableStarts, canWorkshopReadHistory, isValidGridHour, isWorkshopStaff, overlaps, parseStages } from "@/lib/workshop";

describe("#69: geo", () => {
  it("São Paulo to Rio is about 360 km", () => {
    const d = distanceKm({ latitude: -23.55, longitude: -46.63 }, { latitude: -22.91, longitude: -43.17 });
    expect(d).toBeGreaterThan(350);
    expect(d).toBeLessThan(370);
  });
  it("sorts by distance, shops without coordinates last", () => {
    const out = sortByDistance(
      [{ id: "far", latitude: -22.91, longitude: -43.17 }, { id: "none", latitude: null, longitude: null }, { id: "near", latitude: -23.56, longitude: -46.64 }],
      { latitude: -23.55, longitude: -46.63 },
    );
    expect(out.map((s) => s.id)).toEqual(["near", "far", "none"]);
    expect(out[2].distanceKm).toBeNull();
  });
});

describe("RF25: grid validation", () => {
  it("accepts 30 min aligned windows", () => expect(isValidGridHour({ weekday: 1, startMin: 540, endMin: 1080 })).toBe(true));
  it("rejects bad windows", () => {
    expect(isValidGridHour({ weekday: 7, startMin: 540, endMin: 600 })).toBe(false);
    expect(isValidGridHour({ weekday: 1, startMin: 600, endMin: 540 })).toBe(false);
    expect(isValidGridHour({ weekday: 1, startMin: 545, endMin: 600 })).toBe(false);
  });
});

describe("RF26, RB22: availableStarts", () => {
  // 2026-11-20 is a Friday (weekday 5). Now = Thu 19/11 12:00 São Paulo.
  const now = new Date("2026-11-19T15:00:00Z");
  const hours = [{ weekday: 5, startMin: 9 * 60, endMin: 12 * 60 }];
  it("lists starts where the duration fits inside the window", () => {
    const starts = availableStarts({ hours, durationMin: 90, busy: [], now, days: 3 });
    expect(starts.map((d) => d.toISOString())).toEqual([
      "2026-11-20T12:00:00.000Z", "2026-11-20T12:30:00.000Z", "2026-11-20T13:00:00.000Z", "2026-11-20T13:30:00.000Z",
    ]);
  });
  it("removes starts overlapping an active appointment", () => {
    const busy = [{ startsAt: new Date("2026-11-20T12:00:00Z"), endsAt: new Date("2026-11-20T13:00:00Z") }];
    const starts = availableStarts({ hours, durationMin: 60, busy, now, days: 3 }).map((d) => d.toISOString());
    expect(starts).toEqual(["2026-11-20T13:00:00.000Z", "2026-11-20T13:30:00.000Z", "2026-11-20T14:00:00.000Z"]);
  });
  it("never offers past times", () => {
    const late = new Date("2026-11-20T13:10:00Z");
    expect(availableStarts({ hours, durationMin: 60, busy: [], now: late, days: 1 }).map((d) => d.toISOString())).toEqual(["2026-11-20T13:30:00.000Z", "2026-11-20T14:00:00.000Z"]);
  });
  it("overlaps is half-open", () => {
    const b = [{ startsAt: new Date("2026-11-20T12:00:00Z"), endsAt: new Date("2026-11-20T13:00:00Z") }];
    expect(overlaps(new Date("2026-11-20T13:00:00Z"), new Date("2026-11-20T14:00:00Z"), b)).toBe(false);
    expect(overlaps(new Date("2026-11-20T12:59:00Z"), new Date("2026-11-20T14:00:00Z"), b)).toBe(true);
  });
});

describe("RB23: staged revisions", () => {
  it("parses stages", () => {
    expect(parseStages("100, 150")).toEqual([100, 150]);
    expect(parseStages("a,1")).toEqual([]);
    expect(parseStages(null)).toEqual([]);
  });
  it("advances to the next stage and repeats the last", () => {
    expect(advanceStage([100, 150], 0)).toEqual({ index: 1, target: 150 });
    expect(advanceStage([100, 150], 1)).toEqual({ index: 1, target: 150 });
    expect(advanceStage([], 0)).toBeNull();
  });
});

describe("RF27, RB09, RB21", () => {
  const appt = { workshopId: "w", bikeId: "b", status: "SCHEDULED" as const, shareHistory: true };
  it("reads history only with consent and a non-cancelled appointment", () => {
    expect(canWorkshopReadHistory([appt], "w", "b")).toBe(true);
    expect(canWorkshopReadHistory([{ ...appt, shareHistory: false }], "w", "b")).toBe(false);
    expect(canWorkshopReadHistory([{ ...appt, status: "CANCELLED" }], "w", "b")).toBe(false);
    expect(canWorkshopReadHistory([appt], "other", "b")).toBe(false);
  });
  it("owner and invited mechanics are staff, case-insensitive", () => {
    expect(isWorkshopStaff("Dono@X.com", "dono@x.com", [])).toBe(true);
    expect(isWorkshopStaff("mec@x.com", "dono@x.com", ["MEC@x.com"])).toBe(true);
    expect(isWorkshopStaff("o@x.com", "dono@x.com", ["mec@x.com"])).toBe(false);
    expect(isWorkshopStaff(null, "dono@x.com", [])).toBe(false);
  });
});

import { canDecideRequest, canInviteMechanic, cleanWorkshopRequest } from "@/lib/workshop";

describe("RF25: registration request", () => {
  it("needs name, contact and a description", () => {
    expect(cleanWorkshopRequest({ name: " Bike  Shop ", contact: "(11) 99999-0000", requestText: "Oficina em Pinheiros, revisão completa" })).toEqual({
      name: "Bike Shop", contact: "(11) 99999-0000", requestText: "Oficina em Pinheiros, revisão completa",
    });
    expect(cleanWorkshopRequest({ name: "A", contact: "(11) 99999-0000", requestText: "texto longo o bastante" })).toBeNull();
    expect(cleanWorkshopRequest({ name: "Bike Shop", contact: "1", requestText: "texto longo o bastante" })).toBeNull();
    expect(cleanWorkshopRequest({ name: "Bike Shop", contact: "(11) 99999-0000", requestText: "curto" })).toBeNull();
    expect(cleanWorkshopRequest({})).toBeNull();
  });
  it("the admin decides only pending requests; rejected ones may reopen", () => {
    expect(canDecideRequest("PENDING", "approve")).toBe(true);
    expect(canDecideRequest("PENDING", "reject")).toBe(true);
    expect(canDecideRequest("ACTIVE", "approve")).toBe(false);
    expect(canDecideRequest("REJECTED", "approve")).toBe(false);
    expect(canDecideRequest("REJECTED", "reopen")).toBe(true);
    expect(canDecideRequest("PENDING", "reopen")).toBe(false);
  });
});

describe("RB21: inviting mechanics", () => {
  it("only the owner invites, once, never the owner", () => {
    expect(canInviteMechanic("dono@x.com", "dono@x.com", "mec@x.com", [])).toBe("ok");
    expect(canInviteMechanic("mec@x.com", "dono@x.com", "novo@x.com", ["mec@x.com"])).toBe("not_owner");
    expect(canInviteMechanic(null, "dono@x.com", "mec@x.com", [])).toBe("not_owner");
    expect(canInviteMechanic("dono@x.com", "dono@x.com", "DONO@x.com", [])).toBe("is_owner");
    expect(canInviteMechanic("dono@x.com", "dono@x.com", "Mec@x.com", ["mec@x.com"])).toBe("duplicate");
  });
});
