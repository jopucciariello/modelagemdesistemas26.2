// Router of the M3 endpoints (/api/v1/...), used by the Expo app. Framework-agnostic: Request -> Response.
import "server-only";
import { prisma } from "@/lib/db";
import { getApiUser, type ApiUser } from "@/lib/api/auth";
import * as svc from "@/lib/market-service";
import { ERROR_TEXT, whatsappLink } from "@/lib/market";

const json = (data: unknown, status = 200) => Response.json(data, { status });
const err = (error: string, status = 400) => json({ error: ERROR_TEXT[error] ?? error, code: error }, status);
const reply = <T,>(r: svc.Result<T>, okStatus = 200) => (r.ok ? json(r.data ?? { ok: true }, okStatus) : err(r.error, r.error.endsWith("nao_encontrado") ? 404 : 400));

type Ctx = { req: Request; user: ApiUser | null; seg: string[]; query: URLSearchParams };
type Handler = (c: Ctx, params: string[]) => Promise<Response>;
const need = (fn: (c: Ctx & { user: ApiUser }, p: string[]) => Promise<Response>, admin = false): Handler => async (c, p) => {
  if (!c.user) return json({ error: "Não autenticado" }, 401);
  if (admin && !c.user.isAdmin) return json({ error: "Acesso negado" }, 403);
  return fn(c as Ctx & { user: ApiUser }, p);
};
const body = async (req: Request) => ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : "");
const listingBody = (b: Record<string, unknown>) => ({
  title: str(b.title), componentId: str(b.componentId), condition: b.condition as "NEW" | "USED",
  priceCents: Number.isInteger(b.priceCents) ? (b.priceCents as number) : null, description: str(b.description) || null,
  photoUrls: Array.isArray(b.photoUrls) ? b.photoUrls.map(str) : [], usedKm: typeof b.usedKm === "number" ? b.usedKm : null,
});

const routes: Array<[string, string, Handler]> = [
  // Catalog lookup for the model picker (RB15)
  ["GET", "catalog/components", need(async (c) => {
    const q = c.query.get("q")?.trim();
    const cat = c.query.get("categoria");
    return json(await prisma.component.findMany({
      where: { active: true, category: { active: true }, ...(cat ? { categoryId: cat } : {}), ...(q ? { OR: [{ brand: { contains: q } }, { model: { contains: q } }] } : {}) },
      select: { id: true, brand: true, model: true, categoryId: true, category: { select: { name: true } } }, orderBy: [{ brand: "asc" }, { model: "asc" }], take: 50,
    }));
  })],
  ["GET", "catalog/categories", need(async () => json(await prisma.category.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } })))],
  // Listings (RF16, RF17)
  ["GET", "market/listings", async (c) => {
    const q = Object.fromEntries(c.query) as Record<string, string>;
    const rows = await svc.listListings(q);
    return json(rows.map((l) => ({ ...l, contactUrl: l.seller.whatsapp ? whatsappLink(l.seller.whatsapp, l.title) : null })));
  }],
  ["POST", "market/listings", need(async (c) => reply(await svc.createListing(c.user.id, listingBody(await body(c.req))), 201))],
  ["PUT", "market/listings/:id", need(async (c, [id]) => reply(await svc.updateListing(c.user.id, id, listingBody(await body(c.req)))))],
  ["POST", "market/listings/:id/status", need(async (c, [id]) => {
    const s = (await body(c.req)).status;
    return s === "SOLD" || s === "REMOVED" ? reply(await svc.setListingStatus(c.user.id, id, s)) : err("status_invalido");
  })],
  ["POST", "market/listings/:id/photos", need(async (c, [id]) => {
    const file = (await c.req.formData().catch(() => null))?.get("photo");
    if (!(file instanceof File)) return err("foto_vazia");
    return reply(await svc.addListingPhoto(c.user.id, id, new Uint8Array(await file.arrayBuffer())), 201);
  })],
  ["DELETE", "market/photos/:id", need(async (c, [id]) => reply(await svc.deleteListingPhoto(c.user.id, id)))],
  ["GET", "market/photos/:id", async (_c, [id]) => {
    const photo = await prisma.listingPhoto.findFirst({ where: { id, listing: { status: "ACTIVE" } } });
    if (!photo) return json({ error: "Não encontrada" }, 404);
    return new Response(new Uint8Array(photo.data), { headers: { "Content-Type": photo.contentType, "Cache-Control": "public, max-age=3600", "Content-Security-Policy": "default-src 'none'" } });
  }],
  ["POST", "market/listings/:id/report", need(async (c, [id]) => reply(await svc.reportListing(c.user.id, id, str((await body(c.req)).reason))))],
  // Dreams (RF20)
  ["GET", "market/dreams", need(async (c) => json(await prisma.dream.findMany({ where: { userId: c.user.id }, include: { component: true }, orderBy: { createdAt: "desc" } })))],
  ["POST", "market/dreams", need(async (c) => { const b = await body(c.req); return reply(await svc.saveDream(c.user.id, { componentId: str(b.componentId), maxPriceCents: Number(b.maxPriceCents) }), 201); })],
  ["PUT", "market/dreams/:id", need(async (c, [id]) => { const b = await body(c.req); return reply(await svc.saveDream(c.user.id, { id, componentId: str(b.componentId), maxPriceCents: Number(b.maxPriceCents) })); })],
  ["DELETE", "market/dreams/:id", need(async (c, [id]) => { await svc.deleteDream(c.user.id, id); return json({ ok: true }); })],
  // Notifications (RF21, RF22) and contact settings (RF16, RF38)
  ["GET", "notifications", need(async (c) => json(await prisma.notification.findMany({ where: { userId: c.user.id }, orderBy: { createdAt: "desc" }, take: 100 })))],
  ["POST", "notifications/read", need(async (c) => { await prisma.notification.updateMany({ where: { userId: c.user.id, readAt: null }, data: { readAt: new Date() } }); return json({ ok: true }); })],
  ["GET", "me/contact", need(async (c) => json(await prisma.user.findUnique({ where: { id: c.user.id }, select: { whatsapp: true, emailAlerts: true } })))],
  ["PUT", "me/contact", need(async (c) => {
    const b = await body(c.req);
    if (typeof b.whatsapp === "string") { const r = await svc.setWhatsapp(c.user.id, b.whatsapp); if (!r.ok) return reply(r); }
    if (typeof b.emailAlerts === "boolean") await svc.setEmailAlerts(c.user.id, b.emailAlerts);
    return json(await prisma.user.findUnique({ where: { id: c.user.id }, select: { whatsapp: true, emailAlerts: true } }));
  })],
  // Merchant (RF18)
  ["POST", "merchant/request", need(async (c) => { const b = await body(c.req); return reply(await svc.requestMerchant(c.user.id, { storeName: str(b.storeName), message: str(b.message), contact: str(b.contact), shopUrl: str(b.shopUrl) || null }), 201); })],
  ["GET", "merchant/me", need(async (c) => json({
    merchant: await prisma.merchant.findUnique({ where: { userId: c.user.id }, include: { families: true } }),
    pendingRequest: await prisma.merchantRequest.findFirst({ where: { userId: c.user.id, status: "PENDING" } }),
  }))],
  ["PUT", "merchant/profile", need(async (c) => { const b = await body(c.req); return reply(await svc.setMerchantProfile(c.user.id, { categoryIds: Array.isArray(b.categoryIds) ? b.categoryIds.map(str) : [], shopUrl: "shopUrl" in b ? str(b.shopUrl) : undefined })); })],
  // Admin (RF18, RF22, RF24)
  ["GET", "admin/market", need(async () => json({
    requests: await prisma.merchantRequest.findMany({ where: { status: "PENDING" }, include: { user: { select: { name: true, email: true } } } }),
    reports: await svc.listOpenReports(),
    merchants: await prisma.merchant.findMany({ include: { user: { select: { email: true } } } }),
  }), true)],
  ["POST", "admin/merchant-requests/:id", need(async (c, [id]) => reply(await svc.decideMerchantRequest(id, (await body(c.req)).approve === true)), true)],
  ["PATCH", "admin/merchants/:id", need(async (c, [id]) => { const b = await body(c.req); return reply(await svc.setMerchantFlags(id, { dreamAlerts: typeof b.dreamAlerts === "boolean" ? b.dreamAlerts : undefined, verified: typeof b.verified === "boolean" ? b.verified : undefined })); }, true)],
  ["POST", "admin/listings/:id/resolve", need(async (c, [id]) => { const r = (await body(c.req)).removalReason; return reply(await svc.resolveReports(id, typeof r === "string" ? r : null)); }, true)],
];

function match(pattern: string, seg: string[]): string[] | null {
  const parts = pattern.split("/");
  if (parts.length !== seg.length) return null;
  const params: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith(":")) params.push(decodeURIComponent(seg[i]));
    else if (parts[i] !== seg[i]) return null;
  }
  return params;
}

/** Dispatches /api/v1/<seg...>; unknown paths 404, wrong method 405. */
export async function handleApi(req: Request, seg: string[]): Promise<Response> {
  let methodMismatch = false;
  for (const [method, pattern, handler] of routes) {
    const params = match(pattern, seg);
    if (!params) continue;
    if (method !== req.method) { methodMismatch = true; continue; }
    const user = pattern.startsWith("market/photos/") && method === "GET" ? null : await getApiUser(req);
    try {
      return await handler({ req, user, seg, query: new URL(req.url).searchParams }, params);
    } catch (e) {
      console.error("api error", e);
      return json({ error: "Erro interno" }, 500);
    }
  }
  return methodMismatch ? json({ error: "Método não permitido" }, 405) : json({ error: "Não encontrado" }, 404);
}

