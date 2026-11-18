// RF31, RB15: server side of the part picker: categories for the menus, hidden manual parts and admin requests.
import "server-only";
import { prisma } from "@/lib/db";
import type { Picked } from "@/lib/picker";
import { requestText } from "@/lib/picker";

/** Active categories with their active components, for the picker menus. */
export async function pickerCategories() {
  const cats = await prisma.category.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: { components: { where: { active: true }, orderBy: [{ brand: "asc" }, { model: "asc" }], select: { id: true, brand: true, model: true, modality: true } } },
  });
  return cats.map((c) => ({ id: c.id, name: c.name, components: c.components }));
}

/** Active brands of bike models with their models, for the bike form. */
export async function pickerBikeModels() {
  return prisma.bikeModel.findMany({ where: { active: true }, orderBy: [{ brand: "asc" }, { model: "asc" }], select: { id: true, brand: true, model: true, version: true, category: true } });
}

/** RF31: files a request for the admin and notifies every admin. Never creates a catalog entry. */
export async function requestCatalogAddition(userId: string, input: { kind: "COMPONENT" | "BIKE"; family: string | null; text: string }) {
  const request = await prisma.modelRequest.create({ data: { userId, kind: input.kind, family: input.family, text: input.text } });
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  const what = input.kind === "BIKE" ? "uma bike" : "um componente";
  for (const a of admins) {
    await prisma.notification
      .create({ data: { userId: a.id, refKey: `model-request:${request.id}`, message: `Novo pedido de catálogo: ${what} (${input.text.slice(0, 80)}).`, href: "/admin" } })
      .catch(() => undefined);
  }
  return request;
}

/**
 * Resolves a picked part to a component id. A hand-typed part reuses the catalog entry with the
 * same brand and model, or gets a hidden (inactive) component so the athlete can still use it;
 * hidden components never show in menus. Optionally files the request to the admin (RF31).
 */
export async function resolvePicked(userId: string, picked: Picked): Promise<{ componentId: string } | null> {
  const category = await prisma.category.findFirst({ where: { id: picked.categoryId, active: true } });
  if (!category) return null;
  if (picked.componentId) {
    const c = await prisma.component.findFirst({ where: { id: picked.componentId, categoryId: category.id, active: true } });
    return c ? { componentId: c.id } : null;
  }
  const brand = picked.manualBrand!;
  const model = picked.manualModel!;
  const existing = await prisma.component.findFirst({ where: { categoryId: category.id, brand: { equals: brand }, model: { equals: model } } });
  const component = existing ?? (await prisma.component.create({ data: { categoryId: category.id, brand, model, active: false, details: "Cadastrada pelo atleta, aguardando o catálogo." } }));
  if (picked.requestAdd) await requestCatalogAddition(userId, { kind: "COMPONENT", family: category.name, text: requestText(category.name, brand, model) });
  return { componentId: component.id };
}

/**
 * OPEN-49: id of the hidden component an athlete typed by hand with this brand and model, if any.
 * When the admin registers the real model, it adopts this row, so the athletes' parts keep their wear history.
 */
export async function hiddenComponentId(input: { categoryId: string; brand: string; model: string }): Promise<string | null> {
  const found = await prisma.component.findFirst({ where: { ...input, active: false, code: null } });
  return found?.id ?? null;
}
