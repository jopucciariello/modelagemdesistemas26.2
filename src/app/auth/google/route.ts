// ADR-002: start the Google login for admins.
import { NextResponse } from "next/server";
import { randomToken } from "@/lib/crypto";
import { googleConfig } from "@/lib/env";
import { buildGoogleAuthorizeUrl } from "@/lib/google/oidc";

export async function GET() {
  const flow = { state: randomToken(16), nonce: randomToken(16), codeVerifier: randomToken(32) };
  const response = NextResponse.redirect(buildGoogleAuthorizeUrl(googleConfig(), flow));
  response.cookies.set("gearlog_google_flow", JSON.stringify(flow), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/auth/google",
    maxAge: 600,
  });
  return response;
}
