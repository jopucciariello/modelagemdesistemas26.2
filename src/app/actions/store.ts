"use server";
// RF18, RB06, RB24: the user asks to become a merchant, the merchant edits the store profile, the admin decides.
import { redirect } from "next/navigation";
import { text } from "@/lib/forms";
import { requireAdmin, requireUser } from "@/lib/guards";
import * as svc from "@/lib/market-service";

const go = (path: string, key: "ok" | "erro", value: string) => redirect(`${path}?${key}=${value}`);

export async function requestStore(form: FormData) {
  const user = await requireUser();
  const r = await svc.requestMerchant(user.id, {
    storeName: text(form, "storeName", 80),
    message: text(form, "message", 600),
    contact: text(form, "contact", 120),
    shopUrl: text(form, "shopUrl", 300) || null,
  });
  if (!r.ok) go("/loja", "erro", r.error);
  go("/loja", "ok", "pedido_enviado");
}

export async function saveStoreProfile(form: FormData) {
  const user = await requireUser();
  const r = await svc.setMerchantProfile(user.id, {
    categoryIds: form.getAll("categoryIds").map(String),
    shopUrl: text(form, "shopUrl", 300),
  });
  if (!r.ok) go("/loja", "erro", r.error);
  go("/loja", "ok", "perfil_salvo");
}

/** RB06: only the admin approves or rejects (re-checked on every call, RB17). */
export async function decideStoreRequest(requestId: string, approve: boolean) {
  await requireAdmin();
  const r = await svc.decideMerchantRequest(requestId, approve);
  if (!r.ok) go("/admin", "erro", r.error);
  go("/admin", "ok", approve ? "pedido_aprovado" : "pedido_recusado");
}
