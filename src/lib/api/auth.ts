// Bearer-token auth for the API used by the Expo app: the token is a Session token (only its hash is stored).
import "server-only";
import { prisma } from "@/lib/db";
import { sha256 } from "@/lib/crypto";
import { adminEmailsSetting } from "@/lib/env";
import { isAuthorizedAdmin } from "@/lib/google/oidc";

export type ApiUser = { id: string; name: string; email: string | null; isAdmin: boolean };

export async function getApiUser(req: Request): Promise<ApiUser | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;
  const u = session.user;
  // RB17: admin rights are re-checked on every call.
  return { id: u.id, name: u.name, email: u.email, isAdmin: u.role === "ADMIN" && isAuthorizedAdmin(u.email, adminEmailsSetting()) };
}
