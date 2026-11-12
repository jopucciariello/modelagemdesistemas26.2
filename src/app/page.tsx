import { Suspense } from "react";
import { getCurrentUser } from "@/lib/session";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Você não autorizou o acesso ao Strava.",
  missing_scope:
    "O GearLog precisa ler seu perfil, suas bikes e suas atividades (inclusive as privadas). Marque todas as permissões ao autorizar.",
  invalid_state: "A sessão de login expirou. Tente de novo.",
  token_exchange_failed: "O Strava recusou a conexão. Tente de novo em alguns minutos.",
  unexpected: "Não foi possível concluir o login. Tente de novo.",
};

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
            {user.strava ? "Conta Strava vinculada." : "Strava não vinculado."} Perfil:{" "}
            {user.role === "ADMIN" ? "Administrador" : "Atleta"}.
          </p>
          <form action="/auth/logout" method="post">
            <button className="button" type="submit">
              Sair
            </button>
          </form>
        </section>
      ) : (
        <section className="card">
          <p>Entre com sua conta Strava para importar km e horas de uso das suas bikes.</p>
          <a className="button button-strava" href="/auth/strava">
            Conectar com o Strava
          </a>
        </section>
      )}
    </>
  );
}
