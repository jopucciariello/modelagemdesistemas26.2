// RF02, RF03, RF30, RF35, RB16, RB18: catalog rules and the seed from the catalog spreadsheet.
import { describe, expect, it } from "vitest";
import { seed } from "@/lib/catalog/seed";
import { bikeTypeFromCategory, canResetPlan, plansFor, priceRange } from "@/lib/catalog/rules";

const p = (name: string, km: number | null, h: number | null, action: "REPLACE" | "SERVICE" = "REPLACE") => ({ name, intervalKm: km, intervalHours: h, action, warnKm: null, warnHours: null });

describe("RF03 / RB16: plans of a new part", () => {
  it("prefers the component's own plans", () => {
    expect(plansFor([p("Corrente", 1500, null)], [p("Corrente", 3000, null)])).toEqual([p("Corrente", 1500, null)]);
  });
  it("falls back to the category defaults", () => {
    expect(plansFor([], [p("Troca", 2500, null)])).toEqual([p("Troca", 2500, null)]);
  });
  it("has no plans when neither has any (no regular wear)", () => {
    expect(plansFor([], [])).toEqual([]);
  });
});

describe("RB18: resetting a single plan", () => {
  it("allows a service, or a replacement inside a multi-plan part", () => {
    expect(canResetPlan("SERVICE", 1)).toBe(true);
    expect(canResetPlan("REPLACE", 2)).toBe(true);
    expect(canResetPlan("REPLACE", 1)).toBe(false);
  });
});

describe("RF35: bike type from the catalog category", () => {
  it("maps the spreadsheet labels", () => {
    expect(bikeTypeFromCategory("MTB — XC full")).toBe("MTB");
    expect(bikeTypeFromCategory("Road — race")).toBe("ROAD");
    expect(bikeTypeFromCategory("Gravel")).toBe("GRAVEL");
    expect(bikeTypeFromCategory("E-MTB — Trail / Enduro")).toBe("EBIKE");
    expect(bikeTypeFromCategory(null)).toBe("OTHER");
  });
});

describe("RF30: seed from the catalog spreadsheet", () => {
  const codes = new Set(seed.components.map((c) => c.code));
  const categories = new Set(seed.categories.map((c) => c.name));
  it("has unique codes in known categories", () => {
    expect(codes.size).toBe(seed.components.length);
    for (const c of seed.components) expect(categories.has(c.category)).toBe(true);
  });
  it("gives every plan at least one interval (RB10)", () => {
    for (const c of [...seed.components, ...seed.categories]) for (const plan of c.plans) expect(plan.intervalKm ?? plan.intervalHours).toBeGreaterThan(0);
  });
  it("points every bike model to existing components", () => {
    for (const b of seed.bikeModels) for (const part of b.parts) expect(codes.has(part.code)).toBe(true);
  });
  it("uses the average of the range as interval and its minimum as warning (OPEN-17)", () => {
    const chain = seed.components.find((c) => c.code === "TRX-018")!.plans.find((p) => p.name === "Corrente")!;
    expect(chain.intervalKm).toBe(2250);
    expect(chain.warnKm).toBe(1500);
  });
  it("formats price ranges in reais", () => {
    expect(priceRange(1450, 2300)).toBe("R$ 1.450 – R$ 2.300");
    expect(priceRange(null, null)).toBeNull();
  });
});
