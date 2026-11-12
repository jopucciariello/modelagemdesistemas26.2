// RF32, RF14: the athlete chooses to log rides by hand.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/", appUrl()), 303);
  await prisma.user.update({ where: { id: user.id }, data: { activitySource: "MANUAL" } });
  return NextResponse.redirect(new URL("/fonte?ok=manual", appUrl()), 303);
}
