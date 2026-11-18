// RF25, RF26, RF27 (#69, #31, #32): database glue for nearby workshops, free times and booking.
// Framework-agnostic (no Next imports) so the Expo API layer can reuse it.
import { prisma } from "@/lib/db";
import { type Coords, sortByDistance } from "@/lib/geo";
import { sendEmail } from "@/lib/email";
import { recordVisit } from "@/lib/visit-record";
import { visitRows } from "@/lib/visit";
import { availableStarts, canBook, canWorkshopReadHistory, cancellationNotice, isLateCancellation } from "@/lib/workshop";

export const AGENDA_DAYS = 14;

/** #69: active workshops with their active services, nearest first when `origin` is given. */
export async function listNearbyWorkshops(origin?: Coords | null) {
  const shops = await prisma.workshop.findMany({
    where: { active: true, status: "ACTIVE" },
    select: {
      id: true, name: true, description: true, address: true, phone: true, website: true, latitude: true, longitude: true,
      services: { where: { active: true }, select: { id: true, name: true, description: true, includes: true, durationMin: true, priceCents: true } },
    },
    orderBy: { name: "asc" },
  });
  return origin ? sortByDistance(shops, origin) : shops.map((s) => ({ ...s, distanceKm: null as number | null }));
}

/** RF26: free start times of a service for the next AGENDA_DAYS days, from the weekly grid. */
export async function freeStarts(workshopId: string, serviceId: string, now = new Date()): Promise<Date[]> {
  const service = await prisma.workshopService.findFirst({ where: { id: serviceId, workshopId, active: true, workshop: { active: true, status: "ACTIVE" } } });
  if (!service) return [];
  const [hours, appointments] = await Promise.all([
    prisma.workshopHour.findMany({ where: { workshopId } }),
    prisma.appointment.findMany({
      where: { workshopId, status: { not: "CANCELLED" }, slot: { startsAt: { gte: now } } },
      select: { endsAt: true, slot: { select: { startsAt: true } }, service: { select: { durationMin: true } } },
    }),
  ]);
  const busy = appointments.map((a) => ({
    startsAt: a.slot.startsAt,
    endsAt: a.endsAt ?? new Date(a.slot.startsAt.getTime() + (a.service?.durationMin ?? 60) * 60_000),
  }));
  return availableStarts({ hours, durationMin: service.durationMin, busy, now, days: AGENDA_DAYS });
}

export type BookResult = { ok: true; appointmentId: string } | { ok: false; error: "invalid" | "unavailable" };

/**
 * RF26, RF27, RB22: books `startsAt` for the athlete's bike. The start must be one of the free
 * starts of the grid; the slot row (unique per workshop and start) is the guard against two
 * bookings at once. `shareHistory` is the athlete's own choice (OPEN-42).
 */
export async function bookAt(input: {
  userId: string; workshopId: string; serviceId: string; bikeId: string; startsAt: Date; shareHistory: boolean; now?: Date;
}): Promise<BookResult> {
  const now = input.now ?? new Date();
  const [bike, service] = await Promise.all([
    prisma.bike.findFirst({ where: { id: input.bikeId, userId: input.userId, archivedAt: null }, select: { id: true } }),
    prisma.workshopService.findFirst({ where: { id: input.serviceId, workshopId: input.workshopId, active: true } }),
  ]);
  if (!bike || !service) return { ok: false, error: "invalid" };
  const starts = await freeStarts(input.workshopId, input.serviceId, now);
  if (!starts.some((d) => d.getTime() === input.startsAt.getTime())) return { ok: false, error: "unavailable" };
  const endsAt = new Date(input.startsAt.getTime() + service.durationMin * 60_000);
  try {
    const appt = await prisma.$transaction(async (tx) => {
      const slot = await tx.workshopSlot.upsert({
        where: { workshopId_startsAt: { workshopId: input.workshopId, startsAt: input.startsAt } },
        create: { workshopId: input.workshopId, startsAt: input.startsAt },
        update: {},
        include: { appointments: { select: { status: true } } },
      });
      if (!canBook(slot.startsAt, slot.appointments, now)) throw new Error("unavailable");
      return tx.appointment.create({
        data: { workshopId: input.workshopId, slotId: slot.id, userId: input.userId, bikeId: bike.id, serviceId: service.id, endsAt, shareHistory: input.shareHistory },
      });
    });
    return { ok: true, appointmentId: appt.id };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

export type CancelResult = { ok: true; late: boolean } | { ok: false; error: "not_cancellable" };

/**
 * RF29: the athlete cancels a scheduled appointment of their own. The workshop gets an in-app notice
 * (urgent under 24 h) and an e-mail; an e-mail failure never blocks the cancellation.
 */
export async function cancelFor(userId: string, userName: string, appointmentId: string, now = new Date()): Promise<CancelResult> {
  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId },
    include: { slot: true, bike: { select: { name: true } }, workshop: { select: { ownerEmail: true, members: { select: { email: true } } } } },
  });
  if (!appt || appt.status !== "SCHEDULED") return { ok: false, error: "not_cancellable" };
  const late = isLateCancellation(appt.slot.startsAt, now);
  const message = cancellationNotice(userName, appt.bike.name, appt.slot.startsAt, late);
  const changed = await prisma.$transaction(async (tx) => {
    const res = await tx.appointment.updateMany({ where: { id: appt.id, status: "SCHEDULED" }, data: { status: "CANCELLED", cancelledAt: now } });
    if (res.count !== 1) return false;
    await tx.workshopNotice.create({ data: { workshopId: appt.workshopId, appointmentId: appt.id, urgent: late, message } });
    return true;
  });
  if (!changed) return { ok: false, error: "not_cancellable" };
  await sendEmail({
    to: [appt.workshop.ownerEmail, ...appt.workshop.members.map((m) => m.email)],
    subject: late ? "GearLog: cancelamento de última hora" : "GearLog: agendamento cancelado",
    text: message,
  });
  return { ok: true, late };
}

/** The athlete's appointments, soonest first (#71). */
export async function listAppointments(userId: string) {
  const rows = await prisma.appointment.findMany({
    where: { userId },
    include: { slot: { select: { startsAt: true } }, workshop: { select: { id: true, name: true, phone: true } }, service: { select: { name: true, durationMin: true } }, bike: { select: { name: true } } },
    orderBy: { slot: { startsAt: "desc" } },
  });
  return rows.map((a) => ({
    id: a.id, status: a.status, startsAt: a.slot.startsAt.toISOString(), endsAt: a.endsAt?.toISOString() ?? null, shareHistory: a.shareHistory,
    workshop: a.workshop, service: a.service, bike: a.bike.name,
  }));
}

export type ConcludeResult = { ok: true } | { ok: false; error: "not_found" | "not_scheduled" | "visita_vazia" | "data" | "plano_invalido" };

/**
 * RF28: the workshop concludes a scheduled appointment. Writes the shop visit to the bike history
 * (RF36) and marks the appointment completed in the same transaction (INV-066). Parts are only
 * listed (and reset) when the athlete shared the history (RF27, RNF03); otherwise free items only.
 */
export async function concludeFor(workshop: { id: string; name: string }, appointmentId: string, form: FormData): Promise<ConcludeResult> {
  const appt = await prisma.appointment.findFirst({ where: { id: appointmentId, workshopId: workshop.id } });
  if (!appt) return { ok: false, error: "not_found" };
  if (appt.status !== "SCHEDULED") return { ok: false, error: "not_scheduled" };
  let raced = false;
  const result = await recordVisit({
    bikeId: appt.bikeId,
    form,
    shop: workshop.name,
    partsAllowed: appt.shareHistory,
    inTransaction: async (tx, visitId) => {
      const res = await tx.appointment.updateMany({ where: { id: appt.id, status: "SCHEDULED" }, data: { status: "COMPLETED", completedAt: new Date(), visitId } });
      if (res.count !== 1) {
        raced = true;
        throw new Error("appointment_not_scheduled");
      }
    },
  }).catch((e) => {
    if (raced) return null;
    throw e;
  });
  if (result === null) return { ok: false, error: "not_scheduled" };
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

/** RF27, RB09, RNF03: what the workshop may see of an appointment (bike, and the history only if shared). */
export async function appointmentForStaff(workshopId: string, appointmentId: string) {
  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, workshopId },
    include: { slot: true, user: { select: { name: true } }, service: true, bike: true },
  });
  if (!appt || appt.status === "CANCELLED") return null;
  const shared = canWorkshopReadHistory([appt], workshopId, appt.bikeId);
  const [parts, events] = shared
    ? await Promise.all([
        prisma.part.findMany({ where: { bikeId: appt.bikeId, removedAt: null }, include: { plans: true, component: { include: { category: true } } }, orderBy: { installedAt: "asc" } }),
        prisma.maintenanceEvent.findMany({ where: { bikeId: appt.bikeId }, orderBy: { date: "desc" }, take: 50 }),
      ])
    : [[], []];
  return {
    id: appt.id,
    status: appt.status,
    startsAt: appt.slot.startsAt.toISOString(),
    athlete: appt.user.name,
    bike: { name: appt.bike.name, brand: appt.bike.brand, model: appt.bike.model, year: appt.bike.year },
    service: appt.service ? { name: appt.service.name, includes: appt.service.includes } : null,
    shareHistory: shared,
    rows: visitRows(parts),
    parts: parts.map((p) => ({ id: p.id, name: p.position ?? p.component.category.name, component: `${p.component.brand} ${p.component.model}`, installedAt: p.installedAt.toISOString() })),
    history: events.map((e) => ({ id: e.id, date: e.date.toISOString(), note: e.note })),
  };
}
