// RNF01, RF32: disconnect Strava. Revokes access at Strava (best effort) and deletes the stored tokens.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { appUrl, stravaOauthBaseUrl, tokenEncryptionKey } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/", appUrl()), 303);
  const connection = await prisma.stravaConnection.findUnique({ where: { userId: user.id } });
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
    prisma.stravaConnection.deleteMany({ where: { userId: user.id } }),
    prisma.user.update({ where: { id: user.id }, data: { activitySource: "MANUAL" } }),
  ]);
  return NextResponse.redirect(new URL("/fonte?ok=desconectado", appUrl()), 303);
}
