// ADR-004: keep everything on the custom domain; *.fly.dev redirects to APP_URL.
import { NextResponse, type NextRequest } from "next/server";
import { canonicalRedirect } from "@/lib/canonical-host";

export function proxy(request: NextRequest) {
  const target = canonicalRedirect(request.url, request.headers.get("host"), process.env.APP_URL);
  return target ? NextResponse.redirect(target, 308) : NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
