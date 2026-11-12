// RF30, RF35: typed view of the catalog spreadsheet export (seed.json).
import raw from "@/lib/catalog/seed.json";
import type { PlanSpec } from "@/lib/catalog/rules";

export type SeedCatalog = {
  source: string;
  categories: { name: string; wearsOnTrainer: boolean; plans: PlanSpec[] }[];
  components: {
    code: string;
    category: string;
    brand: string;
    model: string;
    modality: string | null;
    subcategory: string | null;
    details: string | null;
    priceMin: number | null;
    priceMax: number | null;
    plans: PlanSpec[];
  }[];
  bikeModels: {
    code: string;
    brand: string;
    model: string;
    version: string | null;
    category: string | null;
    frame: string | null;
    listPrice: string | null;
    parts: { position: string; code: string }[];
  }[];
};

export const seed = raw as SeedCatalog;
