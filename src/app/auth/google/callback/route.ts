// ADR-002, RB17: Google redirects here; only allow-listed e-mails get an admin session.
import { NextResponse, type NextRequest } from "next/server";
import { appUrl, googleConfig } from "@/lib/env";
import { linkAdminAccount } from "@/lib/google/link-admin";
import {
  exchangeGoogleCode,
  GoogleLoginError,
  validateGoogleCallback,
  verifyIdTokenClaims,
} from "@/lib/google/oidc";
import { createSession } from "@/lib/session";

const FLOW_COOKIE = "gearlog_google_flow";

function readFlow(raw: string | undefined): { state?: string; nonce?: string; codeVerifier?: string } {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const flow = readFlow(request.cookies.get(FLOW_COOKIE)?.value);
  const target = new URL("/admin", appUrl());
  try {
    const code = validateGoogleCallback(
      { code: params.get("code"), state: params.get("state"), error: params.get("error") },
      flow.state,
    );
    const config = googleConfig();
    const idToken = await exchangeGoogleCode(config, code, flow.codeVerifier ?? "");
    const identity = verifyIdTokenClaims(idToken, { clientId: config.clientId, nonce: flow.nonce ?? "" });
    const userId = await linkAdminAccount(identity);
    await createSession(userId);
  } catch (error) {
    const reason = error instanceof GoogleLoginError ? error.code : "unexpected";
    // Log only the reason code: never tokens, codes or e-mails.
    console.error(`[google-login] admin login failed: ${reason}`);
    target.searchParams.set("erro", reason);
  }
  const response = NextResponse.redirect(target);
  response.cookies.delete({ name: FLOW_COOKIE, path: "/auth/google" });
  return response;
}
