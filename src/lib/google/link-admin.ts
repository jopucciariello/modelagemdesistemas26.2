// RB17: only allow-listed, verified Google e-mails become (or stay) admins.
import "server-only";
import { prisma } from "@/lib/db";
import { adminEmailsSetting } from "@/lib/env";
import { GoogleLoginError, isAuthorizedAdmin, type GoogleIdentity } from "@/lib/google/oidc";

export async function linkAdminAccount(identity: GoogleIdentity): Promise<string> {
  if (!isAuthorizedAdmin(identity.email, adminEmailsSetting())) {
    throw new GoogleLoginError("E-mail is not an authorized admin.", "not_authorized");
  }
  const user = await prisma.user.upsert({
    where: { email: identity.email },
    update: { role: "ADMIN" },
    create: { email: identity.email, name: identity.name, role: "ADMIN" },
  });
  return user.id;
}
