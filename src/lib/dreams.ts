// RF20-RF23, ADR-008: dreams (wanted parts), matching against listings and in-app notifications.
import "server-only";
import { prisma } from "@/lib/db";

export type DreamLike = { categoryId: string; keywords: string | null; maxPriceCents: number; userId?: string };
export type ListingLike = { categoryId: string; title: string; priceCents: number; status: string; sellerId?: string };

/** Lowercase, without accents, single spaces. */
export function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Keywords are separated by spaces or commas. */
export function keywordList(keywords: string | null | undefined): string[] {
  return normalize(keywords ?? "").split(/[\s,;]+/).filter(Boolean);
}

/** RF21, INV-044, INV-046: same family, every keyword in the title, price <= max, ACTIVE, never the author. */
export function matchesDream(dream: DreamLike, listing: ListingLike): boolean {
  if (listing.status !== "ACTIVE") return false;
  if (dream.userId !== undefined && listing.sellerId !== undefined && dream.userId === listing.sellerId) return false;
  if (dream.categoryId !== listing.categoryId) return false;
  if (listing.priceCents > dream.maxPriceCents) return false;
  const title = normalize(listing.title);
  return keywordList(dream.keywords).every((k) => title.includes(k));
}

export const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** INV-045: one notification per user and refKey; duplicates are ignored. */
async function notifyOnce(userId: string, refKey: string, message: string, href: string) {
  try {
    await prisma.notification.create({ data: { userId, refKey, message, href } });
  } catch {
    // unique (userId, refKey) violated: already notified.
  }
}

/** RF21: notifies the owner of every dream that matches the listing. Idempotent. */
export async function notifyDreamMatches(listingId: string): Promise<number> {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== "ACTIVE") return 0;
  const dreams = await prisma.dream.findMany({
    where: { categoryId: listing.categoryId, maxPriceCents: { gte: listing.priceCents }, userId: { not: listing.sellerId } },
  });
  let count = 0;
  for (const dream of dreams) {
    if (!matchesDream(dream, listing)) continue;
    await notifyOnce(
      dream.userId,
      `dream:${dream.id}:listing:${listing.id}`,
      `Anúncio compatível com o seu sonho: ${listing.title} por ${brl(listing.priceCents)}.`,
      `/mercado/${listing.id}`,
    );
    count++;
  }
  return count;
}

/** RF22, OPEN-33: verified merchants with an ACTIVE or SOLD listing in the dream's family are notified. */
export async function notifyMerchantsOfDream(dreamId: string): Promise<number> {
  const dream = await prisma.dream.findUnique({ where: { id: dreamId }, include: { category: true } });
  if (!dream) return 0;
  const merchants = await prisma.merchant.findMany({
    where: {
      verified: true,
      userId: { not: dream.userId },
      user: { listings: { some: { categoryId: dream.categoryId, status: { in: ["ACTIVE", "SOLD"] } } } },
    },
  });
  for (const m of merchants) {
    await notifyOnce(
      m.userId,
      `dream-merchant:${dream.id}`,
      `Há um atleta procurando ${dream.category.name}${dream.keywords ? ` (${dream.keywords})` : ""} até ${brl(dream.maxPriceCents)}.`,
      "/mercado",
    );
  }
  return merchants.length;
}

/** RF23: ACTIVE listings of a family, newest first. */
export async function suggestListingsForCategory(categoryId: string, limit = 3) {
  return prisma.listing.findMany({ where: { categoryId, status: "ACTIVE" }, orderBy: { createdAt: "desc" }, take: limit });
}
