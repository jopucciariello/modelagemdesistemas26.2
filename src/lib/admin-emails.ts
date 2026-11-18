// RF37, RB17, ADR-005: admins = ADMIN_EMAILS (Infisical, root admins) + e-mails added from /admin (database).
import "server-only";
import { prisma } from "@/lib/db";
import { adminEmailsSetting } from "@/lib/env";
import { mergeAdminSettings } from "@/lib/admin-list";

/** The full admin list as a setting string, read on every call so removals apply on the next request. */
export async function allAdminEmailsSetting(): Promise<string> {
  const rows = await prisma.adminEmail.findMany({ select: { email: true } });
  return mergeAdminSettings(adminEmailsSetting(), rows.map((r) => r.email));
}
