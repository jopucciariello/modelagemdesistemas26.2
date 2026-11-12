// RF06-RF09, RB02-RB04, RB11-RB14, RB16, ADR-007: pure wear computation (no DB, no UI; RNF08).

export const CYCLING_SPORT_TYPES = [
  "Ride",
  "MountainBikeRide",
  "GravelRide",
  "EBikeRide",
  "EMountainBikeRide",
  "VirtualRide",
] as const;

export type SportType = (typeof CYCLING_SPORT_TYPES)[number];

/** RB03: only cycling activities count for wear. */
export function isCyclingSport(sportType: string): sportType is SportType {
  return (CYCLING_SPORT_TYPES as readonly string[]).includes(sportType);
}

export type WearRide = { startDate: Date; distanceKm: number; movingHours: number; sportType: string };

export type WearPart = {
  installedAt: Date;
  removedAt: Date | null;
  initialKm: number;
  initialHours: number;
  wearsOnTrainer: boolean;
};

export type WearPlan = {
  intervalKm: number | null;
  intervalHours: number | null;
  action: "REPLACE" | "SERVICE";
  lastServiceAt: Date | null;
};

export type WearStatus = "ok" | "near" | "due";

export type PlanWear = {
  km: number;
  hours: number;
  /** RF07: the larger of the km and hours fractions, e.g. 0.85 = 85%. */
  ratio: number;
  status: WearStatus;
  /** RF08/RF09 alert text, or null while below 80%. */
  alert: string | null;
};

export const NEAR_THRESHOLD = 0.8; // RB04
export const DUE_THRESHOLD = 1.0; // RB04

/** RB02, RB13, RB14: does this ride count for the plan? */
export function rideCounts(ride: WearRide, part: WearPart, plan: WearPlan): boolean {
  if (!isCyclingSport(ride.sportType)) return false;
  if (ride.sportType === "VirtualRide" && !part.wearsOnTrainer) return false;
  const start = plan.lastServiceAt && plan.lastServiceAt > part.installedAt ? plan.lastServiceAt : part.installedAt;
  if (ride.startDate < start) return false;
  if (part.removedAt && ride.startDate >= part.removedAt) return false;
  return true;
}

/** RF07, RB11: wear ratio of one plan; the metric reached first wins. */
export function wearRatio(km: number, hours: number, plan: Pick<WearPlan, "intervalKm" | "intervalHours">): number {
  const ratios: number[] = [];
  if (plan.intervalKm && plan.intervalKm > 0) ratios.push(km / plan.intervalKm);
  if (plan.intervalHours && plan.intervalHours > 0) ratios.push(hours / plan.intervalHours);
  return ratios.length ? Math.max(...ratios) : 0;
}

/** RB04: 80% = near, 100% = due. */
export function wearStatus(ratio: number): WearStatus {
  if (ratio >= DUE_THRESHOLD) return "due";
  if (ratio >= NEAR_THRESHOLD) return "near";
  return "ok";
}

/** RF08, RF09, RB13: the alert wording depends on the plan's action. */
export function alertText(status: WearStatus, action: WearPlan["action"]): string | null {
  const noun = action === "SERVICE" ? "Revisão" : "Troca";
  if (status === "due") return `${noun} necessária`;
  if (status === "near") return `${noun} próxima`;
  return null;
}

/** RF06, RF07: usage and wear of one plan of a part, from the bike's rides. */
export function computePlanWear(part: WearPart, plan: WearPlan, rides: readonly WearRide[]): PlanWear {
  let km = 0;
  let hours = 0;
  for (const ride of rides) {
    if (!rideCounts(ride, part, plan)) continue;
    km += ride.distanceKm;
    hours += ride.movingHours;
  }
  // The initial usage belongs to the part's life before the first service only.
  const serviced = plan.lastServiceAt !== null && plan.lastServiceAt > part.installedAt;
  if (!serviced) {
    km += part.initialKm;
    hours += part.initialHours;
  }
  const ratio = wearRatio(km, hours, plan);
  const status = wearStatus(ratio);
  return { km, hours, ratio, status, alert: alertText(status, plan.action) };
}

/** RF15: sort descending by wear. */
export function byWearDesc<T extends { wear: { ratio: number } }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => b.wear.ratio - a.wear.ratio);
}

/** Formats a ratio as a whole percentage for display. */
export function percent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
