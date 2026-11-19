// RNF01, RF32: disconnect Strava. Revokes access at Strava (best effort) and deletes the stored tokens.
import "server-only";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { stravaOauthBaseUrl, tokenEncryptionKey } from "@/lib/env";

export async function disconnectStrava(userId: string): Promise<void> {
  const connection = await prisma.stravaConnection.findUnique({ where: { userId } });
  if (connection?.accessTokenEncrypted) {
    try {
      const accessToken = decrypt(connection.accessTokenEncrypted, tokenEncryptionKey());
      await fetch(`${stravaOauthBaseUrl()}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ access_token: accessToken }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      // The tokens are deleted below either way; the athlete can also revoke at strava.com/settings/apps.
    }
  }
  await prisma.$transaction([
    prisma.stravaConnection.deleteMany({ where: { userId } }),
    prisma.user.update({ where: { id: userId }, data: { activitySource: "MANUAL" } }),
  ]);
}
