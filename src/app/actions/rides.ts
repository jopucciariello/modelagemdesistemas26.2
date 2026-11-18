"use server";
// RF06, RF13, RF14: rides typed by hand and the manual sync with the athlete's source.
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { text } from "@/lib/forms";
import { requireUser } from "@/lib/guards";
import { SyncError, syncRides } from "@/lib/rides/sync";
import { chooseRideBikeFor, createManualRideFor } from "@/lib/rides/manual";

/** RF14: a ride typed by hand (bike, date, km, moving hours). Allowed for any source. */
export async function createManualRide(form: FormData) {
  const user = await requireUser();
  const ok = await createManualRideFor(user.id, text(form, "bikeId", 40), {
    date: text(form, "date", 10),
    distanceKm: text(form, "distanceKm", 30),
    movingHours: text(form, "movingHours", 30),
    sportType: text(form, "sportType", 30),
  });
  redirect(ok ? "/pedais?ok=pedal" : "/pedais?erro=pedal_invalido");
}

/** OPEN-20: the athlete picks (or clears) the bike of a ride the source sent without one. No default bike. */
export async function chooseRideBike(form: FormData) {
  const user = await requireUser();
  const ok = await chooseRideBikeFor(user.id, text(form, "rideId", 40), text(form, "bikeId", 40));
  redirect(ok ? "/pedais?ok=bike_escolhida" : "/pedais?erro=pedal_invalido");
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
    const { imported, refresh } = await syncRides(user.id);
    const extra = !refresh ? "" : refresh.status === "rate_limited" ? `&refresh=limite&espera=${refresh.retryAfterSeconds ?? ""}` : `&refresh=${refresh.status}`;
    target = `/pedais?ok=sync&n=${imported}${extra}`;
  } catch (e) {
    target = `/pedais?erro=sync_${e instanceof SyncError ? e.code : "unexpected"}`;
  }
  redirect(target);
}
