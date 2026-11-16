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
