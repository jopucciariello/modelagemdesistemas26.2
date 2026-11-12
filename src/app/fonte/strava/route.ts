// RF33: save the athlete's own Strava app, then send them to authorize it.
import { NextResponse, type NextRequest } from "next/server";
import { appUrl } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";
import { saveStravaApp } from "@/lib/strava/link-account";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/", appUrl()), 303);
  const form = await request.formData();
  const clientId = String(form.get("clientId") ?? "").trim();
  const clientSecret = String(form.get("clientSecret") ?? "").trim();
  if (!/^\d{1,10}$/.test(clientId) || !/^[A-Za-z0-9]{20,64}$/.test(clientSecret)) {
    return NextResponse.redirect(new URL("/fonte?erro=invalid_strava_app", appUrl()), 303);
  }
  await saveStravaApp(user.id, clientId, clientSecret);
  return NextResponse.redirect(new URL("/auth/strava", appUrl()), 303);
}
