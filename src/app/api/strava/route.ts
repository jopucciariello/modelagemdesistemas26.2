// RF04, RF32, issue #62: Strava status for the Expo app.
import { getApiUser, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { stravaCentralApp } from "@/lib/env";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  const [connection, row] = await Promise.all([
    prisma.stravaConnection.findUnique({ where: { userId: user.id }, select: { accessTokenEncrypted: true } }),
    prisma.user.findUnique({ where: { id: user.id }, select: { activitySource: true } }),
  ]);
  return Response.json({
    available: stravaCentralApp() !== null,
    linked: Boolean(connection?.accessTokenEncrypted),
    source: row?.activitySource ?? "MANUAL",
  });
}
