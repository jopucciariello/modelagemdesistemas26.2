// RF04: start the Strava OAuth flow.
import { NextResponse } from "next/server";
import { randomToken } from "@/lib/crypto";
import { stravaConfig } from "@/lib/env";
import { buildAuthorizeUrl } from "@/lib/strava/oauth";

export const STATE_COOKIE = "gearlog_oauth_state";

export async function GET() {
  const state = randomToken(16);
  const response = NextResponse.redirect(buildAuthorizeUrl(stravaConfig(), state));
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/auth/strava",
    maxAge: 600,
  });
  return response;
}
