// RF25, RF26, RF27 (#69, #31, #32): database glue for nearby workshops, free times and booking.
// Framework-agnostic (no Next imports) so the Expo API layer can reuse it.
import { prisma } from "@/lib/db";
import { type Coords, sortByDistance } from "@/lib/geo";
import { availableStarts, canBook } from "@/lib/workshop";

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
