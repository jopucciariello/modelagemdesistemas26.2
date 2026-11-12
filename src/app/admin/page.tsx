// RF30 entry point: admin area, reachable only by allow-listed Google accounts (ADR-002, RB17).
import { Suspense } from "react";
import { getCurrentAdmin, getCurrentUser } from "@/lib/session";

const ERROR_MESSAGES: Record<string, string> = {
  not_authorized: "Este e-mail não está na lista de administradores autorizados.",
  email_not_verified: "O e-mail da conta Google não está verificado.",
  access_denied: "O login com o Google foi cancelado.",
  invalid_state: "A sessão de login expirou. Tente de novo.",
  token_exchange_failed: "O Google recusou o login. Tente de novo.",
  invalid_id_token: "Não foi possível validar o login do Google. Tente de novo.",
  unexpected: "Não foi possível concluir o login. Tente de novo.",
};

export default function AdminPage(props: PageProps<"/admin">) {
  return (
    <main>
      <header>
        <h1>GearLog · Administração</h1>
        <p className="muted">Catálogo de categorias e componentes (RF30).</p>
      </header>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <AdminArea searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function AdminArea({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  const { erro } = await searchParams;
  const errorCode = typeof erro === "string" ? erro : undefined;
  const admin = await getCurrentAdmin();
  const user = admin ?? (await getCurrentUser());

  return (
    <>
      {errorCode && (
        <p className="alert" role="alert">
          {ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.unexpected}
        </p>
      )}

      {admin ? (
        <section className="card">
          <p>
            Olá, <strong>{admin.name}</strong> ({admin.email}).
          </p>
          <p className="muted">O cadastro do catálogo (RF30) chega na próxima entrega.</p>
          <form action="/auth/logout?next=/admin" method="post">
            <button className="button" type="submit">
              Sair
            </button>
          </form>
        </section>
      ) : (
        <section className="card">
          {user && (
            <p className="alert" role="alert">
              Sua sessão atual não tem acesso à administração.
            </p>
          )}
          <p>Entre com uma conta Google autorizada para administrar o catálogo.</p>
          <a className="button" href="/auth/google">
            Entrar com Google
          </a>
        </section>
      )}
    </>
  );
}
