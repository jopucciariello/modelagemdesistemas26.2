// RNF01, RF32: disconnect Strava from the site.
import { NextResponse } from "next/server";
import { appUrl } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";
import { disconnectStrava } from "@/lib/strava/disconnect";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/", appUrl()), 303);
  await disconnectStrava(user.id);
  return NextResponse.redirect(new URL("/fonte?ok=desconectado", appUrl()), 303);
}
