// RF12 for the Expo app: manual maintenance without replacing a part.
import { getApiUser, unauthorized } from "@/lib/api-auth";
import { field, maintenanceResponse, readJson } from "@/lib/api-json";
import { addManualMaintenanceFor } from "@/lib/maintenance";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const body = await readJson(request);
  return maintenanceResponse(
    await addManualMaintenanceFor(user.id, id, field(body, "date", 10), field(body, "note", 200), field(body, "partId", 40)),
  );
}
