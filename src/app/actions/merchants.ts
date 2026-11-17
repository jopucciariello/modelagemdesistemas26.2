"use server";
// RF18, RF24, RB06: only the admin registers merchants, grants the seal and removes listings.
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { text } from "@/lib/forms";
import { requireAdmin } from "@/lib/guards";
import { cleanRemovalReason, isValidEmail, normalizeEmail, verificationFields } from "@/lib/merchants";

const back = (msg: string) => redirect(`/admin?ok=${msg}`);
const fail = (msg: string) => redirect(`/admin?erro=${msg}`);

/** RF18 (OPEN-30): the admin picks a user who already signed in with Google and creates the store profile. */
export async function createMerchant(form: FormData) {
  await requireAdmin();
  const email = normalizeEmail(text(form, "email", 200));
  const name = text(form, "name", 80);
  const description = text(form, "description", 300) || null;
  if (!isValidEmail(email) || !name) fail("lojista_invalido");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) fail("lojista_sem_usuario");
  if (await prisma.merchant.findUnique({ where: { userId: user!.id } })) fail("lojista_existe");
  await prisma.merchant.create({ data: { userId: user!.id, name, description } });
  back("lojista");
}

/** RB06, INV-047: only the admin grants or revokes the seal; revoking takes effect at once (INV-049). */
export async function setVerified(merchantId: string, verified: boolean) {
  await requireAdmin();
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant) fail("lojista_nao_encontrado");
  await prisma.merchant.update({ where: { id: merchantId }, data: verificationFields(verified) });
  back(verified ? "selo_concedido" : "selo_revogado");
}

/** RF24, INV-048: removal keeps the record, the reason and the date. */
export async function removeListing(listingId: string, reason: string) {
  await requireAdmin();
  const removedReason = cleanRemovalReason(reason);
  if (!removedReason) fail("motivo_obrigatorio");
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) fail("anuncio_invalido");
  await prisma.listing.update({ where: { id: listingId }, data: { status: "REMOVED", removedReason, removedAt: new Date() } });
  back("anuncio_removido");
}
