"use server";
// RF37, RB17: the admin adds or removes admin e-mails; root admins stay in ADMIN_EMAILS (Infisical).
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { adminEmailsSetting } from "@/lib/env";
import { text } from "@/lib/forms";
import { requireAdmin } from "@/lib/guards";
import { isRootAdmin } from "@/lib/admin-list";
import { isValidEmail, normalizeEmail } from "@/lib/merchants";

const back = (msg: string) => redirect(`/admin?ok=${msg}`);
const fail = (msg: string) => redirect(`/admin?erro=${msg}`);

export async function addAdminEmail(form: FormData) {
  const admin = await requireAdmin();
  const email = normalizeEmail(text(form, "email", 200));
  if (!isValidEmail(email)) fail("admin_invalido");
  await prisma.adminEmail.upsert({ where: { email }, update: {}, create: { email, addedBy: admin.email } });
  // A user who already signed in becomes admin on the next login (the role is re-evaluated then).
  back("admin_incluido");
}

export async function removeAdminEmail(form: FormData) {
  const admin = await requireAdmin();
  const email = normalizeEmail(text(form, "email", 200));
  if (isRootAdmin(email, adminEmailsSetting())) fail("admin_raiz");
  if (admin.email?.toLowerCase() === email) fail("admin_proprio");
  await prisma.adminEmail.deleteMany({ where: { email } });
  back("admin_removido");
}
