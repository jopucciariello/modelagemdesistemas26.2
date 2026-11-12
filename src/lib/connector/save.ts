// RF34, RNF01: validate the connector, then store its API key encrypted and pick it as the source.
import "server-only";
import { prisma } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto";
import { tokenEncryptionKey } from "@/lib/env";
import { connectorGet } from "@/lib/connector/client";
import { validateConnectorUrl } from "@/lib/connector/url";

export async function saveConnector(userId: string, rawUrl: string, apiKey: string): Promise<void> {
  const baseUrl = await validateConnectorUrl(rawUrl);
  await connectorGet(baseUrl, apiKey, "/v1/gearlog/status"); // throws if unreachable or unauthorized
  const apiKeyEncrypted = encrypt(apiKey, tokenEncryptionKey());
  await prisma.$transaction([
    prisma.connectorConnection.upsert({
      where: { userId },
      update: { baseUrl, apiKeyEncrypted },
      create: { userId, baseUrl, apiKeyEncrypted },
    }),
    prisma.user.update({ where: { id: userId }, data: { activitySource: "CONNECTOR" } }),
  ]);
}

/** Reads the connector status live. Returns null when no connector is saved. */
export async function readConnectorStatus(userId: string): Promise<{ ok: true; data: unknown } | { ok: false; code: string } | null> {
  const connection = await prisma.connectorConnection.findUnique({ where: { userId } });
  if (!connection) return null;
  try {
    const data = await connectorGet(connection.baseUrl, decrypt(connection.apiKeyEncrypted, tokenEncryptionKey()), "/v1/gearlog/status");
    return { ok: true, data };
  } catch (error) {
    return { ok: false, code: error instanceof Error && "code" in error ? String((error as { code: unknown }).code) : "unexpected" };
  }
}
