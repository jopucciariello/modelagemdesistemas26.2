import { NextResponse } from "next/server";
import { appUrl } from "@/lib/env";
import { destroySession } from "@/lib/session";

export async function POST(request: Request) {
  await destroySession();
  // Admins go back to /admin; everyone else to the home page.
  const next = new URL(request.url).searchParams.get("next") === "/admin" ? "/admin" : "/";
  return NextResponse.redirect(new URL(next, appUrl()), { status: 303 });
}
