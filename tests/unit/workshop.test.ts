// RF25-RF29, RNF03, RB09, RB22: pure workshop rules (SPEC-011..013).
import { describe, expect, it } from "vitest";
import { canBook, canWorkshopAccessBike, cancellationNotice, isLateCancellation, isSlotFree, parseIncludes, parseSlotStart } from "@/lib/workshop";

const now = new Date("2026-11-20T12:00:00Z");
const hours = (h: number) => new Date(now.getTime() + h * 3600_000);

describe("RF25: parseIncludes", () => {
  it("keeps one clean item per line", () => {
    expect(parseIncludes("  Troca de corrente \r\n\n Regulagem dos câmbios\n")).toEqual(["Troca de corrente", "Regulagem dos câmbios"]);
  });
  it("limits to 30 items", () => {
    expect(parseIncludes(Array.from({ length: 40 }, (_, i) => `item ${i}`).join("\n"))).toHaveLength(30);
  });
});

describe("RF25: parseSlotStart", () => {
  it("reads São Paulo time", () => {
    expect(parseSlotStart("2026-11-20", "14:30")?.toISOString()).toBe("2026-11-20T17:30:00.000Z");
  });
  it("rejects invalid values", () => {
    expect(parseSlotStart("20/11/2026", "14:30")).toBeNull();
    expect(parseSlotStart("2026-11-20", "25:00")).toBeNull();
    expect(parseSlotStart(null, "10:00")).toBeNull();
  });
});

describe("RF26, RB22: booking", () => {
  it("a slot is free when every appointment was cancelled", () => {
    expect(isSlotFree([])).toBe(true);
    expect(isSlotFree([{ status: "CANCELLED" }])).toBe(true);
    expect(isSlotFree([{ status: "CANCELLED" }, { status: "SCHEDULED" }])).toBe(false);
    expect(isSlotFree([{ status: "COMPLETED" }])).toBe(false);
  });
  it("only future free slots can be booked", () => {
    expect(canBook(hours(2), [], now)).toBe(true);
    expect(canBook(hours(-1), [], now)).toBe(false);
    expect(canBook(hours(2), [{ status: "SCHEDULED" }], now)).toBe(false);
  });
});

describe("RF29: isLateCancellation", () => {
  it("is urgent below 24 h", () => {
    expect(isLateCancellation(hours(23), now)).toBe(true);
    expect(isLateCancellation(hours(24), now)).toBe(false);
    expect(isLateCancellation(hours(72), now)).toBe(false);
  });
  it("writes a different notice when late", () => {
    expect(cancellationNotice("Ana", "Speed", hours(2), true)).toContain("última hora");
    expect(cancellationNotice("Ana", "Speed", hours(48), false)).toContain("voltou a ficar livre");
  });
});

describe("RNF03, RB09: canWorkshopAccessBike", () => {
  const appts = [
    { workshopId: "w1", bikeId: "b1", status: "SCHEDULED" as const },
    { workshopId: "w1", bikeId: "b2", status: "CANCELLED" as const },
    { workshopId: "w2", bikeId: "b3", status: "COMPLETED" as const },
  ];
  it("allows scheduled and completed appointments of the same workshop", () => {
    expect(canWorkshopAccessBike(appts, "w1", "b1")).toBe(true);
    expect(canWorkshopAccessBike(appts, "w2", "b3")).toBe(true);
  });
  it("denies cancelled appointments, other workshops and unknown bikes", () => {
    expect(canWorkshopAccessBike(appts, "w1", "b2")).toBe(false);
    expect(canWorkshopAccessBike(appts, "w1", "b3")).toBe(false);
    expect(canWorkshopAccessBike([], "w1", "b1")).toBe(false);
  });
});
