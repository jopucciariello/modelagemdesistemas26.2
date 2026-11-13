// RF30, RF35: loads the catalog spreadsheet export (seed.json) into the database.
import type { PrismaClient } from "@/generated/prisma/client";
import { seed } from "@/lib/catalog/seed";

/**
 * Categories are created when missing; components and bike models are matched by code and
 * updated, so loading again after a new export of the spreadsheet refreshes the catalog
 * without duplicates.
 */
export async function loadSeed(db: PrismaClient) {
  const categoryId = new Map<string, string>();
  for (const c of seed.categories) {
    const existing = await db.category.findUnique({ where: { name: c.name } });
    const category = existing ?? (await db.category.create({ data: { name: c.name, wearsOnTrainer: c.wearsOnTrainer, plans: { create: c.plans } } }));
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
    const component = await db.component.upsert({
      where: { code: c.code },
      update: { ...data, plans: { deleteMany: {}, create: c.plans } },
      create: { ...data, code: c.code, plans: { create: c.plans } },
    });
    componentId.set(c.code, component.id);
  }
  for (const b of seed.bikeModels) {
    const data = { brand: b.brand, model: b.model, version: b.version, category: b.category, frame: b.frame, listPrice: b.listPrice };
    const parts = b.parts.map((p) => ({ position: p.position, componentId: componentId.get(p.code)! }));
    await db.bikeModel.upsert({
      where: { code: b.code },
      update: { ...data, parts: { deleteMany: {}, create: parts } },
      create: { ...data, code: b.code, parts: { create: parts } },
    });
  }
}

/**
 * RF30: on server start, loads the spreadsheet once when none of its components are in the
 * database yet, so a fresh deploy already has the catalog. Later edits by the admin are kept;
 * the admin reloads the spreadsheet from /admin after a new export.
 */
export async function loadSeedIfEmpty(db: PrismaClient): Promise<boolean> {
  const loaded = await db.component.count({ where: { code: { in: seed.components.map((c) => c.code) } } });
  if (loaded > 0) return false;
  await loadSeed(db);
  return true;
}
