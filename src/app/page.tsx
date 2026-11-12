import { Suspense } from "react";
import Link from "next/link";
import { Nav, WearMeter, hours, km } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";
import { loadDashboard } from "@/lib/tracker";

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
    <main className="wide">
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
        <>
          <Nav isAdmin={user.role === "ADMIN"} />
          <section className="card">
            <p>
              Olá, <strong>{user.name}</strong>. Perfil: {user.role === "ADMIN" ? "Administrador" : "Atleta"}. Fonte dos pedais:{" "}
              <Link href="/fonte">{SOURCE_LABELS[user.activitySource]}</Link>.
            </p>
            <form action="/auth/logout" method="post">
              <button className="button small" type="submit">Sair</button>
            </form>
          </section>
          <Dashboard userId={user.id} />
        </>
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

/** RF15, RF08, RF09: every maintenance plan of every active bike, most worn first. */
async function Dashboard({ userId }: { userId: string }) {
  const { rows, bikeCount } = await loadDashboard(userId);
  const alerts = rows.filter((r) => r.wear.status !== "ok").length;
  return (
    <section className="card">
      <h2>Painel de desgaste</h2>
      {bikeCount === 0 ? (
        <p>Você ainda não tem bikes. <Link href="/bikes">Cadastre a primeira</Link> e depois instale as peças.</p>
      ) : rows.length === 0 ? (
        <p>Nenhuma peça instalada ainda. Abra uma bike em <Link href="/bikes">Bikes</Link> e adicione as peças.</p>
      ) : (
        <>
          <p className="muted">{alerts === 0 ? "Nenhum alerta: tudo abaixo de 80%." : `${alerts} ${alerts === 1 ? "plano pede" : "planos pedem"} atenção.`}</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Peça</th><th>Plano</th><th>Uso</th><th>Desgaste</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.plan.id}>
                    <td>
                      <Link href={`/bikes/${r.bikeId}`}>{r.part.component.category.name}</Link>
                      <br /><span className="muted">{r.bikeName} · {r.part.component.brand} {r.part.component.model}</span>
                    </td>
                    <td>{r.plan.name}</td>
                    <td>{r.plan.intervalKm ? km(r.wear.km) : null}{r.plan.intervalKm && r.plan.intervalHours ? " · " : null}{r.plan.intervalHours ? hours(r.wear.hours) : null}</td>
                    <td><WearMeter wear={r.wear} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
