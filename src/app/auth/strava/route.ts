// RF33: start the Strava OAuth flow with the logged-in athlete's own app.
import { NextResponse } from "next/server";
import { appUrl } from "@/lib/env";
import { randomToken } from "@/lib/crypto";
import { getCurrentUser } from "@/lib/session";
import { getStravaOAuthConfig } from "@/lib/strava/link-account";
import { buildAuthorizeUrl } from "@/lib/strava/oauth";

export const STATE_COOKIE = "gearlog_oauth_state";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/", appUrl()));
  const config = await getStravaOAuthConfig(user.id);
  if (!config) return NextResponse.redirect(new URL("/fonte?erro=strava_app_missing", appUrl()));

  const state = randomToken(16);
  const response = NextResponse.redirect(buildAuthorizeUrl(config, state));
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/auth/strava",
    maxAge: 600,
  });
  return response;
}
