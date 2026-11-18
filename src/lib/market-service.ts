// M3 service layer (RF16-RF24, RF38): framework-agnostic, takes the acting user id so the same
// code serves the Next.js pages and the token-authenticated API used by the Expo app.
import "server-only";
import { prisma } from "@/lib/db";
import { brl } from "@/lib/dreams";
import { sendWithResend } from "@/lib/email";
import { pushToUser } from "@/lib/push-service";
import {
  becameMatch, buildListingFilter, cleanReportReason, joinPhotos, matchesDreamByModel, normalizeWhatsapp,
  validateListing, validateMerchantRequest, type ListingInput, type MarketQuery, type MerchantRequestInput,
} from "@/lib/market";
import { cleanRemovalReason, verificationFields } from "@/lib/merchants";

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

/** Hook for the e-mail copy (RF38). Default: Resend (RESEND_API_KEY, EMAIL_FROM); a failure never loses the notification. */
export type EmailSender = (to: string, subject: string, body: string) => Promise<void>;
let emailSender: EmailSender | null = sendWithResend;
export function setEmailSender(fn: EmailSender | null) { emailSender = fn; }

/** INV-045: one notification per (user, refKey). RF38: e-mail copy only when the user opted in. */
async function notifyOnce(userId: string, refKey: string, message: string, href: string) {
  try {
    await prisma.notification.create({ data: { userId, refKey, message, href } });
  } catch {
    return false; // already notified
  }
  // RF41: native push to the user's devices, if any (best effort).
  await pushToUser(userId, "GearLog", message, href).catch((e) => console.error("push failed", e));
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailAlerts: true } });
  if (user?.emailAlerts && user.email && emailSender) await emailSender(user.email, "GearLog", message).catch((e) => console.error("email failed", e));
  return true;
}

// ---- Listings ---------------------------------------------------------------------------

export type ListingBody = Omit<ListingInput, "categoryId"> & { componentId: string };

async function resolveComponent(componentId: string) {
  return prisma.component.findFirst({ where: { id: componentId, active: true, category: { active: true } } });
}

/** RF16: the listing points to a catalog model; the family comes from the model (RB15). */
export async function createListing(userId: string, body: ListingBody): Promise<Result<{ id: string }>> {
  const component = await resolveComponent(body.componentId);
  if (!component) return fail("modelo_invalido");
  const check = validateListing({ ...body, categoryId: component.categoryId });
  if (!check.ok) return fail(check.error);
  const listing = await prisma.listing.create({
    data: {
      sellerId: userId, categoryId: component.categoryId, componentId: component.id, title: body.title.trim(),
      description: body.description?.trim() || null, condition: body.condition, priceCents: body.priceCents!,
      usedKm: body.condition === "USED" ? (body.usedKm ?? null) : null, photoUrls: joinPhotos(body.photoUrls),
    },
  });
  await alertDreams(listing.id, null).catch((e) => console.error("alertDreams failed", e));
  return { ok: true, data: { id: listing.id } };
}

/** RF16, RB19: only the author edits an ACTIVE listing; RF21: re-alerts when the edit makes a dream match. */
export async function updateListing(userId: string, id: string, body: ListingBody): Promise<Result<{ id: string }>> {
  const before = await prisma.listing.findFirst({ where: { id, sellerId: userId, status: "ACTIVE" } });
  if (!before) return fail("anuncio_nao_encontrado");
  const component = await resolveComponent(body.componentId);
  if (!component) return fail("modelo_invalido");
  const check = validateListing({ ...body, categoryId: component.categoryId });
  if (!check.ok) return fail(check.error);
  await prisma.listing.update({
    where: { id },
    data: {
      categoryId: component.categoryId, componentId: component.id, title: body.title.trim(),
      description: body.description?.trim() || null, condition: body.condition, priceCents: body.priceCents!,
      usedKm: body.condition === "USED" ? (body.usedKm ?? null) : null, photoUrls: joinPhotos(body.photoUrls),
    },
  });
  await alertDreams(id, before).catch((e) => console.error("alertDreams failed", e));
  return { ok: true, data: { id } };
}

export async function setListingStatus(userId: string, id: string, status: "SOLD" | "REMOVED"): Promise<Result<null>> {
  const r = await prisma.listing.updateMany({
    where: { id, sellerId: userId, status: "ACTIVE" },
    data: status === "SOLD" ? { status } : { status, removedAt: new Date() },
  });
  return r.count ? { ok: true, data: null } : fail("anuncio_nao_encontrado");
}

/** RF17: showcase with filters; the seller contact and the shop button (RF18) come with each row. */
export async function listListings(q: MarketQuery & { modelo?: string }) {
  const where: Record<string, unknown> = { ...buildListingFilter(q) };
  if (q.modelo) where.componentId = q.modelo;
  const rows = await prisma.listing.findMany({
    where, orderBy: { createdAt: "desc" }, take: 100,
    include: { category: true, component: true, photos: { select: { id: true }, orderBy: { position: "asc" } }, seller: { select: { id: true, name: true, whatsapp: true, merchant: { select: { name: true, verified: true, shopUrl: true } } } } },
  });
  return rows.map(({ seller, photos: uploaded, ...l }) => ({
    ...l,
    photos: [...uploaded.map((p) => photoUrl(p.id)), ...l.photoUrls.split("\n").filter(Boolean)],
    seller: { id: seller.id, name: seller.name, whatsapp: seller.whatsapp },
    merchant: seller.merchant ? { name: seller.merchant.name, verified: seller.merchant.verified, shopUrl: seller.merchant.shopUrl } : null,
  }));
}

/** RF16: the seller sets the WhatsApp buyers use to contact them. */
export async function setWhatsapp(userId: string, raw: string): Promise<Result<{ whatsapp: string | null }>> {
  if (!raw.trim()) {
    await prisma.user.update({ where: { id: userId }, data: { whatsapp: null } });
    return { ok: true, data: { whatsapp: null } };
  }
  const whatsapp = normalizeWhatsapp(raw);
  if (!whatsapp) return fail("whatsapp_invalido");
  await prisma.user.update({ where: { id: userId }, data: { whatsapp } });
  return { ok: true, data: { whatsapp } };
}

/** RF38: opt-in for e-mail copies of the notifications. */
export async function setEmailAlerts(userId: string, enabled: boolean) {
  await prisma.user.update({ where: { id: userId }, data: { emailAlerts: enabled } });
}

// ---- Dreams (RF20, RF21, RF22) ------------------------------------------------------------

/** RF20: a dream is a catalog model with a maximum price. */
export async function saveDream(userId: string, input: { id?: string; componentId: string; maxPriceCents: number }): Promise<Result<{ id: string }>> {
  const component = await resolveComponent(input.componentId);
  if (!component || !Number.isInteger(input.maxPriceCents) || input.maxPriceCents <= 0) return fail("sonho_invalido");
  const data = { componentId: component.id, categoryId: component.categoryId, maxPriceCents: input.maxPriceCents };
  if (input.id) {
    const r = await prisma.dream.updateMany({ where: { id: input.id, userId }, data });
    return r.count ? { ok: true, data: { id: input.id } } : fail("sonho_nao_encontrado");
  }
  const dream = await prisma.dream.create({ data: { ...data, userId } });
  await notifyMerchantsOfDream(dream.id).catch((e) => console.error("notifyMerchants failed", e));
  // RF21: an existing listing may already satisfy the new dream.
  const open = await prisma.listing.findMany({ where: { status: "ACTIVE", componentId: component.id, priceCents: { lte: dream.maxPriceCents }, sellerId: { not: userId } } });
  for (const l of open) await notifyOnce(userId, `dream:${dream.id}:listing:${l.id}`, `Já existe anúncio do seu sonho: ${l.title} por ${brl(l.priceCents)}.`, `/mercado/${l.id}`);
  return { ok: true, data: { id: dream.id } };
}

export async function deleteDream(userId: string, id: string) {
  await prisma.dream.deleteMany({ where: { id, userId } });
}

/** RF21: tells the owners of dreams that match the listing now but did not match `before` (edit). */
export async function alertDreams(listingId: string, before: { sellerId: string; componentId: string | null; priceCents: number; status: string } | null): Promise<number> {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== "ACTIVE" || !listing.componentId) return 0;
  const dreams = await prisma.dream.findMany({ where: { componentId: listing.componentId, maxPriceCents: { gte: listing.priceCents }, userId: { not: listing.sellerId } } });
  let n = 0;
  for (const d of dreams) {
    if (before && !becameMatch(d, before, listing)) continue;
    if (!matchesDreamByModel(d, listing)) continue;
    if (await notifyOnce(d.userId, `dream:${d.id}:listing:${listing.id}`, `Anúncio do seu sonho: ${listing.title} por ${brl(listing.priceCents)}.`, `/mercado/${listing.id}`)) n++;
  }
  return n;
}

/** RF22 (17/11): only verified merchants that sell the family AND have the paid add-on enabled by the admin. */
export async function notifyMerchantsOfDream(dreamId: string): Promise<number> {
  const dream = await prisma.dream.findUnique({ where: { id: dreamId }, include: { component: true } });
  if (!dream?.component) return 0;
  const merchants = await prisma.merchant.findMany({
    where: { verified: true, dreamAlerts: true, userId: { not: dream.userId }, families: { some: { categoryId: dream.categoryId } } },
  });
  for (const m of merchants) {
    await notifyOnce(m.userId, `dream-merchant:${dream.id}`, `Há um atleta procurando ${dream.component.brand} ${dream.component.model} até ${brl(dream.maxPriceCents)}.`, "/mercado");
  }
  return merchants.length;
}

// ---- Merchants (RF18) ---------------------------------------------------------------------

export async function requestMerchant(userId: string, input: MerchantRequestInput): Promise<Result<{ id: string }>> {
  const check = validateMerchantRequest(input);
  if (!check.ok) return fail(check.error);
  if (await prisma.merchant.findUnique({ where: { userId } })) return fail("lojista_existe");
  if (await prisma.merchantRequest.findFirst({ where: { userId, status: "PENDING" } })) return fail("pedido_pendente");
  const r = await prisma.merchantRequest.create({
    data: { userId, storeName: input.storeName.trim(), message: input.message.trim(), contact: input.contact.trim(), shopUrl: input.shopUrl?.trim() || null },
  });
  return { ok: true, data: { id: r.id } };
}

/** RF18, RB06: the admin approves (creates the store profile, not yet verified) or rejects. */
export async function decideMerchantRequest(requestId: string, approve: boolean): Promise<Result<null>> {
  const req = await prisma.merchantRequest.findFirst({ where: { id: requestId, status: "PENDING" } });
  if (!req) return fail("pedido_nao_encontrado");
  await prisma.$transaction(async (tx) => {
    await tx.merchantRequest.update({ where: { id: req.id }, data: { status: approve ? "APPROVED" : "REJECTED", decidedAt: new Date() } });
    if (approve && !(await tx.merchant.findUnique({ where: { userId: req.userId } }))) {
      await tx.merchant.create({ data: { userId: req.userId, name: req.storeName, description: req.message, shopUrl: req.shopUrl } });
    }
  });
  await notifyOnce(req.userId, `merchant-request:${req.id}`, approve ? "Seu pedido de lojista foi aprovado." : "Seu pedido de lojista foi recusado.", "/configuracoes");
  return { ok: true, data: null };
}

/** RF18: the merchant picks the families they sell and the shop link. */
export async function setMerchantProfile(userId: string, input: { categoryIds: string[]; shopUrl?: string | null }): Promise<Result<null>> {
  const merchant = await prisma.merchant.findUnique({ where: { userId } });
  if (!merchant) return fail("nao_e_lojista");
  if (input.shopUrl && !/^https?:\/\//.test(input.shopUrl)) return fail("loja_url_invalida");
  const valid = await prisma.category.findMany({ where: { id: { in: input.categoryIds }, active: true }, select: { id: true } });
  await prisma.$transaction([
    prisma.merchantFamily.deleteMany({ where: { merchantId: merchant.id } }),
    prisma.merchantFamily.createMany({ data: valid.map((c) => ({ merchantId: merchant.id, categoryId: c.id })) }),
    prisma.merchant.update({ where: { id: merchant.id }, data: { shopUrl: input.shopUrl === undefined ? merchant.shopUrl : input.shopUrl || null } }),
  ]);
  return { ok: true, data: null };
}

/** RF22, RB06: only the admin flips the paid add-on or the seal. */
export async function setMerchantFlags(merchantId: string, flags: { dreamAlerts?: boolean; verified?: boolean }): Promise<Result<null>> {
  const m = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!m) return fail("lojista_nao_encontrado");
  await prisma.merchant.update({
    where: { id: merchantId },
    data: { ...(flags.dreamAlerts === undefined ? {} : { dreamAlerts: flags.dreamAlerts }), ...(flags.verified === undefined ? {} : verificationFields(flags.verified)) },
  });
  return { ok: true, data: null };
}

// ---- Reports and moderation (RF24) --------------------------------------------------------

export async function reportListing(userId: string, listingId: string, rawReason: string): Promise<Result<null>> {
  const reason = cleanReportReason(rawReason);
  if (!reason) return fail("motivo_invalido");
  const listing = await prisma.listing.findFirst({ where: { id: listingId, status: "ACTIVE" } });
  if (!listing) return fail("anuncio_nao_encontrado");
  if (listing.sellerId === userId) return fail("anuncio_proprio");
  await prisma.listingReport.upsert({ where: { listingId_reporterId: { listingId, reporterId: userId } }, create: { listingId, reporterId: userId, reason }, update: { reason } });
  return { ok: true, data: null };
}

/** RF24: admin queue: open reports grouped by listing. */
export async function listOpenReports() {
  return prisma.listingReport.findMany({ where: { resolvedAt: null }, orderBy: { createdAt: "asc" }, include: { listing: { select: { id: true, title: true, status: true, sellerId: true } } } });
}

/** RF24, INV-048: removal keeps the reason and closes the reports; dismissing closes them without removing. */
export async function resolveReports(listingId: string, removalReason: string | null): Promise<Result<null>> {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return fail("anuncio_nao_encontrado");
  if (removalReason !== null) {
    const removedReason = cleanRemovalReason(removalReason);
    if (!removedReason) return fail("motivo_obrigatorio");
    await prisma.listing.update({ where: { id: listingId }, data: { status: "REMOVED", removedReason, removedAt: new Date() } });
    await notifyOnce(listing.sellerId, `listing-removed:${listingId}`, `Seu anúncio "${listing.title}" foi removido: ${removedReason}`, "/mercado/meus");
  }
  await prisma.listingReport.updateMany({ where: { listingId, resolvedAt: null }, data: { resolvedAt: new Date() } });
  return { ok: true, data: null };
}

// ---- Photos (RF16: up to 3 uploaded images per listing) -------------------------------------

import { checkPhoto } from "@/lib/bike-photo";
import { MAX_PHOTOS, splitPhotos } from "@/lib/market";

export const photoUrl = (id: string) => `/api/v1/market/photos/${id}`;

/** RF16, RB19: only the author uploads; legacy URL photos count toward the limit of 3. */
export async function addListingPhoto(userId: string, listingId: string, bytes: Uint8Array): Promise<Result<{ id: string; url: string }>> {
  const listing = await prisma.listing.findFirst({ where: { id: listingId, sellerId: userId, status: "ACTIVE" }, include: { _count: { select: { photos: true } } } });
  if (!listing) return fail("anuncio_nao_encontrado");
  if (listing._count.photos + splitPhotos(listing.photoUrls).length >= MAX_PHOTOS) return fail("fotos_demais");
  const check = checkPhoto(bytes);
  if (!check.ok) return fail(check.error);
  const photo = await prisma.listingPhoto.create({ data: { listingId, position: listing._count.photos, contentType: check.type, data: Buffer.from(bytes) } });
  return { ok: true, data: { id: photo.id, url: photoUrl(photo.id) } };
}

export async function deleteListingPhoto(userId: string, photoId: string): Promise<Result<null>> {
  const r = await prisma.listingPhoto.deleteMany({ where: { id: photoId, listing: { sellerId: userId } } });
  return r.count ? { ok: true, data: null } : fail("foto_nao_encontrada");
}
