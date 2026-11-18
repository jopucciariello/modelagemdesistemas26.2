// RF40, #76: pure rules of the in-app "delete my account" (required by the Apple and Google stores).

export const DELETE_CONFIRMATION = "EXCLUIR";

export type DeleteCheck = { ok: true } | { ok: false; error: "confirmacao_invalida" | "admin_nao_exclui" };

/** The athlete must type EXCLUIR; admins are removed from the admin list first (RF37) so the project is never left without one. */
export function checkAccountDeletion(role: "ATHLETE" | "ADMIN" | string, body: unknown): DeleteCheck {
  const confirm = body && typeof body === "object" ? (body as Record<string, unknown>).confirm : null;
  if (typeof confirm !== "string" || confirm.trim().toUpperCase() !== DELETE_CONFIRMATION) return { ok: false, error: "confirmacao_invalida" };
  if (role === "ADMIN") return { ok: false, error: "admin_nao_exclui" };
  return { ok: true };
}
