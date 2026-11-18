"use server";
// RF25-RF29, RNF03, RB09, RB21, RB22: workshops, appointments and concluding a service (SPEC-011..010).
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { text } from "@/lib/forms";
import { requireAdmin, requireUser, requireWorkshop, requireWorkshopOwner } from "@/lib/guards";
import { bookAt, cancelFor, concludeFor } from "@/lib/workshop-agenda";
import { canBook, canDecideRequest, canInviteMechanic, cleanWorkshopRequest, parseIncludes, parseSlotStart } from "@/lib/workshop";

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

// ---- RF25, OPEN-40: the shop asks for registration; the admin approves ----

export async function requestWorkshop(form: FormData) {
  const user = await requireUser();
  if (!user.email) redirect("/oficina?erro=pedido_invalido");
  const input = cleanWorkshopRequest({ name: form.get("name"), contact: form.get("contact"), requestText: form.get("requestText") });
  if (!input) redirect("/oficina?erro=pedido_invalido");
  const ownerEmail = user.email!.toLowerCase();
  const existing = await prisma.workshop.findUnique({ where: { ownerEmail } });
  if (existing && !canDecideRequest(existing.status, "reopen")) redirect("/oficina?erro=pedido_existe");
  if (existing) await prisma.workshop.update({ where: { id: existing.id }, data: { ...input!, status: "PENDING", active: false } });
  else await prisma.workshop.create({ data: { ...input!, ownerEmail, status: "PENDING", active: false } });
  redirect("/oficina?ok=pedido");
}

export async function decideWorkshopRequest(form: FormData) {
  await requireAdmin();
  const decision = text(form, "decision", 10) === "approve" ? "approve" : "reject";
  const workshop = await prisma.workshop.findUnique({ where: { id: text(form, "id", 40) } });
  if (!workshop || !canDecideRequest(workshop.status, decision)) redirect("/admin?erro=oficina_invalida");
  const approved = decision === "approve";
  await prisma.workshop.update({ where: { id: workshop!.id }, data: { status: approved ? "ACTIVE" : "REJECTED", active: approved } });
  redirect("/admin?ok=oficina");
}

// ---- RF25, RB21: the owner invites mechanics by e-mail ----

export async function inviteMechanic(form: FormData) {
  const { workshop, user } = await requireWorkshopOwner();
  const email = text(form, "email", 120).toLowerCase();
  if (!EMAIL.test(email)) redirect("/oficina?erro=convite_invalido");
  const members = await prisma.workshopMember.findMany({ where: { workshopId: workshop.id }, select: { email: true } });
  const check = canInviteMechanic(user.email, workshop.ownerEmail, email, members.map((m) => m.email));
  if (check !== "ok") redirect(`/oficina?erro=convite_${check}`);
  await prisma.workshopMember.create({ data: { workshopId: workshop.id, email } });
  redirect("/oficina?ok=convite");
}

export async function removeMechanic(form: FormData) {
  const { workshop } = await requireWorkshopOwner();
  await prisma.workshopMember.deleteMany({ where: { id: text(form, "id", 40), workshopId: workshop.id } });
  redirect("/oficina?ok=convite_removido");
}

export async function toggleWorkshop(form: FormData) {
  await requireAdmin();
  const workshop = await prisma.workshop.findUnique({ where: { id: text(form, "id", 40) } });
  // Pending or rejected requests change state only through decideWorkshopRequest.
  if (!workshop || workshop.status !== "ACTIVE") redirect("/admin?erro=oficina_invalida");
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
  const result = await cancelFor(user.id, user.name, text(form, "id", 40));
  redirect(result.ok ? "/agendamentos?ok=cancelado" : "/agendamentos?erro=nao_cancelavel");
}

// ---- RF28: the workshop concludes the service ----

export async function concludeAppointment(form: FormData) {
  const { workshop } = await requireWorkshop();
  const id = text(form, "id", 40);
  const result = await concludeFor(workshop, id, form);
  if (result.ok) redirect("/oficina?ok=concluido");
  if (result.error === "not_found" || result.error === "not_scheduled") redirect("/oficina?erro=atendimento_invalido");
  redirect(`/oficina/atendimentos/${id}?erro=${result.error}`);
}

// ---- RF26, RF27: book on the weekly grid (duration-aware), athlete chooses to share history ----

export async function bookOnGrid(form: FormData) {
  const user = await requireUser();
  await connection();
  const workshopId = text(form, "workshopId", 40);
  const startsAt = new Date(text(form, "startsAt", 30));
  const back = `/oficinas/${workshopId}`;
  if (Number.isNaN(startsAt.getTime())) redirect(`${back}?erro=dados_invalidos`);
  const result = await bookAt({
    userId: user.id, workshopId, serviceId: text(form, "serviceId", 40), bikeId: text(form, "bikeId", 40), startsAt,
    shareHistory: form.get("shareHistory") === "on",
  });
  if (!result.ok) redirect(`${back}?erro=${result.error === "invalid" ? "dados_invalidos" : "horario_indisponivel"}`);
  redirect("/agendamentos?ok=agendado");
}
