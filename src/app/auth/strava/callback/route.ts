// RF33: Strava redirects here after the athlete authorizes (or denies) access to their own app.
import { NextResponse, type NextRequest } from "next/server";
import { appUrl } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";
import { getStravaOAuthConfig, storeStravaTokens } from "@/lib/strava/link-account";
import { exchangeCode, StravaOAuthError, validateCallback } from "@/lib/strava/oauth";

const STATE_COOKIE = "gearlog_oauth_state";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const target = new URL("/fonte", appUrl());
  try {
    const user = await getCurrentUser();
    if (!user) throw new StravaOAuthError("No session.", "invalid_state");
    const code = validateCallback(
      {
        code: params.get("code"),
        scope: params.get("scope"),
        state: params.get("state"),
        error: params.get("error"),
      },
      request.cookies.get(STATE_COOKIE)?.value,
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
