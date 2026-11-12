// RF34, RNF01: validate the connector, then store its API key encrypted and pick it as the source.
import "server-only";
import { prisma } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto";
import { tokenEncryptionKey } from "@/lib/env";
import { ConnectorError, connectorGet } from "@/lib/connector/client";
import { parseConnectorStatus, type ConnectorStatus } from "@/lib/connector/types";
import { validateConnectorUrl } from "@/lib/connector/url";

export async function saveConnector(userId: string, rawUrl: string, apiKey: string): Promise<void> {
  const baseUrl = await validateConnectorUrl(rawUrl);
  // Throws if unreachable or unauthorized; a body that is not a status means this is not a connector.
  const status = parseConnectorStatus(await connectorGet(baseUrl, apiKey, "/v1/gearlog/status"));
  if (!status) throw new ConnectorError("Not a strava-connector status.", "bad_response");
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
export async function readConnectorStatus(userId: string): Promise<{ ok: true; data: ConnectorStatus } | { ok: false; code: string } | null> {
  const connection = await prisma.connectorConnection.findUnique({ where: { userId } });
  if (!connection) return null;
  try {
    const raw = await connectorGet(connection.baseUrl, decrypt(connection.apiKeyEncrypted, tokenEncryptionKey()), "/v1/gearlog/status");
    const data = parseConnectorStatus(raw);
    return data ? { ok: true, data } : { ok: false, code: "bad_response" };
  } catch (error) {
    return { ok: false, code: error instanceof Error && "code" in error ? String((error as { code: unknown }).code) : "unexpected" };
  }
}
