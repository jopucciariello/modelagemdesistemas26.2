"use server";
// RF06, RF13, RF14: rides typed by hand and the manual sync with the athlete's source.
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseLocalDay } from "@/lib/dates";
import { optNumber, text } from "@/lib/forms";
import { requireUser } from "@/lib/guards";
import { SyncError, syncRides } from "@/lib/rides/sync";
import { CYCLING_SPORT_TYPES } from "@/lib/wear";

/** RF14: a ride typed by hand (bike, date, km, moving hours). Allowed for any source. */
export async function createManualRide(form: FormData) {
  const user = await requireUser();
  const bike = await prisma.bike.findFirst({ where: { id: text(form, "bikeId", 40), userId: user.id, archivedAt: null } });
  const startDate = parseLocalDay(text(form, "date", 10), 12);
  const distanceKm = optNumber(form, "distanceKm");
  const movingHours = optNumber(form, "movingHours");
  const sport = text(form, "sportType", 30);
  const sportType = (CYCLING_SPORT_TYPES as readonly string[]).includes(sport) ? sport : "Ride";
  if (!bike || !startDate || distanceKm === null || movingHours === null || (distanceKm === 0 && movingHours === 0) || distanceKm > 2000 || movingHours > 72) {
    redirect("/pedais?erro=pedal_invalido");
  }
  await prisma.ride.create({
    data: { userId: user.id, bikeId: bike!.id, source: "MANUAL", sportType, startDate: startDate!, distanceKm: distanceKm!, movingHours: movingHours! },
  });
  redirect("/pedais?ok=pedal");
}

/** OPEN-20: the athlete picks (or clears) the bike of a ride the source sent without one. No default bike. */
export async function chooseRideBike(form: FormData) {
  const user = await requireUser();
  const ride = await prisma.ride.findFirst({ where: { id: text(form, "rideId", 40), userId: user.id, stravaGearId: null } });
  if (!ride) redirect("/pedais?erro=pedal_invalido");
  const bikeId = text(form, "bikeId", 40);
  const bike = bikeId ? await prisma.bike.findFirst({ where: { id: bikeId, userId: user.id, archivedAt: null } }) : null;
  if (bikeId && !bike) redirect("/pedais?erro=pedal_invalido");
  await prisma.ride.update({ where: { id: ride!.id }, data: { bikeId: bike?.id ?? null, bikeChosen: Boolean(bike) } });
  redirect("/pedais?ok=bike_escolhida");
}

/** Only rides typed by hand can be deleted here; imported ones follow the source. */
export async function deleteManualRide(form: FormData) {
  const user = await requireUser();
  await prisma.ride.deleteMany({ where: { id: text(form, "rideId", 40), userId: user.id, source: "MANUAL" } });
  redirect("/pedais?ok=removido");
}

/** RF13: manual retry; the previous data stays if the source fails. */
export async function syncNow() {
  const user = await requireUser();
  let target: string;
  try {
    const { imported } = await syncRides(user.id);
    target = `/pedais?ok=sync&n=${imported}`;
  } catch (e) {
    target = `/pedais?erro=sync_${e instanceof SyncError ? e.code : "unexpected"}`;
  }
  redirect(target);
}
