// RF34: save and validate the athlete's connector (URL + API key).
import { NextResponse, type NextRequest } from "next/server";
import { ConnectorError } from "@/lib/connector/client";
import { saveConnector } from "@/lib/connector/save";
import { ConnectorUrlError } from "@/lib/connector/url";
import { appUrl } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/", appUrl()), 303);
  const form = await request.formData();
  const url = String(form.get("url") ?? "");
  const apiKey = String(form.get("apiKey") ?? "").trim();
  const target = new URL("/fonte", appUrl());
  if (!apiKey || apiKey.length > 512 || url.length > 300) {
    target.searchParams.set("erro", "invalid_connector");
    return NextResponse.redirect(target, 303);
  }
  try {
    await saveConnector(user.id, url, apiKey);
    target.searchParams.set("ok", "conector");
  } catch (error) {
    const reason =
      error instanceof ConnectorUrlError || error instanceof ConnectorError ? error.code : "unexpected";
    console.error(`[connector] save failed: ${reason}`); // reason code only, never the key
    target.searchParams.set("erro", `connector_${reason}`);
  }
  return NextResponse.redirect(target, 303);
}
