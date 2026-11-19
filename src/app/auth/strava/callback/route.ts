// RF04, ADR-006: Strava redirects here after the athlete authorizes (or denies) access.
import { NextResponse, type NextRequest } from "next/server";
import { appUrl, tokenEncryptionKey } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";
import { getStravaOAuthConfig, storeStravaTokens } from "@/lib/strava/link-account";
import { verifyAppState } from "@/lib/strava/app-state";
import { exchangeCode, StravaOAuthError, validateCallback } from "@/lib/strava/oauth";

const STATE_COOKIE = "gearlog_oauth_state";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  // Issue #62: a signed `app.` state means the flow started in the Expo app (no cookie session here).
  const appState = verifyAppState(params.get("state"), tokenEncryptionKey());
  const target = appState ? new URL(appState.redirect) : new URL("/fonte", appUrl());
  try {
    const user = appState ? { id: appState.userId } : await getCurrentUser();
    if (!user) throw new StravaOAuthError("No session.", "invalid_state");
    const code = validateCallback(
      {
        code: params.get("code"),
        scope: params.get("scope"),
        state: params.get("state"),
        error: params.get("error"),
      },
      appState ? (params.get("state") ?? undefined) : request.cookies.get(STATE_COOKIE)?.value,
    );
    const config = await getStravaOAuthConfig(user.id);
    if (!config) throw new StravaOAuthError("No Strava app saved.", "invalid_state");
    const token = await exchangeCode(config, code);
    await storeStravaTokens(user.id, token, params.get("scope") ?? "");
    target.searchParams.set("ok", "strava");
  } catch (error) {
    const reason = error instanceof StravaOAuthError ? error.code : "unexpected";
    // Log only the reason code, never tokens or the authorization code.
    console.error(`[strava-oauth] link failed: ${reason}`);
    target.searchParams.set("erro", reason);
  }
  const response = NextResponse.redirect(target);
  response.cookies.delete({ name: STATE_COOKIE, path: "/auth/strava" });
  return response;
}
