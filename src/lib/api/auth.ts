// M3 view of the API user: reuses the Bearer login of src/lib/api-auth.ts and adds the admin flag (RB17).
import "server-only";
import { getApiUser as getBearerUser } from "@/lib/api-auth";
import { allAdminEmailsSetting } from "@/lib/admin-emails";
import { isAuthorizedAdmin } from "@/lib/google/oidc";

export type ApiUser = { id: string; name: string; email: string | null; isAdmin: boolean };

export async function getApiUser(req: Request): Promise<ApiUser | null> {
  const u = await getBearerUser(req);
  if (!u) return null;
  // RB17: admin rights are re-checked on every call (role + e-mail still authorized).
  return { id: u.id, name: u.name, email: u.email, isAdmin: u.role === "ADMIN" && isAuthorizedAdmin(u.email, await allAdminEmailsSetting()) };
}
