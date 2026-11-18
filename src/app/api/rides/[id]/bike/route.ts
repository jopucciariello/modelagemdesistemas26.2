// OPEN-20 for the Expo app: choose (or clear) the bike of a ride the source sent without one.
import { getApiUser, unauthorized } from "@/lib/api-auth";
import { field, readJson } from "@/lib/api-json";
import { chooseRideBikeFor } from "@/lib/rides/manual";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const body = await readJson(request);
  const ok = await chooseRideBikeFor(user.id, id, field(body, "bikeId", 40));
  return ok ? Response.json({ ok: true }) : Response.json({ error: "pedal_invalido" }, { status: 400 });
}
