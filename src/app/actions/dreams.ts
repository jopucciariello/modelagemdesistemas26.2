"use server";
// RF20, RF21, RF22: the athlete's dreams and in-app notifications.
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { notifyMerchantsOfDream } from "@/lib/dreams";
import { optNumber, text } from "@/lib/forms";
import { requireUser } from "@/lib/guards";

async function dreamFields(form: FormData) {
  const categoryId = text(form, "categoryId", 40);
  const price = optNumber(form, "maxPrice");
  const category = categoryId ? await prisma.category.findFirst({ where: { id: categoryId, active: true } }) : null;
  if (!category || price === null || price <= 0) redirect("/sonhos?erro=sonho_invalido");
  return { categoryId: category!.id, keywords: text(form, "keywords", 120) || null, maxPriceCents: Math.round(price! * 100) };
}

export async function createDream(form: FormData) {
  const user = await requireUser();
  const dream = await prisma.dream.create({ data: { ...(await dreamFields(form)), userId: user.id } });
  await notifyMerchantsOfDream(dream.id);
  redirect("/sonhos?ok=criado");
}

export async function updateDream(form: FormData) {
  const user = await requireUser();
  const own = await prisma.dream.findFirst({ where: { id: text(form, "id", 40), userId: user.id } });
  if (!own) redirect("/sonhos?erro=sonho_nao_encontrado");
  await prisma.dream.update({ where: { id: own!.id }, data: await dreamFields(form) });
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
