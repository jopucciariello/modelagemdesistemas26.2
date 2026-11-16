"use server";
// RF25-RF29, RNF03, RB09, RB21, RB22: workshops, appointments and concluding a service (SPEC-011..010).
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { text } from "@/lib/forms";
import { requireAdmin, requireUser, requireWorkshop } from "@/lib/guards";
import { recordVisit } from "@/lib/visit-record";
import { canBook, cancellationNotice, isLateCancellation, parseIncludes, parseSlotStart } from "@/lib/workshop";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---- RF25: admin registers the workshop (RB21) ----

export async function createWorkshop(form: FormData) {
  await requireAdmin();
  const name = text(form, "name", 80);
  const ownerEmail = text(form, "ownerEmail", 120).toLowerCase();
  if (!name || !EMAIL.test(ownerEmail)) redirect("/admin?erro=oficina_invalida");
  if (await prisma.workshop.findUnique({ where: { ownerEmail } })) redirect("/admin?erro=oficina_existe");
  await prisma.workshop.create({ data: { name, ownerEmail } });
  redirect("/admin?ok=oficina");
}

export async function toggleWorkshop(form: FormData) {
  await requireAdmin();
  const workshop = await prisma.workshop.findUnique({ where: { id: text(form, "id", 40) } });
  if (!workshop) redirect("/admin?erro=oficina_invalida");
  await prisma.workshop.update({ where: { id: workshop!.id }, data: { active: !workshop!.active } });
  redirect("/admin?ok=oficina");
}

// ---- RF25: the owner edits profile, services and slots ----

export async function updateWorkshopProfile(form: FormData) {
  const { workshop } = await requireWorkshop();
  const name = text(form, "name", 80);
  if (!name) redirect("/oficina?erro=perfil_invalido");
  await prisma.workshop.update({
    where: { id: workshop.id },
    data: { name, description: text(form, "description", 500) || null, address: text(form, "address", 160) || null, phone: text(form, "phone", 30) || null },
  });
  redirect("/oficina?ok=perfil");
}

export async function addWorkshopService(form: FormData) {
  const { workshop } = await requireWorkshop();
  const name = text(form, "name", 80);
  if (!name) redirect("/oficina?erro=servico_invalido");
  const includes = parseIncludes(String(form.get("includes") ?? "")).join("\n");
  await prisma.workshopService.create({ data: { workshopId: workshop.id, name, description: text(form, "description", 300) || null, includes } });
  redirect("/oficina?ok=servico");
}

export async function removeWorkshopService(form: FormData) {
  const { workshop } = await requireWorkshop();
  // Kept in old appointments; only hidden from new bookings.
  await prisma.workshopService.updateMany({ where: { id: text(form, "id", 40), workshopId: workshop.id }, data: { active: false } });
  redirect("/oficina?ok=servico_removido");
}

export async function addWorkshopSlot(form: FormData) {
  const { workshop } = await requireWorkshop();
  await connection();
  const startsAt = parseSlotStart(form.get("day"), form.get("time"));
  if (!startsAt || startsAt.getTime() <= Date.now()) redirect("/oficina?erro=horario_invalido");
  if (await prisma.workshopSlot.findUnique({ where: { workshopId_startsAt: { workshopId: workshop.id, startsAt: startsAt! } } })) redirect("/oficina?erro=horario_existe");
  await prisma.workshopSlot.create({ data: { workshopId: workshop.id, startsAt: startsAt! } });
  redirect("/oficina?ok=horario");
}

export async function removeWorkshopSlot(form: FormData) {
  const { workshop } = await requireWorkshop();
  const slot = await prisma.workshopSlot.findFirst({ where: { id: text(form, "id", 40), workshopId: workshop.id }, include: { appointments: true } });
  if (!slot) redirect("/oficina?erro=horario_invalido");
  if (slot!.appointments.some((a) => a.status !== "CANCELLED")) redirect("/oficina?erro=horario_ocupado");
  await prisma.workshopSlot.delete({ where: { id: slot!.id } });
  redirect("/oficina?ok=horario_removido");
}

export async function markNoticesRead() {
  const { workshop } = await requireWorkshop();
  await prisma.workshopNotice.updateMany({ where: { workshopId: workshop.id, readAt: null }, data: { readAt: new Date() } });
  redirect("/oficina");
}

// ---- RF26, RF27: the athlete books ----

export async function bookAppointment(form: FormData) {
  const user = await requireUser();
  await connection();
  const workshopId = text(form, "workshopId", 40);
  const back = `/oficinas/${workshopId}`;
  const [workshop, slot, bike, service] = await Promise.all([
    prisma.workshop.findFirst({ where: { id: workshopId, active: true } }),
    prisma.workshopSlot.findFirst({ where: { id: text(form, "slotId", 40), workshopId }, include: { appointments: true } }),
    prisma.bike.findFirst({ where: { id: text(form, "bikeId", 40), userId: user.id, archivedAt: null } }),
    prisma.workshopService.findFirst({ where: { id: text(form, "serviceId", 40), workshopId, active: true } }),
  ]);
  if (!workshop || !slot) redirect("/oficinas?erro=oficina_invalida");
  if (!bike || !service) redirect(`${back}?erro=dados_invalidos`);
  // RF27, OPEN-42: booking is the authorization to share the bike history.
  if (form.get("consent") !== "on") redirect(`${back}?erro=sem_autorizacao`);
  const result = await prisma.$transaction(async (tx) => {
    const fresh = await tx.appointment.findMany({ where: { slotId: slot!.id }, select: { status: true } });
    if (!canBook(slot!.startsAt, fresh, new Date())) return null;
    return tx.appointment.create({ data: { workshopId: workshop!.id, slotId: slot!.id, userId: user.id, bikeId: bike!.id, serviceId: service!.id } });
  });
  if (!result) redirect(`${back}?erro=horario_indisponivel`);
  redirect("/agendamentos?ok=agendado");
}

// ---- RF29: the athlete cancels ----

export async function cancelAppointment(form: FormData) {
  const user = await requireUser();
  await connection();
  const appt = await prisma.appointment.findFirst({
    where: { id: text(form, "id", 40), userId: user.id },
    include: { slot: true, bike: { select: { name: true } } },
  });
  if (!appt || appt.status !== "SCHEDULED") redirect("/agendamentos?erro=nao_cancelavel");
  const now = new Date();
  const late = isLateCancellation(appt!.slot.startsAt, now);
  const changed = await prisma.$transaction(async (tx) => {
    const res = await tx.appointment.updateMany({ where: { id: appt!.id, status: "SCHEDULED" }, data: { status: "CANCELLED", cancelledAt: now } });
    if (res.count !== 1) return false;
    await tx.workshopNotice.create({
      data: { workshopId: appt!.workshopId, appointmentId: appt!.id, urgent: late, message: cancellationNotice(user.name, appt!.bike.name, appt!.slot.startsAt, late) },
    });
    return true;
  });
  redirect(changed ? "/agendamentos?ok=cancelado" : "/agendamentos?erro=nao_cancelavel");
}

// ---- RF28: the workshop concludes the service ----

export async function concludeAppointment(form: FormData) {
  const { workshop } = await requireWorkshop();
  const id = text(form, "id", 40);
  const back = `/oficina/atendimentos/${id}`;
  const appt = await prisma.appointment.findFirst({ where: { id, workshopId: workshop.id } });
  if (!appt || appt.status !== "SCHEDULED") redirect("/oficina?erro=atendimento_invalido");
  let raced = false;
  const result = await recordVisit({
    bikeId: appt!.bikeId,
    form,
    shop: workshop.name,
    inTransaction: async (tx, visitId) => {
      // INV-066: concluding twice at once must write only one visit.
      const res = await tx.appointment.updateMany({ where: { id: appt!.id, status: "SCHEDULED" }, data: { status: "COMPLETED", completedAt: new Date(), visitId } });
      if (res.count !== 1) {
        raced = true;
        throw new Error("appointment_not_scheduled");
      }
    },
  }).catch((e) => {
    if (raced) return null;
    throw e;
  });
  if (result === null) redirect("/oficina?erro=atendimento_invalido");
  if (!result!.ok) redirect(`${back}?erro=${result!.error}`);
  redirect("/oficina?ok=concluido");
}
