// RB13 for the Expo app: restart a plan's usage (service) or record an item replacement.
import { getApiUser, unauthorized } from "@/lib/api-auth";
import { field, maintenanceResponse, readJson } from "@/lib/api-json";
import { servicePlanFor } from "@/lib/maintenance";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const body = await readJson(request);
  return maintenanceResponse(await servicePlanFor(user.id, id, field(body, "date", 10)));
}
