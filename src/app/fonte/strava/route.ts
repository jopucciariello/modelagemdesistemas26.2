// RF04, ADR-006: link the GearLog central Strava app (hidden until STRAVA_CLIENT_ID/SECRET exist).
import { NextResponse, type NextRequest } from "next/server";
import { appUrl, stravaCentralApp } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";
import { saveStravaApp } from "@/lib/strava/link-account";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/", appUrl()), 303);
  const form = await request.formData();
  // RF04: default path, the GearLog central app; the athlete types no credentials.
  if (form.get("central") === "1") {
    const central = stravaCentralApp();
    if (!central) return NextResponse.redirect(new URL("/fonte?erro=strava_app_missing", appUrl()), 303);
    await saveStravaApp(user.id, central.clientId, central.clientSecret);
    return NextResponse.redirect(new URL("/auth/strava", appUrl()), 303);
  }
  // RF33 (per-athlete Strava app) was removed on 17/11/2026: only the central app is accepted.
  return NextResponse.redirect(new URL("/fonte?erro=strava_app_missing", appUrl()), 303);
}
