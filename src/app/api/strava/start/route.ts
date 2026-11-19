// RF04, issue #62: starts the Strava OAuth for the app. Returns the authorize URL to open in the browser.
import { getApiUser, unauthorized } from "@/lib/api-auth";
import { appUrl, stravaCentralApp, tokenEncryptionKey } from "@/lib/env";
import { safeAppRedirect } from "@/lib/redirects";
import { saveStravaApp, getStravaOAuthConfig } from "@/lib/strava/link-account";
import { signAppState } from "@/lib/strava/app-state";
import { buildAuthorizeUrl } from "@/lib/strava/oauth";

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  const body = (await request.json().catch(() => null)) as { redirect?: unknown } | null;
  const redirect = safeAppRedirect(typeof body?.redirect === "string" ? body.redirect : null, appUrl());
  if (!redirect) return Response.json({ error: "Destino inválido.", code: "invalid_redirect" }, { status: 400 });
  const central = stravaCentralApp();
  if (!central) {
    return Response.json({ error: "A conexão direta com o Strava ainda não está disponível.", code: "strava_app_missing" }, { status: 503 });
  }
  await saveStravaApp(user.id, central.clientId, central.clientSecret);
  const config = await getStravaOAuthConfig(user.id);
  if (!config) return Response.json({ error: "Falha ao preparar a conexão.", code: "unexpected" }, { status: 500 });
  const state = signAppState({ userId: user.id, redirect }, tokenEncryptionKey());
  return Response.json({ url: buildAuthorizeUrl(config, state) });
}
