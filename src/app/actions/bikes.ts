"use server";
// RF01, RF02, RF03, RF05, RF10, RF12, RF35, RB01, RB05, RB13, RB15, RB16, RB18: the athlete's bikes and parts.
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseLocalDay } from "@/lib/dates";
import { bikeType, optInterval, optNumber, optYear, readPlans, text } from "@/lib/forms";
import { requireUser } from "@/lib/guards";
import { bikeTypeFromCategory, canResetPlan, plansFor } from "@/lib/catalog/rules";

/** Loads a bike only if it belongs to the user; otherwise back to the list. */
async function ownBike(userId: string, bikeId: string) {
  const bike = await prisma.bike.findFirst({ where: { id: bikeId, userId } });
  if (!bike) redirect("/bikes?erro=bike_nao_encontrada");
  return bike;
}

async function ownPart(userId: string, partId: string) {
  const part = await prisma.part.findFirst({ where: { id: partId, bike: { userId } }, include: { plans: true, component: true } });
  if (!part) redirect("/bikes?erro=peca_nao_encontrada");
  return part;
}

function bikeFields(form: FormData) {
  return {
    name: text(form, "name", 60),
    type: bikeType(form),
    brand: text(form, "brand", 60) || null,
    model: text(form, "model", 80) || null,
    year: optYear(form, "year"),
  };
}

/** RF01, RF35: a new bike, optionally from a catalog model with its original parts installed. */
export async function createBike(form: FormData) {
  const user = await requireUser();
  const f = bikeFields(form);
  const modelId = text(form, "bikeModelId", 40);
  if (!modelId) {
    if (!f.name || !f.type) redirect("/bikes?erro=bike_invalida");
    const bike = await prisma.bike.create({ data: { ...f, type: f.type!, userId: user.id } });
    redirect(`/bikes/${bike.id}?ok=bike`);
  }
  const model = await prisma.bikeModel.findFirst({
    where: { id: modelId, active: true },
    include: { parts: { include: { component: { include: { plans: true, category: { include: { plans: true } } } } } } },
  });
  const installedAt = parseLocalDay(text(form, "installedAt", 10));
  if (!model || !installedAt) redirect("/bikes?erro=modelo_invalido");
  const bike = await prisma.bike.create({
    data: {
      userId: user.id,
      bikeModelId: model!.id,
      name: f.name || `${model!.brand} ${model!.model}`,
      type: bikeTypeFromCategory(model!.category),
      brand: model!.brand,
      model: model!.model,
      year: f.year,
      parts: {
        create: model!.parts.map((p) => ({
          componentId: p.componentId,
          position: p.position,
          installedAt: installedAt!,
          plans: { create: plansFor(p.component.plans, p.component.category.plans) },
        })),
      },
    },
  });
  redirect(`/bikes/${bike.id}?ok=bike_modelo`);
}

/** RF01 */
export async function updateBike(form: FormData) {
  const user = await requireUser();
  const bike = await ownBike(user.id, text(form, "bikeId", 40));
  const f = bikeFields(form);
  if (!f.name || !f.type) redirect(`/bikes/${bike.id}?erro=bike_invalida`);
  await prisma.bike.update({ where: { id: bike.id }, data: { ...f, type: f.type! } });
  redirect(`/bikes/${bike.id}?ok=bike`);
}

/** RF01: archive keeps parts, rides and history. */
export async function toggleArchiveBike(form: FormData) {
  const user = await requireUser();
  const bike = await ownBike(user.id, text(form, "bikeId", 40));
  await prisma.bike.update({ where: { id: bike.id }, data: { archivedAt: bike.archivedAt ? null : new Date() } });
  redirect(bike.archivedAt ? `/bikes/${bike.id}?ok=desarquivada` : "/bikes?ok=arquivada");
}

/** RF05: link the GearLog bike to a bike of the athlete's source and attach its rides. */
export async function linkSourceBike(form: FormData) {
  const user = await requireUser();
  const bike = await ownBike(user.id, text(form, "bikeId", 40));
  const gearId = text(form, "stravaGearId", 40) || null;
  if (gearId) {
    const taken = await prisma.bike.findFirst({ where: { userId: user.id, stravaGearId: gearId, NOT: { id: bike.id } } });
    if (taken) redirect(`/bikes/${bike.id}?erro=gear_em_uso`);
  }
  await prisma.$transaction([
    prisma.bike.update({ where: { id: bike.id }, data: { stravaGearId: gearId } }),
    // Rides of the previous gear leave this bike; rides of the new gear join it.
    prisma.ride.updateMany({ where: { userId: user.id, bikeId: bike.id, externalId: { not: null } }, data: { bikeId: null } }),
    ...(gearId ? [prisma.ride.updateMany({ where: { userId: user.id, stravaGearId: gearId }, data: { bikeId: bike.id } })] : []),
  ]);
  redirect(`/bikes/${bike.id}?ok=associada`);
}

/** RF02, RF03, RB15, RB16: install a catalog component with its plans. */
export async function createPart(form: FormData) {
  const user = await requireUser();
  const bike = await ownBike(user.id, text(form, "bikeId", 40));
  const component = await prisma.component.findFirst({
    where: { id: text(form, "componentId", 40), active: true, category: { active: true } },
    include: { plans: true, category: { include: { plans: true } } },
  });
  const installedAt = parseLocalDay(text(form, "installedAt", 10));
  const plans = readPlans(form);
  const back = `/bikes/${bike.id}/peca?categoria=${text(form, "categoryId", 40)}&componente=${text(form, "componentId", 40)}`;
  if (!component) redirect(`${back}&erro=componente`);
  if (!installedAt) redirect(`${back}&erro=data`);
  // RB16: a part has plans unless its catalog entry has none (no regular wear).
  if (plans.length === 0 && plansFor(component!.plans, component!.category.plans).length > 0) redirect(`${back}&erro=planos`);
  await prisma.part.create({
    data: {
      bikeId: bike.id,
      componentId: component!.id,
      position: text(form, "position", 40) || null,
      installedAt: installedAt!,
      initialKm: optNumber(form, "initialKm") ?? 0,
      initialHours: optNumber(form, "initialHours") ?? 0,
      plans: { create: plans },
    },
  });
  redirect(`/bikes/${bike.id}?ok=peca`);
}

/** RB16: the athlete edits the intervals of a part's plan. */
export async function updatePlan(form: FormData) {
  const user = await requireUser();
  const plan = await prisma.maintenancePlan.findFirst({ where: { id: text(form, "planId", 40), part: { bike: { userId: user.id } } }, include: { part: true } });
  if (!plan) redirect("/bikes?erro=peca_nao_encontrada");
  const intervalKm = optInterval(form, "intervalKm");
  const intervalHours = optInterval(form, "intervalHours");
  const warnKm = optInterval(form, "warnKm");
  const warnHours = optInterval(form, "warnHours");
  if (intervalKm === null && intervalHours === null) redirect(`/bikes/${plan!.part.bikeId}?erro=plano_invalido`);
  await prisma.maintenancePlan.update({ where: { id: plan!.id }, data: { intervalKm, intervalHours, warnKm, warnHours } });
  redirect(`/bikes/${plan!.part.bikeId}?ok=plano`);
}

/**
 * RB13: a service restarts that plan's usage without closing the part. RB18: so does replacing
 * one consumable of a part with several plans (e.g. the chain of a groupset).
 */
export async function servicePlan(form: FormData) {
  const user = await requireUser();
  const plan = await prisma.maintenancePlan.findFirst({
    where: { id: text(form, "planId", 40), part: { removedAt: null, bike: { userId: user.id } } },
    include: { part: { include: { component: { include: { category: true } }, _count: { select: { plans: true } } } } },
  });
  if (!plan) redirect("/bikes?erro=peca_nao_encontrada");
  if (!canResetPlan(plan!.action, plan!.part._count.plans)) redirect(`/bikes/${plan!.part.bikeId}?erro=plano_invalido`);
  const date = parseLocalDay(text(form, "date", 10));
  const bikeId = plan!.part.bikeId;
  if (!date || date < plan!.part.installedAt) redirect(`/bikes/${bikeId}?erro=data`);
  const c = plan!.part.component;
  await prisma.$transaction([
    prisma.maintenancePlan.update({ where: { id: plan!.id }, data: { lastServiceAt: date } }),
    prisma.maintenanceEvent.create({
      data: {
        bikeId,
        partId: plan!.partId,
        type: plan!.action === "SERVICE" ? "SERVICE" : "REPLACEMENT",
        date: date!,
        note: `${plan!.name}: ${c.category.name} ${c.brand} ${c.model}`,
      },
    }),
  ]);
  redirect(`/bikes/${bikeId}?ok=${plan!.action === "SERVICE" ? "revisao" : "troca_item"}`);
}

/** RF10, RB05, OPEN-16: close the old part and start a new one with the same plans, zeroed. */
export async function replacePart(form: FormData) {
  const user = await requireUser();
  const old = await ownPart(user.id, text(form, "partId", 40));
  const bikeId = old.bikeId;
  const date = parseLocalDay(text(form, "date", 10));
  if (old.removedAt) redirect(`/bikes/${bikeId}?erro=peca_encerrada`);
  if (!date || date < old.installedAt) redirect(`/bikes/${bikeId}?erro=data`);
  const componentId = text(form, "componentId", 40) || old.componentId;
  const component = await prisma.component.findFirst({
    where: { id: componentId, categoryId: old.component.categoryId, OR: [{ active: true }, { id: old.componentId }] },
    include: { category: true },
  });
  if (!component) redirect(`/bikes/${bikeId}?erro=componente`);
  const note = text(form, "note", 200);
  await prisma.$transaction(async (tx) => {
    await tx.part.update({ where: { id: old.id }, data: { removedAt: date } });
    await tx.maintenanceEvent.create({
      data: {
        bikeId,
        partId: old.id,
        type: "REPLACEMENT",
        date: date!,
        note: `${component!.category.name}: ${old.component.brand} ${old.component.model} → ${component!.brand} ${component!.model}${note ? ` (${note})` : ""}`,
      },
    });
    await tx.part.create({
      data: {
        bikeId,
        componentId: component!.id,
        position: old.position,
        installedAt: date!,
        plans: { create: old.plans.map((p) => ({ name: p.name, intervalKm: p.intervalKm, intervalHours: p.intervalHours, warnKm: p.warnKm, warnHours: p.warnHours, action: p.action })) },
      },
    });
  });
  redirect(`/bikes/${bikeId}?ok=troca`);
}

/** RF12: manual maintenance without replacing a part (e.g. lubrication). */
export async function addManualMaintenance(form: FormData) {
  const user = await requireUser();
  const bike = await ownBike(user.id, text(form, "bikeId", 40));
  const date = parseLocalDay(text(form, "date", 10));
  const note = text(form, "note", 200);
  if (!date || !note) redirect(`/bikes/${bike.id}?erro=manutencao_invalida`);
  const partId = text(form, "partId", 40);
  const part = partId ? await prisma.part.findFirst({ where: { id: partId, bikeId: bike.id } }) : null;
  await prisma.maintenanceEvent.create({ data: { bikeId: bike.id, partId: part?.id ?? null, type: "MANUAL", date: date!, note } });
  redirect(`/bikes/${bike.id}?ok=manutencao`);
}
