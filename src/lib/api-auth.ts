// Bearer-token auth for the Expo app (ADR-010): same Session table as the cookie login.
import "server-only";
import { prisma } from "@/lib/db";
import { bearerToken } from "@/lib/bearer";
import { sha256 } from "@/lib/crypto";

export type ApiUser = { id: string; name: string; email: string | null; role: "ATLETA" | "ADMIN" };

/** Returns the user behind `Authorization: Bearer <token>`, or null when missing, unknown or expired. */
export async function getApiUser(request: Request): Promise<ApiUser | null> {
  const token = bearerToken(request.headers.get("authorization"));
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user as ApiUser;
}

export function unauthorized(): Response {
  return Response.json({ error: "Não autenticado" }, { status: 401 });
}
