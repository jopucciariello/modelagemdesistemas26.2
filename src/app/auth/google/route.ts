// ADR-005: start the Google login (every profile uses it). `?next=` picks where to land afterwards.
import { NextResponse, type NextRequest } from "next/server";
import { randomToken } from "@/lib/crypto";
import { googleConfig } from "@/lib/env";
import { buildGoogleAuthorizeUrl } from "@/lib/google/oidc";
import { safeReturnPath } from "@/lib/redirects";

export async function GET(request: NextRequest) {
  const next = safeReturnPath(request.nextUrl.searchParams.get("next"));
  const flow = { state: randomToken(16), nonce: randomToken(16), codeVerifier: randomToken(32), next };
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
