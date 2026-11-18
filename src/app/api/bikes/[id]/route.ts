// RF01, RF11 for the Expo app (issue #64): one bike with parts, wear and history.
import { getApiUser, unauthorized } from "@/lib/api-auth";
import { toBikeDetailDto } from "@/lib/bike-detail-dto";
import { loadBikeDetail } from "@/lib/tracker";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  // loadBikeDetail only finds bikes of this user (RB: an athlete never sees another's bike).
  const detail = await loadBikeDetail(user.id, id);
  if (!detail) return Response.json({ error: "Bike não encontrada" }, { status: 404 });
  return Response.json(toBikeDetailDto(detail));
}
