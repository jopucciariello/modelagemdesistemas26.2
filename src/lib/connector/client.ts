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

export async function connectorGet(
  baseUrl: string,
  apiKey: string,
  path: "/v1/gearlog/status" | "/v1/gearlog/bikes" | "/v1/gearlog/activities",
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
