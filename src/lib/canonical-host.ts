// ADR-004: the app is served only on its own domain (APP_URL). Requests that reach the
// default *.fly.dev hostname are permanently redirected there.

/** Returns the URL to redirect to, or null when the request is already on an allowed host. */
export function canonicalRedirect(requestUrl: string, host: string | null, appUrl: string | undefined): string | null {
  if (!appUrl || !host) return null;
  const hostname = host.split(":")[0].toLowerCase();
  if (!hostname.endsWith(".fly.dev")) return null;
  const target = new URL(appUrl);
  if (target.hostname.toLowerCase() === hostname) return null;
  const current = new URL(requestUrl);
  return new URL(current.pathname + current.search, target).toString();
}
