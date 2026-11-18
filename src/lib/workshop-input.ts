// RF25 (#30, #70): pure validation of the back-office JSON bodies (no database, RNF08).
import { isValidGridHour, parseIncludes, type GridHour } from "@/lib/workshop";

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/[ \t]+/g, " ").slice(0, max) : "");
const optional = (v: unknown, max: number) => clean(v, max) || null;

export type ProfileInput = { name: string; description: string | null; address: string | null; phone: string | null; website: string | null; latitude: number | null; longitude: number | null };

/** RF25, #69: profile with site and coordinates (both coordinates or none). */
export function parseProfile(raw: unknown): ProfileInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const b = raw as Record<string, unknown>;
  const name = clean(b.name, 80);
  if (name.length < 2) return null;
  const website = optional(b.website, 200);
  if (website && !/^https?:\/\/\S+$/i.test(website)) return null;
  const hasLat = b.latitude !== null && b.latitude !== undefined;
  const hasLng = b.longitude !== null && b.longitude !== undefined;
  if (hasLat !== hasLng) return null;
  let latitude: number | null = null;
  let longitude: number | null = null;
  if (hasLat && hasLng) {
    if (typeof b.latitude !== "number" || typeof b.longitude !== "number") return null;
    if (Math.abs(b.latitude) > 90 || Math.abs(b.longitude) > 180) return null;
    latitude = b.latitude;
    longitude = b.longitude;
  }
  return { name, description: optional(b.description, 500), address: optional(b.address, 160), phone: optional(b.phone, 30), website, latitude, longitude };
}

export type ServiceInput = { name: string; description: string | null; includes: string; durationMin: number; priceCents: number | null };

/** RF25: service with estimated duration (multiple of 15 min, 15 min to 12 h) and optional price. */
export function parseService(raw: unknown): ServiceInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const b = raw as Record<string, unknown>;
  const name = clean(b.name, 80);
  if (!name) return null;
  const durationMin = b.durationMin;
  if (typeof durationMin !== "number" || !Number.isInteger(durationMin) || durationMin < 15 || durationMin > 720 || durationMin % 15 !== 0) return null;
  const price = b.priceCents;
  if (price !== null && price !== undefined && (typeof price !== "number" || !Number.isInteger(price) || price < 0 || price > 100_000_000)) return null;
  const includes = parseIncludes(typeof b.includes === "string" ? b.includes : "").join("\n");
  return { name, description: optional(b.description, 300), includes, durationMin, priceCents: typeof price === "number" ? price : null };
}

/** RF25, OPEN-41: the weekly grid; every row valid and no two windows overlapping on the same day. */
export function parseHours(raw: unknown): GridHour[] | null {
  if (!Array.isArray(raw) || raw.length > 70) return null;
  const rows: GridHour[] = [];
  for (const r of raw) {
    if (typeof r !== "object" || r === null) return null;
    const { weekday, startMin, endMin } = r as Record<string, unknown>;
    if (typeof weekday !== "number" || typeof startMin !== "number" || typeof endMin !== "number") return null;
    const row = { weekday, startMin, endMin };
    if (!isValidGridHour(row)) return null;
    rows.push(row);
  }
  const sorted = [...rows].sort((a, b) => a.weekday - b.weekday || a.startMin - b.startMin);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].weekday === sorted[i - 1].weekday && sorted[i].startMin < sorted[i - 1].endMin) return null;
  }
  return sorted;
}
