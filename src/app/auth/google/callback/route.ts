// ADR-005, RB17: Google redirects here; any verified e-mail becomes an athlete, allow-listed ones admins.
import { NextResponse, type NextRequest } from "next/server";
import { appUrl, googleConfig } from "@/lib/env";
import { linkGoogleAccount } from "@/lib/google/link-user";
import {
  exchangeGoogleCode,
  GoogleLoginError,
  validateGoogleCallback,
  verifyIdTokenClaims,
} from "@/lib/google/oidc";
import { safeReturnPath } from "@/lib/redirects";
import { createSession, createSessionToken } from "@/lib/session";

const FLOW_COOKIE = "gearlog_google_flow";

function readFlow(raw: string | undefined): { state?: string; nonce?: string; codeVerifier?: string; next?: string; app?: string | null } {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const flow = readFlow(request.cookies.get(FLOW_COOKIE)?.value);
  const target = new URL(safeReturnPath(flow.next), appUrl());
  try {
    const code = validateGoogleCallback(
      { code: params.get("code"), state: params.get("state"), error: params.get("error") },
      flow.state,
    );
    const config = googleConfig();
    const idToken = await exchangeGoogleCode(config, code, flow.codeVerifier ?? "");
    const identity = verifyIdTokenClaims(idToken, { clientId: config.clientId, nonce: flow.nonce ?? "" });
    const userId = await linkGoogleAccount(identity);
    if (flow.app) {
      // Expo app: hand the session token to its deep link (never to the cookie jar).
      const { token } = await createSessionToken(userId);
      const appTarget = new URL(flow.app);
      appTarget.searchParams.set("token", token);
      const done = NextResponse.redirect(appTarget);
      done.cookies.delete({ name: FLOW_COOKIE, path: "/auth/google" });
      return done;
    }
    await createSession(userId);
  } catch (error) {
    const reason = error instanceof GoogleLoginError ? error.code : "unexpected";
    // Log only the reason code: never tokens, codes or e-mails.
    console.error(`[google-login] login failed: ${reason}`);
    if (flow.app) {
      const failed = new URL(flow.app);
      failed.searchParams.set("erro", reason);
      return NextResponse.redirect(failed);
    }
    target.searchParams.set("erro", reason);
  }
  const response = NextResponse.redirect(target);
  response.cookies.delete({ name: FLOW_COOKIE, path: "/auth/google" });
  return response;
}
