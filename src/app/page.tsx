import { Suspense } from "react";
import { getCurrentUser } from "@/lib/session";

const ERROR_MESSAGES: Record<string, string> = {
  email_not_verified: "O e-mail da conta Google não está verificado.",
  access_denied: "O login com o Google foi cancelado.",
  invalid_state: "A sessão de login expirou. Tente de novo.",
  token_exchange_failed: "O Google recusou o login. Tente de novo.",
  invalid_id_token: "Não foi possível validar o login do Google. Tente de novo.",
  unexpected: "Não foi possível concluir o login. Tente de novo.",
};

const SOURCE_LABELS = { MANUAL: "lançamento manual", STRAVA: "API do Strava", CONNECTOR: "conector" } as const;

export default function Home(props: PageProps<"/">) {
  return (
    <main>
      <header>
        <h1>GearLog</h1>
        <p className="muted">Desgaste e manutenção preventiva das peças da sua bike.</p>
      </header>
      {/* The session is read at request time, so it streams in behind Suspense. */}
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <SessionArea searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function SessionArea({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const { erro } = await searchParams;
  const errorCode = typeof erro === "string" ? erro : undefined;
  const user = await getCurrentUser();

  return (
    <>
      {errorCode && (
        <p className="alert" role="alert">
          {ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.unexpected}
        </p>
      )}

      {user ? (
        <section className="card">
          <p>
            Olá, <strong>{user.name}</strong>.
          </p>
          <p className="muted">
            Perfil: {user.role === "ADMIN" ? "Administrador" : "Atleta"}. Fonte dos pedais:{" "}
            <strong>{SOURCE_LABELS[user.activitySource]}</strong>.
          </p>
          <p>
            <a className="button" href="/fonte">Escolher a fonte dos pedais</a>
          </p>
          <form action="/auth/logout" method="post">
            <button className="button" type="submit">
              Sair
            </button>
          </form>
        </section>
      ) : (
        <section className="card">
          <p>Entre com sua conta Google. Depois você escolhe como lançar os pedais: à mão, pela API do Strava ou por um conector.</p>
          <a className="button" href="/auth/google">
            Entrar com Google
          </a>
        </section>
      )}
    </>
  );
}
