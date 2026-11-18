// Issue #61: who is the logged-in user (Bearer token).
import { getApiUser, unauthorized } from "@/lib/api-auth";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  return Response.json({ id: user.id, name: user.name, email: user.email ?? "", role: user.role });
}
