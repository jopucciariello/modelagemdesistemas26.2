// RF04: Strava redirects here after the athlete authorizes (or denies) access.
import { NextResponse, type NextRequest } from "next/server";
import { appUrl, stravaConfig } from "@/lib/env";
import { createSession } from "@/lib/session";
import { linkStravaAccount } from "@/lib/strava/link-account";
import { exchangeCode, StravaOAuthError, validateCallback } from "@/lib/strava/oauth";

const STATE_COOKIE = "gearlog_oauth_state";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const home = new URL("/", appUrl());
  try {
    const code = validateCallback(
      {
        code: params.get("code"),
        scope: params.get("scope"),
        state: params.get("state"),
        error: params.get("error"),
      },
      request.cookies.get(STATE_COOKIE)?.value,
    );
    const token = await exchangeCode(stravaConfig(), code);
    const userId = await linkStravaAccount(token, params.get("scope") ?? "");
    await createSession(userId);
  } catch (error) {
    const reason = error instanceof StravaOAuthError ? error.code : "unexpected";
    // Log only the reason code, never tokens or the authorization code.
    console.error(`[strava-oauth] login failed: ${reason}`);
    home.searchParams.set("erro", reason);
  }
  const response = NextResponse.redirect(home);
  response.cookies.delete({ name: STATE_COOKIE, path: "/auth/strava" });
  return response;
}
