// RF34: read-only client for the athlete's strava-connector (/v1/gearlog/*).
// Timeout of 10 s: the connector may wake from suspension. Never log the API key.
export class ConnectorError extends Error {
  constructor(
    message: string,
    readonly code: "unreachable" | "unauthorized" | "bad_response",
  ) {
    super(message);
    this.name = "ConnectorError";
  }
}

export type ConnectorPath =
  | "/v1/gearlog/status"
  | "/v1/gearlog/bikes"
  | `/v1/gearlog/activities?since=${string}`
  | "/v1/gearlog/events";

/** RF06: the connector requires `since`; the epoch brings the whole history (retroactive rides). */
export function connectorActivitiesPath(since: Date = new Date(0)): ConnectorPath {
  return `/v1/gearlog/activities?since=${encodeURIComponent(since.toISOString())}`;
}

export async function connectorGet(
  baseUrl: string,
  apiKey: string,
  path: ConnectorPath,
  fetchFn: typeof fetch = fetch,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchFn(`${baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
    });
  } catch {
    throw new ConnectorError("Connector unreachable.", "unreachable");
  }
  if (response.status === 401 || response.status === 403) {
    throw new ConnectorError("Connector rejected the API key.", "unauthorized");
  }
  if (!response.ok) throw new ConnectorError(`Connector returned HTTP ${response.status}.`, "bad_response");
  try {
    return await response.json();
  } catch {
    throw new ConnectorError("Connector returned invalid JSON.", "bad_response");
  }
}

export const CONNECTOR_BACKFILL_DAYS = 90;

/**
 * RF06, RF34: asks the connector to re-read Strava before GearLog reads it: /admin/sync brings
 * new or renamed bikes, /admin/backfill brings edits of rides older than 7 days. Best effort:
 * never throws (RNF06), returns whether both calls were accepted. The admin key goes only to the
 * connector whose origin is the configured admin origin.
 */
export async function connectorAdminRefresh(
  baseUrl: string,
  admin: { url: string; apiKey: string } | null,
  now: Date = new Date(),
  fetchFn: typeof fetch = fetch,
): Promise<boolean> {
  if (!admin) return false;
  let origin: string;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    return false;
  }
  if (origin !== admin.url) return false;
  const since = new Date(now.getTime() - CONNECTOR_BACKFILL_DAYS * 86_400_000).toISOString();
  const post = async (path: string, body?: unknown) => {
    try {
      const res = await fetchFn(`${origin}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${admin.apiKey}`, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(20_000),
        redirect: "error",
      });
      return res.ok;
    } catch {
      return false;
    }
  };
  const synced = await post("/admin/sync");
  const backfilled = await post("/admin/backfill", { since });
  return synced && backfilled;
}
