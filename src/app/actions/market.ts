"use server";
// RF16, RB07, RB19: the athlete's own listings (only the author changes a listing).
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { optNumber, text } from "@/lib/forms";
import { notifyDreamMatches } from "@/lib/dreams";
import { resolvePicked } from "@/lib/catalog/pick";
import { readPicked } from "@/lib/picker";
import { checkPhoto } from "@/lib/bike-photo";
import { requireUser } from "@/lib/guards";
import { checkNewPhotos, joinPhotos, parsePriceToCents, validateListing } from "@/lib/market";

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

/** RF16: uploaded files from the form (empty file inputs are ignored). */
async function readFiles(form: FormData): Promise<Uint8Array[]> {
  const files = form.getAll("photoFiles").filter((f): f is File => f instanceof File && f.size > 0);
  return Promise.all(files.map(async (f) => new Uint8Array(await f.arrayBuffer())));
}

/** Saves the new uploads after the listing exists (position follows the kept uploads). */
async function saveFiles(listingId: string, files: Uint8Array[]) {
  let position = await prisma.listingPhoto.count({ where: { listingId } });
  for (const bytes of files) {
    const check = checkPhoto(bytes);
    if (!check.ok) continue;
    await prisma.listingPhoto.create({ data: { listingId, position: position++, contentType: check.type, data: Buffer.from(bytes) } });
  }
}

async function checked(form: FormData, back: string, userId: string, keptUploads = 0) {
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
  const files = await readFiles(form);
  const photoCheck = checkNewPhotos(keptUploads + input.photoUrls.length, files);
  if (!photoCheck.ok) redirect(`${back}${sep}erro=${photoCheck.error}`);
  const category = await prisma.category.findFirst({ where: { id: input.categoryId, active: true } });
  if (!category) redirect(`${back}${sep}erro=familia_invalida`);
  return {
    files,
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
  const { files, ...data } = await checked(form, "/mercado/novo", user.id);
  const listing = await prisma.listing.create({ data: { ...data, sellerId: user.id } });
  await saveFiles(listing.id, files);
  // RF21: tell the owners of matching dreams; a notification failure must not lose the listing.
  await notifyDreamMatches(listing.id).catch((e) => console.error("notifyDreamMatches failed", e));
  redirect(`/mercado/${listing.id}?ok=publicado`);
}

export async function updateListing(form: FormData) {
  const user = await requireUser();
  const listing = await ownListing(user.id, text(form, "id", 40));
  if (listing.status !== "ACTIVE") redirect("/mercado/meus?erro=anuncio_nao_encontrado");
  // RF16: the author may drop uploaded photos while editing; what is left counts toward the limit of 3.
  const removeIds = form.getAll("removePhoto").map(String);
  const kept = await prisma.listingPhoto.count({ where: { listingId: listing.id, id: { notIn: removeIds } } });
  const { files, ...data } = await checked(form, `/mercado/meus?editar=${listing.id}`, user.id, kept);
  await prisma.listing.update({ where: { id: listing.id }, data });
  if (removeIds.length) await prisma.listingPhoto.deleteMany({ where: { listingId: listing.id, id: { in: removeIds } } });
  await saveFiles(listing.id, files);
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
