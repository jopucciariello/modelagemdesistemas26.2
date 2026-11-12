// RF07-RF09, RF11, RF15: read models for the tracker screens (DB reads + pure wear rules).
import "server-only";
import { prisma } from "@/lib/db";
import { byWearDesc, computePlanWear, type PlanWear } from "@/lib/wear";

const partInclude = { component: { include: { category: true } }, plans: { orderBy: { name: "asc" } } } as const;

type LoadedPart = Awaited<ReturnType<typeof loadParts>>[number];
type RideRow = { bikeId: string | null; startDate: Date; distanceKm: number; movingHours: number; sportType: string };

function loadParts(where: { bikeId?: string; bike?: { userId: string; archivedAt: null } }) {
  return prisma.part.findMany({ where: { ...where, removedAt: null }, include: partInclude, orderBy: { installedAt: "asc" } });
}

export type PlanView = LoadedPart["plans"][number] & { wear: PlanWear };
export type PartView = LoadedPart & { planViews: PlanView[]; worst: PlanWear | null };

function withWear(part: LoadedPart, rides: readonly RideRow[]): PartView {
  const wearPart = {
    installedAt: part.installedAt,
    removedAt: part.removedAt,
    initialKm: part.initialKm,
    initialHours: part.initialHours,
    wearsOnTrainer: part.component.category.wearsOnTrainer,
  };
  const bikeRides = rides.filter((r) => r.bikeId === part.bikeId);
  const planViews = byWearDesc(part.plans.map((plan) => ({ ...plan, wear: computePlanWear(wearPart, plan, bikeRides) })));
  return { ...part, planViews, worst: planViews[0]?.wear ?? null };
}

const rideSelect = { bikeId: true, startDate: true, distanceKm: true, movingHours: true, sportType: true } as const;

/** Bike page: active parts with wear, replaced parts and the history (RF11, chronological). */
export async function loadBikeDetail(userId: string, bikeId: string) {
  const bike = await prisma.bike.findFirst({ where: { id: bikeId, userId } });
  if (!bike) return null;
  const [parts, removed, events, rides] = await Promise.all([
    loadParts({ bikeId }),
    prisma.part.findMany({ where: { bikeId, removedAt: { not: null } }, include: partInclude, orderBy: { removedAt: "desc" } }),
    prisma.maintenanceEvent.findMany({ where: { bikeId }, orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
    prisma.ride.findMany({ where: { bikeId }, select: rideSelect }),
  ]);
  const totals = rides.reduce((t, r) => ({ km: t.km + r.distanceKm, hours: t.hours + r.movingHours }), { km: 0, hours: 0 });
  return { bike, parts: parts.map((p) => withWear(p, rides)), removed, events, totals, rideCount: rides.length };
}

/** RF15: every plan of every active part of the athlete's active bikes, most worn first. */
export async function loadDashboard(userId: string) {
  const [parts, rides, bikes] = await Promise.all([
    loadParts({ bike: { userId, archivedAt: null } }),
    prisma.ride.findMany({ where: { userId, bike: { archivedAt: null } }, select: rideSelect }),
    prisma.bike.findMany({ where: { userId, archivedAt: null }, select: { id: true, name: true } }),
  ]);
  const bikeName = new Map(bikes.map((b) => [b.id, b.name]));
  const rows = parts.flatMap((p) => {
    const view = withWear(p, rides);
    return view.planViews.map((plan) => ({ bikeId: p.bikeId, bikeName: bikeName.get(p.bikeId) ?? "", part: view, plan, wear: plan.wear }));
  });
  return { rows: byWearDesc(rows), bikeCount: bikes.length };
}
