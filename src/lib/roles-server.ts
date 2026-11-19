// RB24: loads the roles of an account (admin, workshop, store) for /api/me and the web navigation.
import "server-only";
import { allAdminEmailsSetting } from "@/lib/admin-emails";
import { prisma } from "@/lib/db";
import { isAuthorizedAdmin } from "@/lib/google/oidc";
import { accountRoles, type AccountRole } from "@/lib/roles";

export async function loadAccountRoles(user: { id: string; email: string | null; role: string }): Promise<AccountRole[]> {
  const email = user.email?.toLowerCase() ?? null;
  const [workshop, merchant] = await Promise.all([
    email
      ? prisma.workshop.findFirst({ where: { active: true, status: "ACTIVE", OR: [{ ownerEmail: email }, { members: { some: { email } } }] }, select: { id: true } })
      : null,
    prisma.merchant.findUnique({ where: { userId: user.id }, select: { id: true } }),
  ]);
  // RB17: admin rights are re-checked on every call (role + e-mail still authorized).
  const isAdmin = user.role === "ADMIN" && isAuthorizedAdmin(user.email, await allAdminEmailsSetting());
  return accountRoles({ isAdmin, hasWorkshop: !!workshop, hasMerchant: !!merchant });
}
