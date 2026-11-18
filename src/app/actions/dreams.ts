"use server";
// RF20, RF21, RF22: the athlete's dreams and in-app notifications.
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { notifyMerchantsOfDream } from "@/lib/dreams";
import { optNumber, text } from "@/lib/forms";
import { resolvePicked } from "@/lib/catalog/pick";
import { readPicked } from "@/lib/picker";
import { requireUser } from "@/lib/guards";

/** RF20, RF31: the dream is a catalog model; a hand-typed brand and model go to the keywords. */
async function dreamFields(form: FormData, userId: string) {
  const price = optNumber(form, "maxPrice");
  const picked = readPicked(form);
  const resolved = picked ? await resolvePicked(userId, picked) : null;
  if (!picked || !resolved || price === null || price <= 0) redirect("/sonhos?erro=sonho_invalido");
  const manual = picked!.componentId ? null : `${picked!.manualBrand} ${picked!.manualModel}`;
  const keywords = [manual, text(form, "keywords", 120)].filter(Boolean).join(" ").slice(0, 120) || null;
  return { categoryId: picked!.categoryId, componentId: picked!.componentId, keywords, maxPriceCents: Math.round(price! * 100) };
}

export async function createDream(form: FormData) {
  const user = await requireUser();
  const dream = await prisma.dream.create({ data: { ...(await dreamFields(form, user.id)), userId: user.id } });
  await notifyMerchantsOfDream(dream.id);
  redirect("/sonhos?ok=criado");
}

export async function updateDream(form: FormData) {
  const user = await requireUser();
  const own = await prisma.dream.findFirst({ where: { id: text(form, "id", 40), userId: user.id } });
  if (!own) redirect("/sonhos?erro=sonho_nao_encontrado");
  await prisma.dream.update({ where: { id: own!.id }, data: await dreamFields(form, user.id) });
  redirect("/sonhos?ok=atualizado");
}

export async function deleteDream(form: FormData) {
  const user = await requireUser();
  await prisma.dream.deleteMany({ where: { id: text(form, "id", 40), userId: user.id } });
  redirect("/sonhos?ok=removido");
}

export async function markNotificationRead(form: FormData) {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { id: text(form, "id", 40), userId: user.id, readAt: null }, data: { readAt: new Date() } });
  redirect("/notificacoes");
}

export async function markAllRead() {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  redirect("/notificacoes");
}
