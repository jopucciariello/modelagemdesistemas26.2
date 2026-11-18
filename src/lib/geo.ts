// #69, RF26: distance helpers for the "nearby workshops" list (no database, RNF08).

export type Coords = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in km (haversine). */
export function distanceKm(a: Coords, b: Coords): number {
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isValidCoords(latitude: unknown, longitude: unknown): boolean {
  return typeof latitude === "number" && typeof longitude === "number" && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
}

/** Shops with coordinates sorted by distance from `origin`; shops without coordinates go last (distance null). */
export function sortByDistance<T extends { latitude: number | null; longitude: number | null }>(
  shops: readonly T[],
  origin: Coords,
): (T & { distanceKm: number | null })[] {
  return shops
    .map((s) => ({ ...s, distanceKm: s.latitude != null && s.longitude != null ? distanceKm(origin, { latitude: s.latitude, longitude: s.longitude }) : null }))
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
}
