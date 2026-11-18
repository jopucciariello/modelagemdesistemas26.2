// ADR-010: token auth for the Expo app. The app sends `Authorization: Bearer <token>`; the token is
// a session token (only its SHA-256 is stored in `Session`), the same table the site cookie uses.
import { sha256 } from "@/lib/crypto";
import { prisma } from "@/lib/db";

export type ApiUser = { id: string; name: string; email: string | null };

export function bearerToken(req: Request): string | null {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.get("authorization") ?? "");
  return match ? match[1] : null;
}

export async function userFromBearer(req: Request, now = new Date()): Promise<ApiUser | null> {
  const token = bearerToken(req);
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return session && session.expiresAt > now ? session.user : null;
}
