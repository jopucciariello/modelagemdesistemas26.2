// RF32-RF34: the athlete picks where their rides come from.
import Link from "next/link";
import { Suspense } from "react";
import { readConnectorStatus } from "@/lib/connector/save";
import { getCurrentUser } from "@/lib/session";

const MESSAGES: Record<string, string> = {
  strava_app_missing: "Cadastre primeiro o Client ID e o Client Secret do seu app do Strava.",
  invalid_strava_app: "Client ID (só números) ou Client Secret inválido. Confira no Strava.",
  access_denied: "Você não autorizou o acesso ao Strava.",
  missing_scope: "Marque todas as permissões ao autorizar (perfil, bikes e atividades, inclusive privadas).",
  invalid_state: "A sessão de autorização expirou. Tente de novo.",
  token_exchange_failed: "O Strava recusou o app. Confira o Client ID, o Client Secret e o Authorization Callback Domain.",
  invalid_connector: "Informe a URL e a chave de API do conector.",
  connector_invalid_url: "URL inválida ou que não resolve.",
  connector_not_https: "A URL do conector precisa começar com https://.",
  connector_private_address: "Essa URL aponta para um endereço interno e não é aceita.",
  connector_unreachable: "Não consegui falar com o conector (ele pode estar acordando; tente de novo).",
  connector_unauthorized: "O conector recusou a chave de API.",
  connector_bad_response: "O conector respondeu algo inesperado.",
  unexpected: "Algo deu errado. Tente de novo.",
};
const OK: Record<string, string> = {
  manual: "Fonte alterada para lançamento manual.",
  strava: "Strava vinculado com o seu app.",
  conector: "Conector vinculado.",
};

export default function SourcePage(props: PageProps<"/fonte">) {
  return (
    <main>
      <header>
        <h1>Fonte dos pedais</h1>
        <p className="muted">Escolha de onde vêm os km e as horas de uso (RF32). Você pode trocar quando quiser.</p>
      </header>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <SourceArea searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function SourceArea({ searchParams }: { searchParams: PageProps<"/fonte">["searchParams"] }) {
  const { erro, ok } = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    return (
      <section className="card">
        <p>Entre com o Google para escolher a fonte dos seus pedais.</p>
        <a className="button" href="/auth/google?next=/fonte">Entrar com Google</a>
      </section>
    );
  }
  const connector = await readConnectorStatus(user.id);
  const stravaLinked = Boolean(user.strava?.accessTokenEncrypted);
  const label = (s: string) => (user.activitySource === s ? " (em uso)" : "");

  return (
    <>
      {typeof erro === "string" && <p className="alert" role="alert">{MESSAGES[erro] ?? MESSAGES.unexpected}</p>}
      {typeof ok === "string" && OK[ok] && <p className="muted" role="status">{OK[ok]}</p>}

      <section className="card">
        <h2>Manual{label("MANUAL")}</h2>
        <p className="muted">Você lança cada pedal à mão (bike, data, km e horas).</p>
        <form action="/fonte/manual" method="post">
          <button className="button" type="submit">Usar lançamento manual</button>
        </form>
      </section>

      <section className="card">
        <h2>API do Strava{label("STRAVA")}</h2>
        <p className="muted">
          Você usa o seu próprio app do Strava. <a href="/tutorial-strava">Veja o passo a passo para cadastrá-lo</a>.
          {stravaLinked ? " Conta Strava vinculada." : user.strava ? " App salvo; falta autorizar no Strava." : ""}
        </p>
        <form action="/fonte/strava" method="post">
          <label>Client ID <input name="clientId" inputMode="numeric" autoComplete="off" required /></label>
          <label>Client Secret <input name="clientSecret" type="password" autoComplete="off" required placeholder={user.strava ? "já configurado (cole de novo para trocar)" : ""} /></label>
          <button className="button button-strava" type="submit">Salvar e conectar com o Strava</button>
        </form>
      </section>

      <section className="card">
        <h2>Conector{label("CONNECTOR")}</h2>
        <p className="muted">
          Você informa a URL e a chave de API do seu strava-connector.
          {connector?.ok && " Conectado."}
          {connector && !connector.ok && " O conector não respondeu agora; os dados anteriores continuam salvos."}
        </p>
        <form action="/fonte/conector" method="post">
          <label>URL do conector <input name="url" type="url" placeholder="https://strava.exemplo.com" autoComplete="off" required /></label>
          <label>Chave de API <input name="apiKey" type="password" autoComplete="off" required placeholder={user.connector ? "já configurada (cole de novo para trocar)" : ""} /></label>
          <button className="button" type="submit">Validar e usar o conector</button>
        </form>
      </section>

      <p><Link href="/">Voltar</Link></p>
    </>
  );
}
