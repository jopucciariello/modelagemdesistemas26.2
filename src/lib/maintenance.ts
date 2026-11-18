// RF10, RF12, RB05, RB13, RB16: maintenance writes shared by the server actions and the app's API.
import "server-only";
import { prisma } from "@/lib/db";
import { parseLocalDay } from "@/lib/dates";
import { canResetPlan } from "@/lib/catalog/rules";

/** `bikeId` is set when the bike is known, so callers can send the user back to it. */
export type MaintenanceResult = { ok: true; bikeId: string; flash: string } | { ok: false; error: string; bikeId?: string };

/** RB13: restart one plan's usage (service) or record that one item was replaced. */
export async function servicePlanFor(userId: string, planId: string, day: string): Promise<MaintenanceResult> {
  const plan = await prisma.maintenancePlan.findFirst({
    where: { id: planId, part: { removedAt: null, bike: { userId } } },
    include: { part: { include: { component: { include: { category: true } }, _count: { select: { plans: true } } } } },
  });
  if (!plan) return { ok: false, error: "peca_nao_encontrada" };
  const bikeId = plan.part.bikeId;
  if (!canResetPlan(plan.action, plan.part._count.plans)) return { ok: false, error: "plano_invalido", bikeId };
  const date = parseLocalDay(day);
  if (!date || date < plan.part.installedAt) return { ok: false, error: "data", bikeId };
  const c = plan.part.component;
  await prisma.$transaction([
    prisma.maintenancePlan.update({ where: { id: plan.id }, data: { lastServiceAt: date } }),
    prisma.maintenanceEvent.create({
      data: {
        bikeId,
        partId: plan.partId,
        type: plan.action === "SERVICE" ? "SERVICE" : "REPLACEMENT",
        date,
        note: `${plan.name}: ${c.category.name} ${c.brand} ${c.model}`,
      },
    }),
  ]);
  return { ok: true, bikeId, flash: plan.action === "SERVICE" ? "revisao" : "troca_item" };
}

/** RF10, RB05, OPEN-16: close the old part and start a new one with the same plans, zeroed. */
export async function replacePartFor(
  userId: string,
  partId: string,
  day: string,
  componentId: string,
  note: string,
  /** The component was just resolved from the picker (it may be a hidden, hand-typed one, RF31). */
  resolved = false,
): Promise<MaintenanceResult> {
  const old = await prisma.part.findFirst({ where: { id: partId, bike: { userId } }, include: { plans: true, component: true } });
  if (!old) return { ok: false, error: "peca_nao_encontrada" };
  const bikeId = old.bikeId;
  const date = parseLocalDay(day);
  if (old.removedAt) return { ok: false, error: "peca_encerrada", bikeId };
  if (!date || date < old.installedAt) return { ok: false, error: "data", bikeId };
  const component = await prisma.component.findFirst({
    where: { id: componentId || old.componentId, categoryId: old.component.categoryId, OR: [{ active: true }, { id: old.componentId }, ...(resolved && componentId ? [{ id: componentId }] : [])] },
    include: { category: true },
  });
  if (!component) return { ok: false, error: "componente", bikeId };
  await prisma.$transaction(async (tx) => {
    await tx.part.update({ where: { id: old.id }, data: { removedAt: date } });
    await tx.maintenanceEvent.create({
      data: {
        bikeId,
        partId: old.id,
        type: "REPLACEMENT",
        date,
        note: `${component.category.name}: ${old.component.brand} ${old.component.model} → ${component.brand} ${component.model}${note ? ` (${note})` : ""}`,
      },
    });
    await tx.part.create({
      data: {
        bikeId,
        componentId: component.id,
        position: old.position,
        installedAt: date,
        plans: { create: old.plans.map((p) => ({ name: p.name, intervalKm: p.intervalKm, intervalHours: p.intervalHours, warnKm: p.warnKm, warnHours: p.warnHours, action: p.action })) },
      },
    });
  });
  return { ok: true, bikeId, flash: "troca" };
}

/** RF12: manual maintenance without replacing a part (e.g. lubrication). */
export async function addManualMaintenanceFor(
  userId: string,
  bikeId: string,
  day: string,
  note: string,
  partId: string,
): Promise<MaintenanceResult> {
  const bike = await prisma.bike.findFirst({ where: { id: bikeId, userId } });
  if (!bike) return { ok: false, error: "bike_nao_encontrada" };
  const date = parseLocalDay(day);
  if (!date || !note) return { ok: false, error: "manutencao_invalida", bikeId };
  const part = partId ? await prisma.part.findFirst({ where: { id: partId, bikeId } }) : null;
  await prisma.maintenanceEvent.create({ data: { bikeId, partId: part?.id ?? null, type: "MANUAL", date, note } });
  return { ok: true, bikeId, flash: "manutencao" };
}
