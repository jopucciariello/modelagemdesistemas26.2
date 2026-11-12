// Dates typed by the athlete are calendar days in Brazil (America/Sao_Paulo, UTC-3).
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-11-12" -> start of that day in São Paulo. Null when invalid. */
export function parseLocalDay(value: unknown, hour = 0): Date | null {
  if (typeof value !== "string" || !DAY.test(value)) return null;
  const date = new Date(`${value}T${String(hour).padStart(2, "0")}:00:00-03:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Date -> "2026-11-12" in São Paulo, for <input type="date">. */
export function toLocalDay(date: Date): string {
  return new Date(date.getTime() - 3 * 3600_000).toISOString().slice(0, 10);
}

/** Date -> "12/11/2026" for display. */
export function formatDay(date: Date): string {
  return date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
