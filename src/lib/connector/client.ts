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

export const CONNECTOR_SYNC_SINCE_DAYS = 90;

/** RF06, RF34: outcome of asking the connector to re-read Strava (POST /v1/gearlog/sync). */
export type ConnectorSyncRequest =
  | { status: "queued" }
  | { status: "rate_limited"; retryAfterSeconds: number | null }
  | { status: "not_linked" }
  | { status: "failed" };

/**
 * RF06, RF34: asks the connector to re-read Strava (new or renamed bikes, edits of old rides).
 * Uses the athlete's own GearLog API key, never an admin key. 202 queued; 429 limit of one call per
 * hour (never retried here, the caller shows retryAfterSeconds); 409 account not linked. The
 * result arrives later through /v1/gearlog/events. Best effort: never throws (RNF06).
 */
export async function connectorRequestSync(
  baseUrl: string,
  apiKey: string,
  now: Date = new Date(),
  fetchFn: typeof fetch = fetch,
): Promise<ConnectorSyncRequest> {
  const since = new Date(now.getTime() - CONNECTOR_SYNC_SINCE_DAYS * 86_400_000).toISOString();
  let response: Response;
  try {
    response = await fetchFn(`${baseUrl}/v1/gearlog/sync`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ since }),
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
    });
  } catch {
    return { status: "failed" };
  }
  if (response.status === 202) return { status: "queued" };
  if (response.status === 409) return { status: "not_linked" };
  if (response.status === 429) {
    let seconds: number | null = null;
    try {
      const body = (await response.json()) as { retryAfterSeconds?: unknown };
      if (typeof body.retryAfterSeconds === "number" && body.retryAfterSeconds >= 0) seconds = Math.ceil(body.retryAfterSeconds);
    } catch {
      /* body is optional */
    }
    if (seconds === null) {
      const header = Number(response.headers.get("Retry-After"));
      if (Number.isFinite(header) && header >= 0) seconds = Math.ceil(header);
    }
    return { status: "rate_limited", retryAfterSeconds: seconds };
  }
  return { status: "failed" };
}
