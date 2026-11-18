// RF36, RF28: writes a shop visit (several items, each with its action and condition) to a bike's
// history. Used by the athlete (RF36) and by the workshop when it concludes an appointment (RF28).
import "server-only";
import { parseLocalDay } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { text } from "@/lib/forms";
import { readVisitItems, visitItemNote, visitRows } from "@/lib/visit";
import { advanceStage, parseStages } from "@/lib/workshop";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export type RecordVisitResult = { ok: true; visitId: string } | { ok: false; error: "visita_vazia" | "data" | "plano_invalido" };

/**
 * Reads date, note and items from `form` and records the visit on `bikeId`. The caller must have
 * checked that the bike may be written to. `inTransaction` runs in the same transaction (used to
 * mark an appointment as concluded together with its visit, INV-066).
 */
export async function recordVisit(input: {
  bikeId: string;
  form: FormData;
  shop: string | null;
  inTransaction?: (tx: Tx, visitId: string) => Promise<void>;
}): Promise<RecordVisitResult> {
  const { bikeId, form, shop } = input;
  const date = parseLocalDay(text(form, "date", 10));
  const parts = await prisma.part.findMany({
    where: { bikeId, removedAt: null },
    include: { plans: true, component: { include: { category: true } } },
  });
  const rows = visitRows(parts);
  const items = readVisitItems(form, rows);
  if (!date || items.length === 0) return { ok: false, error: "visita_vazia" };
  const partById = new Map(parts.map((p) => [p.id, p]));
  const rowByPlan = new Map(rows.filter((r) => r.planId).map((r) => [r.planId!, r]));
  for (const item of items) {
    const part = item.partId ? partById.get(item.partId) : null;
    if (part && item.action !== "check" && date < part.installedAt) return { ok: false, error: "data" };
    if (item.action === "reset" && (!item.planId || !rowByPlan.get(item.planId)?.canReset)) return { ok: false, error: "plano_invalido" };
  }
  const visitId = await prisma.$transaction(async (tx) => {
    const visit = await tx.serviceVisit.create({ data: { bikeId, date, shop, note: text(form, "note", 200) || null } });
    const replaced = new Set<string>();
    for (const item of items) {
      const part = item.partId ? partById.get(item.partId)! : null;
      const base = { bikeId, partId: part?.id ?? null, date, visitId: visit.id, condition: item.condition };
      if (item.action === "replace" && part) {
        if (replaced.has(part.id)) continue;
        replaced.add(part.id);
        await tx.part.update({ where: { id: part.id }, data: { removedAt: date } });
        await tx.part.create({
          data: {
            bikeId,
            componentId: part.componentId,
            position: part.position,
            installedAt: date,
            plans: {
              create: part.plans.map((p) => {
                // RB23: a new part restarts at the first revision stage.
                const first = parseStages(p.stageHours)[0];
                return { name: p.name, intervalKm: p.intervalKm, intervalHours: first ?? p.intervalHours, warnKm: p.warnKm, warnHours: p.warnHours, action: p.action, stageHours: p.stageHours };
              }),
            },
          },
        });
        await tx.maintenanceEvent.create({ data: { ...base, type: "REPLACEMENT", note: visitItemNote({ ...item, label: part.position ?? part.component.category.name }, "peça trocada") } });
      } else if (item.action === "reset" && part && !replaced.has(part.id)) {
        const plan = part.plans.find((p) => p.id === item.planId)!;
        // RB23: a staged revision moves the wear target to the next stage (the last one repeats).
        const next = advanceStage(parseStages(plan.stageHours), plan.stageIndex);
        await tx.maintenancePlan.update({
          where: { id: plan.id },
          data: { lastServiceAt: date, ...(next ? { stageIndex: next.index, intervalHours: next.target } : {}) },
        });
        await tx.maintenanceEvent.create({ data: { ...base, type: plan.action === "SERVICE" ? "SERVICE" : "REPLACEMENT", note: visitItemNote(item, plan.action === "SERVICE" ? "revisado" : "trocado") } });
      } else if (!part || !replaced.has(part.id)) {
        await tx.maintenanceEvent.create({ data: { ...base, type: "MANUAL", note: visitItemNote(item, item.action === "replace" ? "trocado" : "verificado") } });
      }
    }
    if (input.inTransaction) await input.inTransaction(tx, visit.id);
    return visit.id;
  });
  return { ok: true, visitId };
}
