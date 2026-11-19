// RF30 entry point: admin area, reachable only by allow-listed Google accounts (ADR-005, RB17).
import { Suspense } from "react";
import "@/app/portfolio.css";
import { AdminEmails } from "@/components/admin-emails";
import { AdminCatalog } from "@/components/admin-catalog";
import { AdminMarket } from "@/components/admin-market";
import { AdminRequests } from "@/components/admin-requests";
import { AdminWorkshops } from "@/components/admin-workshops";
import { Flash, Nav } from "@/components/ui";
import { getCurrentAdmin, getCurrentUser } from "@/lib/session";

const OK: Record<string, string> = {
  catalogo_padrao: "Catálogo da planilha carregado.",
  categoria: "Categoria salva.",
  plano: "Planos da categoria atualizados.",
  componente: "Componentes atualizados.",
  lojista: "Lojista cadastrado.",
  pedido_aprovado: "Pedido de lojista aprovado.",
  pedido_recusado: "Pedido de lojista recusado.",
  selo_concedido: "Selo de lojista verificado concedido.",
  selo_revogado: "Selo de lojista verificado revogado.",
  anuncio_removido: "Anúncio removido.",
  pedido_respondido: "Resposta ao pedido salva.",
  oficina: "Oficinas atualizadas.",
  admin_incluido: "Administrador incluído.",
  admin_removido: "Administrador removido.",
};

const ERROR_MESSAGES: Record<string, string> = {
  categoria_invalida: "Informe o nome da família.",
  categoria_existe: "Já existe uma categoria com esse nome.",
  plano_invalido: "O plano precisa de nome e de um intervalo em km ou em horas.",
  componente_invalido: "Informe a marca e o modelo.",
  oficina_invalida: "Informe o nome da oficina e um e-mail válido.",
  admin_invalido: "Informe um e-mail válido.",
  admin_raiz: "Esse administrador vem do Infisical (ADMIN_EMAILS) e não pode ser removido aqui.",
  admin_proprio: "Você não pode remover o próprio acesso.",
  oficina_existe: "Já existe uma oficina com esse e-mail.",
  componente_existe: "Esse componente já está no catálogo.",
  lojista_invalido: "Informe um e-mail válido e o nome da loja.",
  lojista_sem_usuario: "Não há usuário com esse e-mail. Peça à pessoa para entrar uma vez com o Google.",
  lojista_existe: "Esse usuário já é lojista.",
  pedido_nao_encontrado: "Pedido não encontrado ou já decidido.",
  lojista_nao_encontrado: "Lojista não encontrado.",
  motivo_obrigatorio: "Informe o motivo da remoção (mínimo de 5 caracteres).",
  anuncio_invalido: "Anúncio não encontrado.",
  resposta_invalida: "Para recusar um pedido, escreva o motivo.",
  pedido_inexistente: "Pedido não encontrado.",
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
    <main className="wide pf">
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
  const { erro, ok } = await searchParams;
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
      {admin && <Flash ok={ok} okText={OK} errText={{}} />}

      {admin ? (
        <>
          <Nav isAdmin />
          <section className="card">
            <p>
              Olá, <strong>{admin.name}</strong> ({admin.email}).
            </p>
            <form action="/auth/logout?next=/admin" method="post">
              <button className="button small" type="submit">
                Sair
              </button>
            </form>
          </section>
          <AdminEmails />
          <AdminCatalog />
          <AdminMarket />
          <AdminRequests />
          <AdminWorkshops />
        </>
      ) : (
        <section className="card">
          {user && (
            <p className="alert" role="alert">
              Sua sessão atual não tem acesso à administração.
            </p>
          )}
          <p>Entre com uma conta Google autorizada para administrar o catálogo.</p>
          <a className="button" href="/auth/google?next=/admin">
            Entrar com Google
          </a>
        </section>
      )}
    </>
  );
}
