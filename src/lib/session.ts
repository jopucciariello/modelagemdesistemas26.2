// Cookie-based server session. The cookie holds a random token; the DB keeps only its hash.
import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/crypto";
import { adminEmailsSetting } from "@/lib/env";
import { isAuthorizedAdmin } from "@/lib/google/oidc";

export const SESSION_COOKIE = "gearlog_session";
const SESSION_DAYS = 30;

export async function createSession(userId: string): Promise<void> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { tokenHash: sha256(token), userId, expiresAt } });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  // The expiry check depends on the current time: render it per request.
  await connection();
  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { select: { id: true, name: true, email: true, role: true, strava: { select: { stravaAthleteId: true } } } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

/**
 * RB17: returns the current user only if they are an admin whose e-mail is still in
 * ADMIN_EMAILS, so removing an e-mail from the list revokes access on the next request.
 */
export async function getCurrentAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN" || !isAuthorizedAdmin(user.email, adminEmailsSetting())) return null;
  return user;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  store.delete(SESSION_COOKIE);
}
