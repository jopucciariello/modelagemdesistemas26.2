// RF04, ADR-005: every verified Google e-mail gets an account; admins are only the ones in ADMIN_EMAILS (RB17).
import "server-only";
import { prisma } from "@/lib/db";
import { adminEmailsSetting } from "@/lib/env";
import { roleForEmail, type GoogleIdentity } from "@/lib/google/oidc";

export async function linkGoogleAccount(identity: GoogleIdentity): Promise<string> {
  const role = roleForEmail(identity.email, adminEmailsSetting());
  const user = await prisma.user.upsert({
    where: { email: identity.email },
    // Re-evaluated on every login, so removing an e-mail from the list also demotes the role.
    update: { role },
    create: { email: identity.email, name: identity.name, role },
  });
  return user.id;
}
