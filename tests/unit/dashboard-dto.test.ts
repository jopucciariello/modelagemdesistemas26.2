// RF15, RB04: the app's dashboard JSON keeps the most worn bikes first and counts statuses.
import { describe, expect, it } from "vitest";
import { toDashboardDto } from "@/lib/dashboard-dto";

type Input = Parameters<typeof toDashboardDto>[0];

function row(bikeId: string, planId: string, status: "ok" | "near" | "due", ratio: number) {
  return {
    bikeId,
    bikeName: bikeId,
    part: { position: null, component: { brand: "Shimano", model: "XT", category: { name: "Corrente" } } },
    plan: { id: planId, name: "Troca", action: "REPLACE", intervalKm: 3000, intervalHours: null },
    wear: { km: ratio * 3000, hours: 0, ratio, status, alert: status === "ok" ? null : "Atenção" },
  };
}

describe("toDashboardDto", () => {
  it("orders bikes by due plans then alerts and counts statuses", () => {
    const data = {
      rows: [row("b1", "p1", "ok", 0.2), row("b2", "p2", "due", 1.1), row("b2", "p3", "near", 0.85)],
      bikeCount: 3,
      bikes: [
        { id: "b1", name: "Gravel", photoVersion: null },
        { id: "b2", name: "Estrada", photoVersion: 5 },
        { id: "b3", name: "Sem peças", photoVersion: null },
      ],
    } as unknown as Input;
    const dto = toDashboardDto(data);
    expect(dto.counts).toEqual({ due: 1, near: 1, ok: 1 });
    expect(dto.bikes.map((b) => b.id)).toEqual(["b2", "b1", "b3"]);
    expect(dto.bikes[0]).toMatchObject({ hasPhoto: true, alerts: 2, due: 1 });
    expect(dto.bikes[0].plans[0].partLabel).toBe("Corrente");
    expect(dto.bikes[2].plans).toEqual([]);
  });
});
