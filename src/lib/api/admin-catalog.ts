// RF30, RF31, RB15, RB16: pure validation of the admin catalog API used by the Expo app (#65).
import type { PlanFields } from "@/lib/forms";
import { parseDecimal } from "@/lib/forms";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : typeof v === "string" ? parseDecimal(v.trim()) : null);
const interval = (v: unknown): number | null => { const n = num(v); return n && n > 0 ? n : null; };

/** One plan (RB16): needs a name and at least one interval; REPLACE unless action is SERVICE. */
export function parsePlan(raw: unknown): PlanFields | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const name = str(b.name, 80);
  const intervalKm = interval(b.intervalKm);
  const intervalHours = interval(b.intervalHours);
  if (!name || (intervalKm === null && intervalHours === null)) return null;
  return {
    name, intervalKm, intervalHours,
    action: b.action === "SERVICE" ? "SERVICE" : "REPLACE",
    warnKm: interval(b.warnKm), warnHours: interval(b.warnHours),
  };
}

export type CategoryInput = { name: string; wearsOnTrainer: boolean; plans: PlanFields[] };

/** A category without plans is valid (e.g. saddles do not wear regularly, RB16). Invalid plans reject the body. */
export function parseCategoryBody(raw: unknown): CategoryInput | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const name = str(b.name, 60);
  if (!name) return null;
  const rawPlans = Array.isArray(b.plans) ? b.plans.slice(0, 6) : [];
  const plans = rawPlans.map(parsePlan);
  if (plans.some((p) => p === null)) return null;
  return { name, wearsOnTrainer: b.wearsOnTrainer === true, plans: plans as PlanFields[] };
}

export type ComponentInput = {
  categoryId: string; brand: string; model: string; code: string | null; modality: string | null;
  subcategory: string | null; details: string | null; priceMin: number | null; priceMax: number | null; plans: PlanFields[];
};

export function parseComponentBody(raw: unknown): ComponentInput | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const categoryId = str(b.categoryId, 40), brand = str(b.brand, 60), model = str(b.model, 80);
  if (!categoryId || !brand || !model) return null;
  const plans = (Array.isArray(b.plans) ? b.plans.slice(0, 6) : []).map(parsePlan);
  if (plans.some((p) => p === null)) return null;
  return {
    categoryId, brand, model, code: str(b.code, 20).toUpperCase() || null,
    modality: str(b.modality, 40) || null, subcategory: str(b.subcategory, 60) || null, details: str(b.details, 200) || null,
    priceMin: num(b.priceMin), priceMax: num(b.priceMax), plans: plans as PlanFields[],
  };
}

/** RF31: a rejection needs a reason; a registration may carry a note. */
export function parseAnswerBody(raw: unknown): { status: "REGISTERED" | "REJECTED"; reply: string | null } | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const reply = str(b.reply, 1000) || null;
  if (b.status === "REGISTERED") return { status: "REGISTERED", reply };
  if (b.status === "REJECTED" && reply) return { status: "REJECTED", reply };
  return null;
}
