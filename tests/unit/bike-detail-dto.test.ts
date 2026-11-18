// RF11: the app's bike page JSON keeps wear per plan and the chronological history.
import { describe, expect, it } from "vitest";
import { toBikeDetailDto } from "@/lib/bike-detail-dto";

type Input = Parameters<typeof toBikeDetailDto>[0];

describe("toBikeDetailDto", () => {
  it("maps parts, plans, totals and events", () => {
    const detail = {
      bike: { id: "b1", name: "Gravel", type: "GRAVEL", archivedAt: null },
      totals: { km: 1200, hours: 45 },
      rideCount: 30,
      removed: [{}, {}],
      parts: [
        {
          id: "p1",
          position: null,
          installedAt: new Date("2026-01-02T00:00:00Z"),
          component: { brand: "Shimano", model: "XT", category: { name: "Corrente" } },
          planViews: [
            { id: "pl1", name: "Troca", action: "REPLACE", intervalKm: 3000, intervalHours: null, wear: { km: 2500, hours: 0, ratio: 0.83, status: "near", alert: "Atenção" } },
          ],
        },
      ],
      events: [{ id: "e1", type: "SERVICE", date: new Date("2026-02-01T00:00:00Z"), note: "Lubrificação", visit: { shop: "Oficina X" } }],
    } as unknown as Input;
    const dto = toBikeDetailDto(detail);
    expect(dto).toMatchObject({ id: "b1", archived: false, removedCount: 2, totals: { km: 1200, hours: 45, rides: 30 } });
    expect(dto.parts[0]).toMatchObject({ label: "Corrente", componentLabel: "Shimano XT" });
    expect(dto.parts[0].plans[0]).toMatchObject({ status: "near", ratio: 0.83 });
    expect(dto.events[0]).toMatchObject({ note: "Lubrificação", shop: "Oficina X" });
  });
});
