// RF13 for the Expo app: manual sync with the athlete's source; the old data stays if it fails.
import { getApiUser, unauthorized } from "@/lib/api-auth";
import { SyncError, syncRides } from "@/lib/rides/sync";

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  try {
    const { imported, refresh } = await syncRides(user.id);
    return Response.json({ ok: true, imported, refresh });
  } catch (e) {
    const code = e instanceof SyncError ? e.code : "unexpected";
    return Response.json({ error: `sync_${code}` }, { status: code === "not_linked" ? 400 : 502 });
  }
}
