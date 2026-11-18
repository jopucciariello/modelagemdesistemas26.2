// RF15 for the Expo app (issue #64): bikes with their plans, most worn first.
import { getApiUser, unauthorized } from "@/lib/api-auth";
import { toDashboardDto } from "@/lib/dashboard-dto";
import { loadDashboard } from "@/lib/tracker";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  return Response.json(toDashboardDto(await loadDashboard(user.id)));
}
