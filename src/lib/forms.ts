// Small, pure readers for FormData fields (validation of RF01, RF02, RF14, RF30 inputs).

export function text(form: FormData, name: string, max = 120): string {
  return String(form.get(name) ?? "").trim().slice(0, max);
}

/** Optional non-negative number; accepts "1.234,5" or "1234.5". Null when empty or invalid. */
export function optNumber(form: FormData, name: string): number | null {
  const raw = text(form, name, 30);
  if (!raw) return null;
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Optional positive interval (0 or empty = metric not used). */
export function optInterval(form: FormData, name: string): number | null {
  const n = optNumber(form, name);
  return n && n > 0 ? n : null;
}

export function optYear(form: FormData, name: string): number | null {
  const n = optNumber(form, name);
  return n !== null && Number.isInteger(n) && n >= 1900 && n <= 2100 ? n : null;
}

export type PlanFields = { name: string; intervalKm: number | null; intervalHours: number | null; action: "REPLACE" | "SERVICE" };

/**
 * RB16, RB10: plan rows posted as planName_0, planKm_0, planHours_0, planAction_0, ...
 * Rows without a name or without any interval are skipped.
 */
export function readPlans(form: FormData, max = 6): PlanFields[] {
  const plans: PlanFields[] = [];
  for (let i = 0; i < max; i++) {
    const name = text(form, `planName_${i}`, 80);
    const intervalKm = optInterval(form, `planKm_${i}`);
    const intervalHours = optInterval(form, `planHours_${i}`);
    if (!name || (intervalKm === null && intervalHours === null)) continue;
    const action = text(form, `planAction_${i}`) === "SERVICE" ? "SERVICE" : "REPLACE";
    plans.push({ name, intervalKm, intervalHours, action });
  }
  return plans;
}

export const BIKE_TYPES = {
  ROAD: "Estrada",
  MTB: "MTB",
  GRAVEL: "Gravel",
  URBAN: "Urbana",
  EBIKE: "Elétrica",
  INDOOR: "Rolo/indoor",
  OTHER: "Outra",
} as const;
export type BikeTypeKey = keyof typeof BIKE_TYPES;

export function bikeType(form: FormData): BikeTypeKey | null {
  const v = text(form, "type");
  return v in BIKE_TYPES ? (v as BikeTypeKey) : null;
}
