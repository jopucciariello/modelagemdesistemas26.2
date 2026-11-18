// RF14, OPEN-20: rides typed by hand and the bike choice of a ride without one (shared by actions and API).
import "server-only";
import { prisma } from "@/lib/db";
import { parseLocalDay } from "@/lib/dates";
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
  await prisma.ride.update({ where: { id: ride.id }, data: { bikeId: bike?.id ?? null, bikeChosen: Boolean(bike) } });
  return true;
}
