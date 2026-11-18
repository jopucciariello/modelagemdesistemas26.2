// Issue #61: who is the logged-in user (Bearer token).
import { checkAccountDeletion } from "@/lib/account-delete";
import { getApiUser, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  return Response.json({ id: user.id, name: user.name, email: user.email ?? "", role: user.role });
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
