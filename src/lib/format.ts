// Small display helpers shared by the screens.

/** 1.5 -> "1 h 30 m"; 0.25 -> "15 m"; 2 -> "2 h 0 m". */
export function formatDuration(hours: number): string {
  const total = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h} h ${m} m` : `${m} m`;
}
