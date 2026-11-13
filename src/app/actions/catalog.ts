"use server";
// RF30, RB15: only the admin maintains categories, default plans and components.
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { loadSeed } from "@/lib/catalog/load";
import { optNumber, readPlans, text } from "@/lib/forms";
import { requireAdmin } from "@/lib/guards";

const back = (msg: string) => redirect(`/admin?ok=${msg}`);
const fail = (msg: string) => redirect(`/admin?erro=${msg}`);

/** RF30, RF35: reloads the catalog spreadsheet (see loadSeed). */
export async function loadCatalogSeed() {
  await requireAdmin();
  await loadSeed(prisma);
  back("catalogo_padrao");
}

export async function createCategory(form: FormData) {
  await requireAdmin();
  const name = text(form, "name", 60);
  const plans = readPlans(form);
  if (!name) fail("categoria_invalida"); // RB16: no plans = no regular wear (e.g. saddles)
  if (await prisma.category.findUnique({ where: { name } })) fail("categoria_existe");
  await prisma.category.create({
    data: { name, wearsOnTrainer: form.get("wearsOnTrainer") === "on", plans: { create: plans } },
  });
  back("categoria");
}

export async function updateCategory(form: FormData) {
  await requireAdmin();
  const id = text(form, "id", 40);
  const name = text(form, "name", 60);
  if (!name) fail("categoria_invalida");
  await prisma.category.update({
    where: { id },
    data: { name, wearsOnTrainer: form.get("wearsOnTrainer") === "on", active: form.get("active") === "on" },
  });
  back("categoria");
}

export async function addCategoryPlan(form: FormData) {
  await requireAdmin();
  const categoryId = text(form, "categoryId", 40);
  const [plan] = readPlans(form, 1);
  if (!plan) fail("plano_invalido");
  await prisma.categoryPlan.create({ data: { ...plan, categoryId } });
  back("plano");
}

export async function deleteCategoryPlan(form: FormData) {
  await requireAdmin();
  const id = text(form, "id", 40);
  const plan = await prisma.categoryPlan.findUnique({ where: { id } });
  if (!plan) fail("plano_invalido");
  await prisma.categoryPlan.delete({ where: { id } });
  back("plano");
}

export async function createComponent(form: FormData) {
  await requireAdmin();
  const categoryId = text(form, "categoryId", 40);
  const brand = text(form, "brand", 60);
  const model = text(form, "model", 80);
  const code = text(form, "code", 20).toUpperCase() || null;
  if (!brand || !model) fail("componente_invalido");
  const dup = await prisma.component.findFirst({ where: { OR: [{ categoryId, brand, model }, ...(code ? [{ code }] : [])] } });
  if (dup) fail("componente_existe");
  await prisma.component.create({
    data: {
      categoryId,
      code,
      brand,
      model,
      modality: text(form, "modality", 40) || null,
      subcategory: text(form, "subcategory", 60) || null,
      details: text(form, "details", 200) || null,
      priceMin: optNumber(form, "priceMin"),
      priceMax: optNumber(form, "priceMax"),
      // RF30: plans of this component; empty keeps the category defaults.
      plans: { create: readPlans(form) },
    },
  });
  back("componente");
}

/** RB15: components are deactivated, never deleted (parts may point to them). */
export async function toggleComponent(form: FormData) {
  await requireAdmin();
  const id = text(form, "id", 40);
  const c = await prisma.component.findUnique({ where: { id } });
  if (!c) fail("componente_invalido");
  await prisma.component.update({ where: { id }, data: { active: !c!.active } });
  back("componente");
}
