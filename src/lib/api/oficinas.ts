// #71, RF25-RF29: HTTP handlers for workshops and appointments, consumed by the Expo app (ADR-010).
// Plain Request/Response (Web standard) so they run in a Next route handler today and in the
// separate Node API later. Authentication is injected; routes are relative to `/oficinas`.
import { prisma } from "@/lib/db";
import { isValidCoords } from "@/lib/geo";
import { allAdminEmailsSetting } from "@/lib/admin-emails";
import { isAuthorizedAdmin } from "@/lib/google/oidc";
import { parseHours, parseProfile, parseService, visitFormFromJson } from "@/lib/workshop-input";
import { appointmentForStaff, bookAt, cancelFor, concludeFor, freeStarts, listAppointments, listNearbyWorkshops } from "@/lib/workshop-agenda";
import {
  addService, adminDecide, adminRequests, inviteMember, myWorkshopView, removeMember, removeService, replaceHours, requestRegistration, staffWorkshop, updateProfile,
} from "@/lib/workshop-staff";
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
 *
 * Back-office (RB21: owner or invited mechanic, checked on every call; only the owner invites):
 * GET  /staff/workshop             my workshop (grid, services, mechanics, appointments, notices) or the request status
 * POST /staff/request              { name, contact, requestText } asks for registration
 * PUT  /staff/profile              { name, description, address, phone, website, latitude, longitude }
 * POST /staff/services             { name, description, includes, durationMin, priceCents }
 * DELETE /staff/services/:id
 * PUT  /staff/hours                [{ weekday, startMin, endMin }] replaces the weekly grid
 * POST /staff/members              { email } (owner) / DELETE /staff/members/:id (owner)
 * GET  /staff/appointments/:id     the booked bike; parts and history only if the athlete shared them (RF27)
 * POST /staff/appointments/:id/conclude  { date, note, items: [{ key, action, condition, note }], free: [...] } (RF28)
 * Admin (RB17):
 * GET  /admin/requests             pending and rejected requests
 * POST /admin/requests/:id/approve | /reject
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
  if (a === "staff") return handleStaff(req, user, path.slice(1));
  if (a === "admin") return handleAdmin(req, user, path.slice(1));
  return fail(404, "Rota não encontrada");
}

async function handleStaff(req: Request, user: ApiUser, path: string[]): Promise<Response> {
  const [a, b] = path;
  if (req.method === "GET" && a === "workshop") return json(await myWorkshopView(user));
  if (req.method === "POST" && a === "request") {
    const result = await requestRegistration(user, await req.json().catch(() => null));
    if (result.ok) return json({ ok: true }, 201);
    return result.error === "exists" ? fail(409, "Já existe um pedido ou oficina com este e-mail") : fail(400, "Dados do pedido inválidos");
  }
  const staff = await staffWorkshop(user);
  if (!staff) return fail(403, "Sem oficina aprovada");
  const { workshop, isOwner } = staff;
  const body = async () => req.json().catch(() => null);

  if (req.method === "PUT" && a === "profile") {
    const profile = parseProfile(await body());
    if (!profile) return fail(400, "Perfil inválido");
    await updateProfile(workshop.id, profile);
    return json({ ok: true });
  }
  if (req.method === "POST" && a === "services" && !b) {
    const service = parseService(await body());
    if (!service) return fail(400, "Serviço inválido");
    const created = await addService(workshop.id, service);
    return json({ id: created.id }, 201);
  }
  if (req.method === "DELETE" && a === "services" && b) {
    await removeService(workshop.id, b);
    return json({ ok: true });
  }
  if (req.method === "PUT" && a === "hours") {
    const hours = parseHours(await body());
    if (!hours) return fail(400, "Grade inválida");
    await replaceHours(workshop.id, hours);
    return json({ ok: true });
  }
  if (a === "appointments" && b) {
    if (req.method === "GET" && !path[2]) {
      const view = await appointmentForStaff(workshop.id, b);
      return view ? json(view) : fail(404, "Agendamento não encontrado");
    }
    if (req.method === "POST" && path[2] === "conclude") {
      const form = visitFormFromJson(await body());
      if (!form) return fail(400, "Dados do serviço inválidos");
      const result = await concludeFor(workshop, b, form);
      if (result.ok) return json({ ok: true });
      if (result.error === "not_found") return fail(404, "Agendamento não encontrado");
      if (result.error === "not_scheduled") return fail(409, "Agendamento não está aberto");
      return fail(400, { visita_vazia: "Informe a data e pelo menos um item do serviço", data: "A data é anterior à instalação de uma peça trocada", plano_invalido: "Esse item não pode ser zerado" }[result.error]);
    }
  }
  if (a === "members") {
    if (!isOwner) return fail(403, "Só o responsável convida mecânicos");
    if (req.method === "POST" && !b) {
      const raw = (await body()) as { email?: unknown } | null;
      const result = await inviteMember(workshop, user, raw?.email);
      if (result.ok) return json({ ok: true }, 201);
      return result.error === "duplicate" ? fail(409, "Mecânico já convidado") : fail(400, "E-mail inválido");
    }
    if (req.method === "DELETE" && b) {
      await removeMember(workshop.id, b);
      return json({ ok: true });
    }
  }
  return fail(404, "Rota não encontrada");
}

async function handleAdmin(req: Request, user: ApiUser, path: string[]): Promise<Response> {
  // RB17: admin rights are re-checked on every request against the current admin list.
  if (user.role !== "ADMIN" || !isAuthorizedAdmin(user.email, await allAdminEmailsSetting())) return fail(403, "Acesso restrito ao administrador");
  const [a, id, action] = path;
  if (req.method === "GET" && a === "requests" && !id) return json({ requests: await adminRequests() });
  if (req.method === "POST" && a === "requests" && id && (action === "approve" || action === "reject")) {
    return (await adminDecide(id, action)) ? json({ ok: true }) : fail(409, "Pedido não está pendente");
  }
  return fail(404, "Rota não encontrada");
}
