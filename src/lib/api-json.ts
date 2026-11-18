// Small helpers for the app's JSON API routes (issue #64).
import type { MaintenanceResult } from "@/lib/maintenance";

/** Reads a JSON object body; anything else becomes an empty object. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** A trimmed string field, cut to `max` characters; "" when absent or not a string. */
export function field(body: Record<string, unknown>, key: string, max: number): string {
  const value = body[key];
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

const NOT_FOUND = new Set(["peca_nao_encontrada", "bike_nao_encontrada"]);

export function maintenanceResponse(result: MaintenanceResult): Response {
  if (result.ok) return Response.json({ ok: true, bikeId: result.bikeId });
  return Response.json({ error: result.error }, { status: NOT_FOUND.has(result.error) ? 404 : 400 });
}
