// RF01, RF02, RF07-RF09, RF11: JSON shape of a bike page for the Expo app (issue #64). Pure.
import type { loadBikeDetail } from "@/lib/tracker";
import type { PlanDto } from "@/lib/dashboard-dto";

type Detail = NonNullable<Awaited<ReturnType<typeof loadBikeDetail>>>;

export type PartDto = {
  id: string;
  label: string;
  componentLabel: string;
  installedAt: string;
  plans: PlanDto[];
};

export type EventDto = { id: string; type: "REPLACEMENT" | "SERVICE" | "MANUAL"; date: string; note: string; shop: string | null };

export type BikeDetailDto = {
  id: string;
  name: string;
  type: string;
  archived: boolean;
  totals: { km: number; hours: number; rides: number };
  parts: PartDto[];
  removedCount: number;
  events: EventDto[];
};

export function toBikeDetailDto(detail: Detail): BikeDetailDto {
  return {
    id: detail.bike.id,
    name: detail.bike.name,
    type: detail.bike.type,
    archived: detail.bike.archivedAt !== null,
    totals: { km: detail.totals.km, hours: detail.totals.hours, rides: detail.rideCount },
    parts: detail.parts.map((part) => ({
      id: part.id,
      label: part.position ?? part.component.category.name,
      componentLabel: `${part.component.brand} ${part.component.model}`,
      installedAt: part.installedAt.toISOString(),
      plans: part.planViews.map((plan) => ({
        planId: plan.id,
        partLabel: part.position ?? part.component.category.name,
        componentLabel: `${part.component.brand} ${part.component.model}`,
        planName: plan.name,
        action: plan.action,
        intervalKm: plan.intervalKm,
        intervalHours: plan.intervalHours,
        km: plan.wear.km,
        hours: plan.wear.hours,
        ratio: plan.wear.ratio,
        status: plan.wear.status,
        alert: plan.wear.alert,
      })),
    })),
    removedCount: detail.removed.length,
    events: detail.events.map((e) => ({
      id: e.id,
      type: e.type,
      date: e.date.toISOString(),
      note: e.note,
      shop: e.visit?.shop ?? null,
    })),
  };
}
