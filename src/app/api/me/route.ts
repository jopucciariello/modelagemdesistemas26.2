// Issue #61: who is the logged-in user (Bearer token).
import { checkAccountDeletion } from "@/lib/account-delete";
import { getApiUser, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { isAuthorizedAdmin } from "@/lib/google/oidc";
import { allAdminEmailsSetting } from "@/lib/admin-emails";
import { accountRoles } from "@/lib/roles";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  // RB24: one account can be athlete, admin, workshop and merchant at the same time.
  const email = user.email?.toLowerCase() ?? null;
  const [workshop, merchant] = await Promise.all([
    email
      ? prisma.workshop.findFirst({ where: { active: true, status: "ACTIVE", OR: [{ ownerEmail: email }, { members: { some: { email } } }] }, select: { id: true } })
      : null,
    prisma.merchant.findUnique({ where: { userId: user.id }, select: { id: true } }),
  ]);
  const isAdmin = user.role === "ADMIN" && isAuthorizedAdmin(user.email, await allAdminEmailsSetting());
  const roles = accountRoles({ isAdmin, hasWorkshop: !!workshop, hasMerchant: !!merchant });
  return Response.json({ id: user.id, name: user.name, email: user.email ?? "", role: user.role, roles });
}

// RF40: the athlete deletes their own account and data (cascade in the schema), body { confirm: "EXCLUIR" }.
export async function DELETE(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  const check = checkAccountDeletion(user.role, await request.json().catch(() => null));
  if (!check.ok) {
    const text = check.error === "admin_nao_exclui"
      ? "Administradores precisam ser removidos da lista de admins antes de excluir a conta."
      : "Digite EXCLUIR para confirmar.";
    return Response.json({ error: text, code: check.error }, { status: check.error === "admin_nao_exclui" ? 409 : 400 });
  }
  await prisma.user.delete({ where: { id: user.id } });
  return Response.json({ ok: true });
}
