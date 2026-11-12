// RF34, ADR-006: the connector URL comes from the user, so it must not reach internal networks (SSRF).
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class ConnectorUrlError extends Error {
  constructor(
    message: string,
    readonly code: "invalid_url" | "not_https" | "private_address",
  ) {
    super(message);
    this.name = "ConnectorUrlError";
  }
}

/** True for loopback, private, link-local, unspecified and unique-local addresses (IPv4 and IPv6). */
export function isPrivateAddress(address: string): boolean {
  const v4 = address.match(/^(?:::ffff:)?(\d+)\.(\d+)\.(\d+)\.(\d+)$/i);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return (
      a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
    );
  }
  const v6 = address.toLowerCase();
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

type Resolver = (host: string) => Promise<string[]>;
const defaultResolver: Resolver = async (host) => (await lookup(host, { all: true })).map((r) => r.address);

/** Returns the normalized base URL (no trailing slash) or throws ConnectorUrlError. */
export async function validateConnectorUrl(raw: string, resolve: Resolver = defaultResolver): Promise<string> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new ConnectorUrlError("Invalid URL.", "invalid_url");
  }
  if (url.protocol !== "https:") throw new ConnectorUrlError("Connector URL must use https.", "not_https");
  if (url.username || url.password) throw new ConnectorUrlError("Credentials in the URL are not allowed.", "invalid_url");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new ConnectorUrlError("Private host.", "private_address");
  }
  const addresses = isIP(host) ? [host] : await resolve(host).catch(() => []);
  if (addresses.length === 0) throw new ConnectorUrlError("Host does not resolve.", "invalid_url");
  if (addresses.some(isPrivateAddress)) throw new ConnectorUrlError("Private address.", "private_address");
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}
