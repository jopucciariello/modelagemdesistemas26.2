// RF04: after the OAuth exchange, find or create the athlete and store encrypted tokens (RNF01).
import "server-only";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { tokenEncryptionKey } from "@/lib/env";
import type { StravaTokenResponse } from "@/lib/strava/oauth";

export async function linkStravaAccount(token: StravaTokenResponse, scope: string): Promise<string> {
  if (!token.athlete) throw new Error("Strava token response has no athlete.");
  const key = tokenEncryptionKey();
  const tokens = {
    scope,
    accessTokenEncrypted: encrypt(token.accessToken, key),
    refreshTokenEncrypted: encrypt(token.refreshToken, key),
    expiresAt: token.expiresAt,
  };
  const name = `${token.athlete.firstname} ${token.athlete.lastname}`.trim() || "Atleta";

  const existing = await prisma.stravaConnection.findUnique({
    where: { stravaAthleteId: token.athlete.id },
  });
  if (existing) {
    await prisma.stravaConnection.update({ where: { id: existing.id }, data: tokens });
    return existing.userId;
  }
  const user = await prisma.user.create({
    data: { name, strava: { create: { stravaAthleteId: token.athlete.id, ...tokens } } },
  });
  return user.id;
}
