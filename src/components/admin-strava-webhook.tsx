// RF06, ADR-011: status of the Strava webhook subscription and the button that creates it.
import { appUrl, stravaCentralApp } from "@/lib/env";

async function subscriptions(app: { clientId: string; clientSecret: string }): Promise<number | null> {
  try {
    const url = new URL("https://www.strava.com/api/v3/push_subscriptions");
    url.searchParams.set("client_id", app.clientId);
    url.searchParams.set("client_secret", app.clientSecret);
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000), cache: "no-store" });
    if (!res.ok) return null;
    const list = (await res.json()) as unknown;
    return Array.isArray(list) ? list.length : null;
  } catch {
    return null;
  }
}

export async function AdminStravaWebhook() {
  const app = stravaCentralApp();
  const count = app ? await subscriptions(app) : null;
  return (
    <section className="card">
      <h2>Strava: avisos em tempo real</h2>
      {!app ? (
        <p className="muted">O app do Strava ainda não está configurado (STRAVA_CLIENT_ID e STRAVA_CLIENT_SECRET).</p>
      ) : (
        <>
          <p className="muted">
            Pedais novos, editados ou apagados no Strava chegam sozinhos em {appUrl()}/api/strava/webhook.{" "}
            {count === null ? "Não consegui consultar o Strava agora." : count > 0 ? "Inscrição ativa." : "Ainda não inscrito."}
          </p>
          {count === 0 && (
            <form action="/admin/strava-webhook" method="post">
              <button className="button" type="submit">Ativar avisos do Strava</button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
