// RF33, RNF01: the athlete's own Strava app credentials and tokens, always stored encrypted.
import "server-only";
import { prisma } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto";
import { stravaCallbackUrl, stravaOauthBaseUrl, tokenEncryptionKey } from "@/lib/env";
import type { StravaOAuthConfig, StravaTokenResponse } from "@/lib/strava/oauth";

/** Saves the athlete's Strava app (Client ID + Client Secret) and picks Strava as their source. */
export async function saveStravaApp(userId: string, clientId: string, clientSecret: string): Promise<void> {
  const clientSecretEncrypted = encrypt(clientSecret, tokenEncryptionKey());
  await prisma.$transaction([
    prisma.stravaConnection.upsert({
      where: { userId },
      // A new app invalidates tokens issued to the old one.
      update: {
        clientId,
        clientSecretEncrypted,
        stravaAthleteId: null,
        scope: null,
        accessTokenEncrypted: null,
        refreshTokenEncrypted: null,
        expiresAt: null,
      },
      create: { userId, clientId, clientSecretEncrypted },
    }),
    prisma.user.update({ where: { id: userId }, data: { activitySource: "STRAVA" } }),
  ]);
}

export async function getStravaOAuthConfig(userId: string): Promise<StravaOAuthConfig | null> {
  const connection = await prisma.stravaConnection.findUnique({ where: { userId } });
  if (!connection) return null;
  return {
    clientId: connection.clientId,
    clientSecret: decrypt(connection.clientSecretEncrypted, tokenEncryptionKey()),
    callbackUrl: stravaCallbackUrl(),
    oauthBaseUrl: stravaOauthBaseUrl(),
  };
}

export async function storeStravaTokens(userId: string, token: StravaTokenResponse, scope: string): Promise<void> {
  const key = tokenEncryptionKey();
  await prisma.stravaConnection.update({
    where: { userId },
    data: {
      stravaAthleteId: token.athlete?.id ?? null,
      scope,
      accessTokenEncrypted: encrypt(token.accessToken, key),
      refreshTokenEncrypted: encrypt(token.refreshToken, key),
      expiresAt: token.expiresAt,
    },
  });
}
