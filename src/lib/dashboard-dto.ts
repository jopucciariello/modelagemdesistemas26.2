// RF15: JSON shape of the dashboard for the Expo app (issue #64). Pure, so it is tested without a DB.
import type { loadDashboard } from "@/lib/tracker";

type Dashboard = Awaited<ReturnType<typeof loadDashboard>>;

export type PlanDto = {
  planId: string;
  partLabel: string;
  componentLabel: string;
  planName: string;
  action: "REPLACE" | "SERVICE";
  intervalKm: number | null;
  intervalHours: number | null;
  km: number;
  hours: number;
  ratio: number;
  status: "ok" | "near" | "due";
  alert: string | null;
};

export type BikeDto = {
  id: string;
  name: string;
  hasPhoto: boolean;
  photoVersion: number | null;
  alerts: number;
  due: number;
  plans: PlanDto[];
};

export type DashboardDto = { counts: { due: number; near: number; ok: number }; bikes: BikeDto[] };

export function toDashboardDto(data: Dashboard): DashboardDto {
  const plansByBike = new Map<string, PlanDto[]>();
  for (const r of data.rows) {
    const dto: PlanDto = {
      planId: r.plan.id,
      partLabel: r.part.position ?? r.part.component.category.name,
      componentLabel: `${r.part.component.brand} ${r.part.component.model}`,
      planName: r.plan.name,
      action: r.plan.action,
      intervalKm: r.plan.intervalKm,
      intervalHours: r.plan.intervalHours,
      km: r.wear.km,
      hours: r.wear.hours,
      ratio: r.wear.ratio,
      status: r.wear.status,
      alert: r.wear.alert,
    };
    plansByBike.set(r.bikeId, [...(plansByBike.get(r.bikeId) ?? []), dto]);
  }
  const bikes = data.bikes
    .map((b) => {
      const plans = plansByBike.get(b.id) ?? [];
      return {
        id: b.id,
        name: b.name,
        hasPhoto: b.photoVersion !== null,
        photoVersion: b.photoVersion,
        alerts: plans.filter((p) => p.status !== "ok").length,
        due: plans.filter((p) => p.status === "due").length,
        plans,
      };
    })
    .sort((a, b) => b.due - a.due || b.alerts - a.alerts);
  const all = data.rows.map((r) => r.wear.status);
  const due = all.filter((s) => s === "due").length;
  const near = all.filter((s) => s === "near").length;
  return { counts: { due, near, ok: all.length - due - near }, bikes };
}
