// RF32, RNF01, issue #62: disconnect Strava from the app.
import { getApiUser, unauthorized } from "@/lib/api-auth";
import { disconnectStrava } from "@/lib/strava/disconnect";

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  await disconnectStrava(user.id);
  return Response.json({ ok: true });
}
