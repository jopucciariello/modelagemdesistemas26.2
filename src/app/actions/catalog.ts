"use server";
// RF30, RB15: only the admin maintains categories, default plans and components.
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { seed } from "@/lib/catalog/seed";
import { optNumber, readPlans, text } from "@/lib/forms";
import { requireAdmin } from "@/lib/guards";

const back = (msg: string) => redirect(`/admin?ok=${msg}`);
const fail = (msg: string) => redirect(`/admin?erro=${msg}`);

/**
 * RF30, RF35: loads the catalog spreadsheet (src/lib/catalog/seed.json). Categories are created
 * when missing; components and bike models are matched by code and updated, so loading again
 * after a new export of the spreadsheet refreshes the catalog without duplicates.
 */
export async function loadCatalogSeed() {
  await requireAdmin();
  const categoryId = new Map<string, string>();
  for (const c of seed.categories) {
    const existing = await prisma.category.findUnique({ where: { name: c.name } });
    const category = existing ?? (await prisma.category.create({ data: { name: c.name, wearsOnTrainer: c.wearsOnTrainer, plans: { create: c.plans } } }));
    categoryId.set(c.name, category.id);
  }
  const componentId = new Map<string, string>();
  for (const c of seed.components) {
    const data = {
      categoryId: categoryId.get(c.category)!,
      brand: c.brand,
      model: c.model,
      modality: c.modality,
      subcategory: c.subcategory,
      details: c.details,
      priceMin: c.priceMin,
      priceMax: c.priceMax,
    };
    const component = await prisma.component.upsert({
      where: { code: c.code },
      update: { ...data, plans: { deleteMany: {}, create: c.plans } },
      create: { ...data, code: c.code, plans: { create: c.plans } },
    });
    componentId.set(c.code, component.id);
  }
  for (const b of seed.bikeModels) {
    const data = { brand: b.brand, model: b.model, version: b.version, category: b.category, frame: b.frame, listPrice: b.listPrice };
    const parts = b.parts.map((p) => ({ position: p.position, componentId: componentId.get(p.code)! }));
    await prisma.bikeModel.upsert({
      where: { code: b.code },
      update: { ...data, parts: { deleteMany: {}, create: parts } },
      create: { ...data, code: b.code, parts: { create: parts } },
    });
  }
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
