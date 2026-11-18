"use server";
// RF02, RF39, T-09: remove a part from a bike (keep in stock or delete) and install a stocked part.
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseLocalDay } from "@/lib/dates";
import { text } from "@/lib/forms";
import { requireUser } from "@/lib/guards";
import { computePlanWear } from "@/lib/wear";

/** Usage of a part from its installation to its removal, without plan resets (what travels with it). */
async function lifetimeUsage(part: { bikeId: string; installedAt: Date; removedAt: Date | null; initialKm: number; initialHours: number; component: { category: { wearsOnTrainer: boolean } } }) {
  const rides = await prisma.ride.findMany({
    where: { bikeId: part.bikeId },
    select: { startDate: true, distanceKm: true, movingHours: true, sportType: true },
  });
  const plan = { intervalKm: null, intervalHours: null, action: "REPLACE" as const, lastServiceAt: null };
  const wear = computePlanWear({ ...part, wearsOnTrainer: part.component.category.wearsOnTrainer }, plan, rides);
  return { km: wear.km, hours: wear.hours };
}

/** RF02: the athlete removes a part at any time and chooses to keep it in stock or delete it. */
export async function removePart(form: FormData) {
  const user = await requireUser();
  const part = await prisma.part.findFirst({
    where: { id: text(form, "partId", 40), bike: { userId: user.id }, removedAt: null },
    include: { component: { include: { category: true } } },
  });
  if (!part) redirect("/?erro=peca_nao_encontrada");
  const mode = text(form, "mode", 10);
  const date = parseLocalDay(text(form, "date", 10));
  if (!date || date < part!.installedAt) redirect(`/bikes/${part!.bikeId}?erro=data`);
  if (mode === "delete") {
    await prisma.part.delete({ where: { id: part!.id } });
    redirect(`/bikes/${part!.bikeId}?ok=peca_deletada`);
  }
  const usage = await lifetimeUsage({ ...part!, removedAt: date });
  await prisma.$transaction([
    prisma.part.update({ where: { id: part!.id }, data: { removedAt: date, inStock: true, stockKm: usage.km, stockHours: usage.hours } }),
    prisma.maintenanceEvent.create({
      data: { bikeId: part!.bikeId, partId: part!.id, type: "MANUAL", date: date!, note: `${part!.component.category.name}: ${part!.component.brand} ${part!.component.model} guardada no estoque` },
    }),
  ]);
  redirect(`/bikes/${part!.bikeId}?ok=peca_estoque`);
}

/** RF39: installs a stocked part on one of the athlete's bikes, carrying its previous usage. */
export async function installFromStock(form: FormData) {
  const user = await requireUser();
  const stocked = await prisma.part.findFirst({
    where: { id: text(form, "partId", 40), bike: { userId: user.id }, inStock: true },
    include: { plans: true },
  });
  const bike = await prisma.bike.findFirst({ where: { id: text(form, "bikeId", 40), userId: user.id, archivedAt: null } });
  const date = parseLocalDay(text(form, "date", 10));
  if (!stocked || !bike) redirect("/estoque?erro=peca");
  if (!date) redirect("/estoque?erro=data");
  await prisma.$transaction([
    prisma.part.update({ where: { id: stocked!.id }, data: { inStock: false } }),
    prisma.part.create({
      data: {
        bikeId: bike!.id,
        componentId: stocked!.componentId,
        position: stocked!.position,
        installedAt: date!,
        initialKm: stocked!.stockKm,
        initialHours: stocked!.stockHours,
        isUsed: true,
        usedCondition: stocked!.usedCondition,
        plans: { create: stocked!.plans.map((p) => ({ name: p.name, intervalKm: p.intervalKm, intervalHours: p.intervalHours, warnKm: p.warnKm, warnHours: p.warnHours, action: p.action, stageHours: p.stageHours, stageIndex: p.stageIndex })) },
      },
    }),
  ]);
  redirect(`/bikes/${bike!.id}?ok=peca_instalada`);
}
