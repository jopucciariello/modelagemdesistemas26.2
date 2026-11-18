// RF32, RF34: the athlete picks where their rides come from.
import Link from "next/link";
import { Suspense } from "react";
import { Nav } from "@/components/ui";
import { SettingsTabs } from "@/components/settings-tabs";
import { readConnectorStatus } from "@/lib/connector/save";
import { stravaCentralApp } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";

const MESSAGES: Record<string, string> = {
  strava_app_missing: "A conexão direta com o Strava ainda não está disponível.",
  access_denied: "Você não autorizou o acesso ao Strava.",
  missing_scope: "Marque todas as permissões ao autorizar (perfil, bikes e atividades, inclusive privadas).",
  invalid_state: "A sessão de autorização expirou. Tente de novo.",
  token_exchange_failed: "O Strava recusou a autorização. Tente de novo mais tarde.",
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
  strava: "Strava vinculado.",
  conector: "Conector vinculado.",
  desconectado: "Strava desconectado. Os tokens foram apagados.",
};

export default function SourcePage(props: PageProps<"/fonte">) {
  return (
    <main className="wide">
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
  const central = stravaCentralApp() !== null;
  const label = (s: string) => (user.activitySource === s ? " (em uso)" : "");

  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <SettingsTabs />
      {typeof erro === "string" && <p className="alert" role="alert">{MESSAGES[erro] ?? MESSAGES.unexpected}</p>}
      {typeof ok === "string" && OK[ok] && <p className="muted" role="status">{OK[ok]}</p>}

      <section className="card">
        <h2>Manual{label("MANUAL")}</h2>
        <p className="muted">Você lança cada pedal à mão (bike, data, km e horas).</p>
        <form action="/fonte/manual" method="post">
          <button className="button" type="submit">Usar lançamento manual</button>
        </form>
      </section>

      {central && (
        <section className="card">
          <h2>Strava{label("STRAVA")}</h2>
          <p className="muted">
            Recomendado: autorize o GearLog direto no Strava, sem cadastrar nada.
            {stravaLinked ? " Conta Strava vinculada." : ""} Lemos só data, esporte, distância, tempo em movimento e bike.
            {" "}<Link href="/privacidade">Privacidade</Link>.
          </p>
          <form action="/fonte/strava" method="post">
            <input type="hidden" name="central" value="1" />
            <button className="button button-strava" type="submit">Conectar com o Strava</button>
          </form>
        </section>
      )}

      {user.strava && (
        <form action="/fonte/strava/desconectar" method="post">
          <button className="button small" type="submit">Desconectar o Strava e apagar os tokens</button>
        </form>
      )}

      <section className="card">
        <h2>Strava pelo conector{label("CONNECTOR")}{central ? " — temporário" : ""}</h2>
        <p className="muted">
          Ponte temporária: você informa a URL e a chave de API do seu strava-connector, até o Strava aprovar o app do GearLog.
          {connector?.ok && (connector.data.linked ? " Conectado e com o Strava vinculado no conector." : " Conectado, mas o conector ainda não está vinculado ao Strava.")}
          {connector?.ok && connector.data.lastSyncAt && ` Última sincronização: ${new Date(connector.data.lastSyncAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`}
          {connector?.ok && connector.data.lastError && " O conector registrou um erro na última sincronização."}
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
