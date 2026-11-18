"use server";
// RF16, RB07, RB19: the athlete's own listings (only the author changes a listing).
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { optNumber, text } from "@/lib/forms";
import { notifyDreamMatches } from "@/lib/dreams";
import { resolvePicked } from "@/lib/catalog/pick";
import { readPicked } from "@/lib/picker";
import { requireUser } from "@/lib/guards";
import { joinPhotos, parsePriceToCents, validateListing } from "@/lib/market";

function readListing(form: FormData) {
  const raw = text(form, "condition");
  const condition = (raw === "USED" || raw === "NEW" ? raw : "") as "NEW" | "USED";
  const kmText = text(form, "usedKm", 30);
  return {
    title: text(form, "title", 120),
    categoryId: text(form, "categoryId", 40),
    condition,
    priceCents: parsePriceToCents(text(form, "price", 20)),
    description: text(form, "description", 2000) || null,
    photoUrls: text(form, "photos", 1500).split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
    // An unparsable km becomes -1 so validateListing refuses it instead of silently dropping it.
    usedKm: kmText ? (optNumber(form, "usedKm") ?? -1) : null,
  };
}

async function checked(form: FormData, back: string, userId: string) {
  const sep = back.includes("?") ? "&" : "?";
  const input = readListing(form);
  const picked = readPicked(form);
  const resolved = picked ? await resolvePicked(userId, picked) : null;
  if (!picked || !resolved) redirect(`${back}${sep}erro=familia_invalida`);
  const comp = await prisma.component.findFirst({ where: { id: resolved!.componentId } });
  // RF16: the title defaults to brand and model; a hand-typed part has no catalog component on the listing.
  if (!input.title && comp) input.title = `${comp.brand} ${comp.model}`.slice(0, 120);
  input.categoryId = picked!.categoryId;
  const result = validateListing(input);
  if (!result.ok) redirect(`${back}${sep}erro=${result.error}`);
  const category = await prisma.category.findFirst({ where: { id: input.categoryId, active: true } });
  if (!category) redirect(`${back}${sep}erro=familia_invalida`);
  return {
    title: input.title,
    categoryId: input.categoryId,
    componentId: picked!.componentId,
    condition: input.condition,
    priceCents: input.priceCents!,
    description: input.description,
    photoUrls: joinPhotos(input.photoUrls),
    usedKm: input.condition === "USED" ? input.usedKm : null,
  };
}

/** RB19: loads a listing only if the signed-in user is its author. */
async function ownListing(userId: string, id: string) {
  const listing = await prisma.listing.findFirst({ where: { id, sellerId: userId } });
  if (!listing) redirect("/mercado/meus?erro=anuncio_nao_encontrado");
  return listing!;
}

export async function createListing(form: FormData) {
  const user = await requireUser();
  const data = await checked(form, "/mercado/novo", user.id);
  const listing = await prisma.listing.create({ data: { ...data, sellerId: user.id } });
  // RF21: tell the owners of matching dreams; a notification failure must not lose the listing.
  await notifyDreamMatches(listing.id).catch((e) => console.error("notifyDreamMatches failed", e));
  redirect(`/mercado/${listing.id}?ok=publicado`);
}

export async function updateListing(form: FormData) {
  const user = await requireUser();
  const listing = await ownListing(user.id, text(form, "id", 40));
  if (listing.status !== "ACTIVE") redirect("/mercado/meus?erro=anuncio_nao_encontrado");
  const data = await checked(form, `/mercado/meus?editar=${listing.id}`, user.id);
  await prisma.listing.update({ where: { id: listing.id }, data });
  redirect("/mercado/meus?ok=editado");
}

export async function markSold(form: FormData) {
  const user = await requireUser();
  const listing = await ownListing(user.id, text(form, "id", 40));
  if (listing.status === "ACTIVE") await prisma.listing.update({ where: { id: listing.id }, data: { status: "SOLD" } });
  redirect("/mercado/meus?ok=vendido");
}

/** Closing = the author withdraws the listing (REMOVED without reason; admin removal is RF24). */
export async function closeListing(form: FormData) {
  const user = await requireUser();
  const listing = await ownListing(user.id, text(form, "id", 40));
  if (listing.status === "ACTIVE") await prisma.listing.update({ where: { id: listing.id }, data: { status: "REMOVED", removedAt: new Date() } });
  redirect("/mercado/meus?ok=encerrado");
}
