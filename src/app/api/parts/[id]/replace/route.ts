// RF10 for the Expo app: replace a part (the new one inherits the plans, zeroed).
import { getApiUser, unauthorized } from "@/lib/api-auth";
import { field, maintenanceResponse, readJson } from "@/lib/api-json";
import { replacePartFor } from "@/lib/maintenance";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const body = await readJson(request);
  return maintenanceResponse(
    await replacePartFor(user.id, id, field(body, "date", 10), field(body, "componentId", 40), field(body, "note", 200)),
  );
}
