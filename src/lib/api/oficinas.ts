// #71, RF25-RF29: HTTP handlers for workshops and appointments, consumed by the Expo app (ADR-010).
// Plain Request/Response (Web standard) so they run in a Next route handler today and in the
// separate Node API later. Authentication is injected; routes are relative to `/oficinas`.
import { prisma } from "@/lib/db";
import { isValidCoords } from "@/lib/geo";
import { bookAt, cancelFor, freeStarts, listAppointments, listNearbyWorkshops } from "@/lib/workshop-agenda";
import type { ApiUser } from "@/lib/api-auth";

const json = (body: unknown, status = 200) => Response.json(body, { status });
const fail = (status: number, error: string) => json({ error }, status);

export type BookBody = { workshopId: string; serviceId: string; bikeId: string; startsAt: Date; shareHistory: boolean };

/** RF26, RF27: validates the JSON body of a booking; `shareHistory` is the athlete's own choice. */
export function parseBookBody(raw: unknown): BookBody | null {
  if (typeof raw !== "object" || raw === null) return null;
  const b = raw as Record<string, unknown>;
  const ids = [b.workshopId, b.serviceId, b.bikeId];
  if (!ids.every((v) => typeof v === "string" && v.length > 0 && v.length <= 40)) return null;
  if (typeof b.startsAt !== "string") return null;
  const startsAt = new Date(b.startsAt);
  if (Number.isNaN(startsAt.getTime())) return null;
  return { workshopId: b.workshopId as string, serviceId: b.serviceId as string, bikeId: b.bikeId as string, startsAt, shareHistory: b.shareHistory === true };
}

/** #69: `lat` and `lng` query params -> coordinates, or null when absent or invalid. */
export function parseOrigin(url: URL): { latitude: number; longitude: number } | null {
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");
  if (lat === null || lng === null) return null;
  const latitude = Number(lat);
  const longitude = Number(lng);
  return isValidCoords(latitude, longitude) ? { latitude, longitude } : null;
}

/**
 * GET  /workshops?lat&lng          nearby workshops (services, price, site), nearest first
 * GET  /workshops/:id/slots?serviceId   free start times from the weekly grid
 * GET  /my-bikes                   the athlete's bikes to choose from when booking
 * GET  /appointments               the athlete's appointments
 * POST /appointments               { workshopId, serviceId, bikeId, startsAt, shareHistory }
 * POST /appointments/:id/cancel    cancel (workshop is told in the app and by e-mail)
 */
export async function handleOficinas(req: Request, path: string[], auth: (req: Request) => Promise<ApiUser | null>): Promise<Response> {
  const user = await auth(req);
  if (!user) return fail(401, "Não autenticado");
  const url = new URL(req.url);
  const [a, b, c] = path;

  if (req.method === "GET" && a === "workshops" && !b) {
    const shops = await listNearbyWorkshops(parseOrigin(url));
    return json({ workshops: shops });
  }
  if (req.method === "GET" && a === "workshops" && b && c === "slots") {
    const serviceId = url.searchParams.get("serviceId");
    if (!serviceId) return fail(400, "serviceId é obrigatório");
    const starts = await freeStarts(b, serviceId);
    return json({ starts: starts.map((d) => d.toISOString()) });
  }
  if (req.method === "GET" && a === "my-bikes") {
    const bikes = await prisma.bike.findMany({ where: { userId: user.id, archivedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } });
    return json({ bikes });
  }
  if (req.method === "GET" && a === "appointments" && !b) return json({ appointments: await listAppointments(user.id) });
  if (req.method === "POST" && a === "appointments" && !b) {
    const body = parseBookBody(await req.json().catch(() => null));
    if (!body) return fail(400, "Dados do agendamento inválidos");
    const result = await bookAt({ userId: user.id, ...body });
    if (!result.ok) return fail(result.error === "invalid" ? 400 : 409, result.error === "invalid" ? "Bike ou serviço inválido" : "Horário indisponível");
    return json({ appointmentId: result.appointmentId }, 201);
  }
  if (req.method === "POST" && a === "appointments" && b && c === "cancel") {
    const result = await cancelFor(user.id, user.name, b);
    return result.ok ? json({ ok: true, late: result.late }) : fail(409, "Agendamento não pode ser cancelado");
  }
  return fail(404, "Rota não encontrada");
}
