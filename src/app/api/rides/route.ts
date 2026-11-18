// RF14 for the Expo app: recent rides (GET) and a ride typed by hand (POST).
import { getApiUser, unauthorized } from "@/lib/api-auth";
import { field, readJson } from "@/lib/api-json";
import { prisma } from "@/lib/db";
import { createManualRideFor } from "@/lib/rides/manual";
import { toRideDto } from "@/lib/rides-dto";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  const [rides, bikes, me] = await Promise.all([
    prisma.ride.findMany({
      where: { userId: user.id },
      orderBy: { startDate: "desc" },
      take: 50,
      select: { id: true, source: true, sportType: true, startDate: true, distanceKm: true, movingHours: true, stravaGearId: true, bike: { select: { id: true, name: true } } },
    }),
    prisma.bike.findMany({ where: { userId: user.id, archivedAt: null }, select: { id: true, name: true }, orderBy: { createdAt: "asc" } }),
    prisma.user.findUnique({ where: { id: user.id }, select: { activitySource: true } }),
  ]);
  return Response.json({ source: me?.activitySource ?? "MANUAL", bikes, rides: rides.map(toRideDto) });
}

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  const body = await readJson(request);
  const ok = await createManualRideFor(user.id, field(body, "bikeId", 40), {
    date: field(body, "date", 10),
    distanceKm: field(body, "distanceKm", 30),
    movingHours: field(body, "movingHours", 30),
    sportType: field(body, "sportType", 30),
  });
  return ok ? Response.json({ ok: true }) : Response.json({ error: "pedal_invalido" }, { status: 400 });
}
