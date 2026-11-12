"use server";
// RF30, RB15: only the admin maintains categories, default plans and components.
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DEFAULT_CATALOG } from "@/lib/catalog/defaults";
import { readPlans, text } from "@/lib/forms";
import { requireAdmin } from "@/lib/guards";

const back = (msg: string) => redirect(`/admin?ok=${msg}`);
const fail = (msg: string) => redirect(`/admin?erro=${msg}`);

/** RF30, RF03: loads the starter catalog (docs/requisitos.md §4); skips names that already exist. */
export async function loadDefaultCatalog() {
  await requireAdmin();
  for (const c of DEFAULT_CATALOG) {
    const exists = await prisma.category.findUnique({ where: { name: c.name } });
    if (exists) continue;
    await prisma.category.create({
      data: {
        name: c.name,
        wearsOnTrainer: c.wearsOnTrainer,
        plans: { create: c.plans.map((p) => ({ name: p.name, intervalKm: p.intervalKm ?? null, intervalHours: p.intervalHours ?? null, action: p.action })) },
        components: { create: c.components },
      },
    });
  }
  back("catalogo_padrao");
}

export async function createCategory(form: FormData) {
  await requireAdmin();
  const name = text(form, "name", 60);
  const plans = readPlans(form);
  if (!name || plans.length === 0) fail("categoria_invalida"); // RB16: at least one plan
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
  const plan = await prisma.categoryPlan.findUnique({ where: { id }, include: { category: { include: { _count: { select: { plans: true } } } } } });
  if (!plan) fail("plano_invalido");
  if (plan!.category._count.plans <= 1) fail("ultimo_plano"); // RB16
  await prisma.categoryPlan.delete({ where: { id } });
  back("plano");
}

export async function createComponent(form: FormData) {
  await requireAdmin();
  const categoryId = text(form, "categoryId", 40);
  const brand = text(form, "brand", 60);
  const model = text(form, "model", 80);
  if (!brand || !model) fail("componente_invalido");
  const dup = await prisma.component.findUnique({ where: { categoryId_brand_model: { categoryId, brand, model } } });
  if (dup) fail("componente_existe");
  await prisma.component.create({ data: { categoryId, brand, model } });
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
