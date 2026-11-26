// RF14, OPEN-20: rides typed by hand and the bike choice of a ride without one (shared by actions and API).
import "server-only";
import { prisma } from "@/lib/db";
import { parseLocalDay, toLocalDay } from "@/lib/dates";
import { parseDecimal } from "@/lib/forms";
import { CYCLING_SPORT_TYPES } from "@/lib/wear";

export type ManualRideInput = { date: string; distanceKm: string; movingHours: string; sportType: string };

/** RF14: validates a typed ride. Null when invalid (date, empty, over 2000 km or 72 h). */
export function parseManualRide(input: ManualRideInput) {
  const startDate = parseLocalDay(input.date, 12);
  const distanceKm = parseDecimal(input.distanceKm);
  const movingHours = parseDecimal(input.movingHours);
  if (!startDate || distanceKm === null || movingHours === null) return null;
  if ((distanceKm === 0 && movingHours === 0) || distanceKm > 2000 || movingHours > 72) return null;
  const sportType = (CYCLING_SPORT_TYPES as readonly string[]).includes(input.sportType) ? input.sportType : "Ride";
  return { startDate, distanceKm, movingHours, sportType };
}

export async function createManualRideFor(userId: string, bikeId: string, input: ManualRideInput): Promise<boolean> {
  const bike = await prisma.bike.findFirst({ where: { id: bikeId, userId, archivedAt: null } });
  const ride = parseManualRide(input);
  if (!bike || !ride) return false;
  await prisma.ride.create({ data: { userId, bikeId: bike.id, source: "MANUAL", ...ride } });
  return true;
}

/** OPEN-20: pick (or clear, with an empty bikeId) the bike of a ride the source sent without one. */
export async function chooseRideBikeFor(userId: string, rideId: string, bikeId: string): Promise<boolean> {
  const ride = await prisma.ride.findFirst({ where: { id: rideId, userId, stravaGearId: null } });
  if (!ride) return false;
  const bike = bikeId ? await prisma.bike.findFirst({ where: { id: bikeId, userId, archivedAt: null } }) : null;
  if (bikeId && !bike) return false;
  const day = parseLocalDay(toLocalDay(ride.startDate));
  const parts = bike && day ? await prisma.part.findMany({ where: { bikeId: bike.id }, select: { id: true, installedAt: true, removedAt: true } }) : [];
  const backdate = day ? originalPartsToBackdate(parts, day) : [];
  await prisma.$transaction([
    prisma.ride.update({ where: { id: ride.id }, data: { bikeId: bike?.id ?? null, bikeChosen: Boolean(bike) } }),
    ...(backdate.length ? [prisma.part.updateMany({ where: { id: { in: backdate } }, data: { installedAt: day! } })] : []),
  ]);
  return true;
}

/**
 * RB02: a ride from before the bike's original parts were registered still belongs to the bike
 * once the athlete assigns it, so the original parts (earliest installation date) start at that
 * day and the ride counts in their wear. Parts replaced before that day stay as they are.
 */
export function originalPartsToBackdate(parts: { id: string; installedAt: Date; removedAt: Date | null }[], rideDay: Date): string[] {
  if (parts.length === 0) return [];
  const first = Math.min(...parts.map((p) => p.installedAt.getTime()));
  if (rideDay.getTime() >= first) return [];
  return parts.filter((p) => p.installedAt.getTime() === first && (!p.removedAt || p.removedAt > rideDay)).map((p) => p.id);
}
