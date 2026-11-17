"use server";
// RF31, RB15: the athlete asks for a missing model; only the admin answers (never creates catalog entries here, INV-032).
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { text } from "@/lib/forms";
import { requireAdmin, requireUser } from "@/lib/guards";
import { readAnswer, readModelRequest } from "@/lib/help";

export async function createModelRequest(form: FormData) {
  const user = await requireUser();
  const input = readModelRequest(form);
  if (!input) redirect("/ajuda?erro=pedido_invalido");
  await prisma.modelRequest.create({ data: { userId: user.id, ...input } });
  redirect("/ajuda?ok=pedido");
}

export async function answerModelRequest(form: FormData) {
  await requireAdmin();
  const id = text(form, "id", 40);
  const answer = readAnswer(form);
  if (!answer) redirect("/admin?erro=resposta_invalida");
  const found = await prisma.modelRequest.findUnique({ where: { id } });
  if (!found) redirect("/admin?erro=pedido_inexistente");
  await prisma.modelRequest.update({ where: { id }, data: { ...answer, answeredAt: new Date() } });
  redirect("/admin?ok=pedido_respondido");
}
