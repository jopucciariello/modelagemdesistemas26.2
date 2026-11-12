// RF02, RF03, RF30, RF35, RB16: pure catalog rules (no DB).
import type { BikeTypeKey } from "@/lib/forms";

export type PlanSpec = { name: string; intervalKm: number | null; intervalHours: number | null; action: "REPLACE" | "SERVICE" };

/**
 * RF03, RB16: the plans a new part starts with. The component's own plans (from the catalog
 * spreadsheet) win; without them the category defaults apply. Both empty means the part has
 * no regular wear (e.g. a saddle or a rigid seatpost).
 */
export function plansFor(componentPlans: readonly PlanSpec[], categoryPlans: readonly PlanSpec[]): PlanSpec[] {
  const source = componentPlans.length > 0 ? componentPlans : categoryPlans;
  return source.map(({ name, intervalKm, intervalHours, action }) => ({ name, intervalKm, intervalHours, action }));
}

/** RF35: bike type from the catalog's category label (e.g. "MTB — XC full", "Road — race"). */
export function bikeTypeFromCategory(category: string | null | undefined): BikeTypeKey {
  const c = (category ?? "").toLowerCase();
  if (c.includes("e-mtb") || c.includes("e-bike")) return "EBIKE";
  if (c.includes("gravel")) return "GRAVEL";
  if (c.includes("road") || c.includes("estrada")) return "ROAD";
  if (c.includes("mtb")) return "MTB";
  if (c.includes("urban")) return "URBAN";
  return "OTHER";
}

/**
 * RB18: a plan can be reset on its own (lastServiceAt) when it is a service, or when it
 * replaces one consumable of a part that has several plans (chain of a groupset).
 */
export function canResetPlan(action: "REPLACE" | "SERVICE", planCount: number): boolean {
  return action === "SERVICE" || planCount > 1;
}

export function componentLabel(c: { code: string | null; brand: string; model: string }): string {
  return `${c.code ? `${c.code} · ` : ""}${c.brand} ${c.model}`;
}

export function priceRange(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  const fmt = (n: number) => `R$ ${n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
  if (min !== null && max !== null && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min ?? max)!);
}

/** Slots of a bike, as in the "Bikes" tab of the catalog spreadsheet. */
export const POSITIONS = ["Grupo", "Garfo", "Amortecedor", "Pneu dianteiro", "Pneu traseiro", "Freios", "Rodas", "Canote", "Selim"] as const;
