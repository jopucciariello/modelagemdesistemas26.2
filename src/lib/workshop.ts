// Phase 3 pure rules (RF25-RF29, RNF03, RB09, RB22): no database, easy to test (RNF08).

const HOUR = 3600_000;
export const LATE_CANCEL_HOURS = 24;

export type AppointmentState = "SCHEDULED" | "COMPLETED" | "CANCELLED";

/** RF25, OPEN-44: "one included item per line" -> clean list (max 30 items of 80 characters). */
export function parseIncludes(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 30);
}

/** RF25: "2026-11-20" + "14:30" (São Paulo time, UTC-3) -> Date. Null when invalid. */
export function parseSlotStart(day: unknown, time: unknown): Date | null {
  if (typeof day !== "string" || typeof time !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const date = new Date(`${day}T${time}:00-03:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** RB22, INV-061: only future slots can be offered or booked. */
export function isFuture(startsAt: Date, now: Date): boolean {
  return startsAt.getTime() > now.getTime();
}

/** RB22, INV-062: a slot is free while no scheduled or completed appointment holds it. */
export function isSlotFree(appointments: readonly { status: AppointmentState }[]): boolean {
  return !appointments.some((a) => a.status !== "CANCELLED");
}

/** RF26: the slot can be booked when it is in the future and free. */
export function canBook(startsAt: Date, appointments: readonly { status: AppointmentState }[], now: Date): boolean {
  return isFuture(startsAt, now) && isSlotFree(appointments);
}

/** RF29, INV-064: a cancellation less than 24 h before the appointment is urgent. */
export function isLateCancellation(startsAt: Date, now: Date): boolean {
  return startsAt.getTime() - now.getTime() < LATE_CANCEL_HOURS * HOUR;
}

/** RB09, RNF03: a workshop reads a bike only with a scheduled or completed appointment of its own. */
export function canWorkshopAccessBike(
  appointments: readonly { workshopId: string; bikeId: string; status: AppointmentState }[],
  workshopId: string,
  bikeId: string,
): boolean {
  return appointments.some((a) => a.workshopId === workshopId && a.bikeId === bikeId && a.status !== "CANCELLED");
}

/** "sex., 20/11/2026 14:30" in São Paulo time. */
export function formatSlot(date: Date): string {
  return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** RF29: text of the notice sent to the workshop. */
export function cancellationNotice(athleteName: string, bikeName: string, startsAt: Date, late: boolean): string {
  const when = formatSlot(startsAt);
  return late
    ? `Cancelamento de última hora (menos de ${LATE_CANCEL_HOURS} h): ${athleteName} cancelou ${bikeName} em ${when}.`
    : `${athleteName} cancelou o agendamento de ${bikeName} em ${when}. O horário voltou a ficar livre.`;
}

// ---- M2 (#70, RF25/RF26): weekly grid, duration and staged revisions (RB23) ----

const MIN = 60_000;
const SP_OFFSET_MIN = -180; // São Paulo, no DST

export type GridHour = { weekday: number; startMin: number; endMin: number };
export const SLOT_STEP_MIN = 30;

/** RF25: a grid row is valid with weekday 0-6 and 0 <= start < end <= 1440, on the 30 min step. */
export function isValidGridHour(h: GridHour): boolean {
  return (
    Number.isInteger(h.weekday) && h.weekday >= 0 && h.weekday <= 6 &&
    Number.isInteger(h.startMin) && Number.isInteger(h.endMin) &&
    h.startMin >= 0 && h.endMin <= 1440 && h.startMin < h.endMin &&
    h.startMin % SLOT_STEP_MIN === 0 && h.endMin % SLOT_STEP_MIN === 0
  );
}

/** Local São Paulo "day" parts of an instant. */
function spParts(date: Date): { dayStartUtc: number; weekday: number } {
  const shifted = new Date(date.getTime() + SP_OFFSET_MIN * MIN);
  const dayStartUtc = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - SP_OFFSET_MIN * MIN;
  return { dayStartUtc, weekday: shifted.getUTCDay() };
}

export type Busy = { startsAt: Date; endsAt: Date };

/** RB22 + duration: true when [start, end) overlaps any busy interval. */
export function overlaps(start: Date, end: Date, busy: readonly Busy[]): boolean {
  return busy.some((b) => start.getTime() < b.endsAt.getTime() && b.startsAt.getTime() < end.getTime());
}

/**
 * RF26: start times a service of `durationMin` can be booked in the next `days` days.
 * A start must be future, fit inside a grid window and not overlap an active appointment.
 */
export function availableStarts(input: {
  hours: readonly GridHour[];
  durationMin: number;
  busy: readonly Busy[];
  now: Date;
  days: number;
}): Date[] {
  const { hours, durationMin, busy, now, days } = input;
  if (!Number.isInteger(durationMin) || durationMin <= 0) return [];
  const result: Date[] = [];
  const today = spParts(now).dayStartUtc;
  for (let d = 0; d < days; d++) {
    const dayStart = today + d * 24 * 60 * MIN;
    const weekday = spParts(new Date(dayStart + 12 * 60 * MIN)).weekday;
    for (const h of hours.filter((x) => x.weekday === weekday && isValidGridHour(x))) {
      for (let m = h.startMin; m + durationMin <= h.endMin; m += SLOT_STEP_MIN) {
        const start = new Date(dayStart + m * MIN);
        const end = new Date(start.getTime() + durationMin * MIN);
        if (isFuture(start, now) && !overlaps(start, end, busy)) result.push(start);
      }
    }
  }
  return result.sort((a, b) => a.getTime() - b.getTime());
}

/** RB23: "100,150" -> [100, 150]; invalid or empty -> []. */
export function parseStages(raw: string | null | undefined): number[] {
  if (!raw) return [];
  const stages = raw.split(",").map((s) => Number(s.trim()));
  return stages.length > 0 && stages.every((n) => Number.isFinite(n) && n > 0) ? stages : [];
}

/** RB23: after a revision the target moves to the next stage; the last stage repeats. */
export function advanceStage(stages: readonly number[], index: number): { index: number; target: number } | null {
  if (stages.length === 0) return null;
  const next = Math.min(Math.max(index, 0) + 1, stages.length - 1);
  return { index: next, target: stages[next] };
}

/** RB09, RNF03, RF27: shared only when the athlete consented. */
export function canWorkshopReadHistory(
  appointments: readonly { workshopId: string; bikeId: string; status: AppointmentState; shareHistory: boolean }[],
  workshopId: string,
  bikeId: string,
): boolean {
  return appointments.some((a) => a.workshopId === workshopId && a.bikeId === bikeId && a.status !== "CANCELLED" && a.shareHistory);
}

/** RB21: owner or invited mechanic (by verified e-mail, case-insensitive) may edit the agenda. */
export function isWorkshopStaff(email: string | null | undefined, ownerEmail: string, memberEmails: readonly string[]): boolean {
  if (!email) return false;
  const e = email.toLowerCase();
  return e === ownerEmail.toLowerCase() || memberEmails.some((m) => m.toLowerCase() === e);
}
