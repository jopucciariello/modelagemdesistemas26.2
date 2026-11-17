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
      <header className="app-header">
        <div className="brand"><span className="brand-mark" aria-hidden="true">⚙</span>GearLog</div>
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
          <section className="page-title">
            <h1>Olá, {user.name.split(" ")[0]}</h1>
            <p className="muted">Como estão as peças das suas bikes. Fonte dos pedais: <Link href="/fonte">{SOURCE_LABELS[user.activitySource]}</Link>.</p>
          </section>
          <Dashboard userId={user.id} />
          <form action="/auth/logout" method="post">
            <button className="button small" type="submit">Sair</button>
          </form>
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

/** RF15, RF08, RF09: every maintenance plan of every active bike, grouped by bike, most worn first. */
async function Dashboard({ userId }: { userId: string }) {
  const { rows, bikeCount } = await loadDashboard(userId);
  if (bikeCount === 0) {
    return (
      <section className="card empty">
        <span className="big" aria-hidden="true">🚲</span>
        <h2>Nenhuma bike ainda</h2>
        <p className="muted">Cadastre a primeira e depois instale as peças para acompanhar o desgaste.</p>
        <Link className="button" href="/bikes">Cadastrar bike</Link>
      </section>
    );
  }
  if (rows.length === 0) {
    return (
      <section className="card empty">
        <span className="big" aria-hidden="true">🔧</span>
        <h2>Nenhuma peça instalada</h2>
        <p className="muted">Abra uma bike e adicione as peças para ver o desgaste aqui.</p>
        <Link className="button" href="/bikes">Ir para as bikes</Link>
      </section>
    );
  }
  const due = rows.filter((r) => r.wear.status === "due").length;
  const near = rows.filter((r) => r.wear.status === "near").length;
  const ok = rows.length - due - near;
  // Rows arrive most worn first, so bikes are ordered by their worst part.
  const byBike = new Map<string, { id: string; name: string; rows: typeof rows }>();
  for (const r of rows) {
    const group = byBike.get(r.bikeId) ?? { id: r.bikeId, name: r.bikeName, rows: [] };
    group.rows.push(r);
    byBike.set(r.bikeId, group);
  }
  return (
    <>
      <section className="stats" aria-label="Resumo">
        <div className="stat stat-due"><b>{due}</b><span>{due === 1 ? "pede troca/revisão" : "pedem troca/revisão"}</span></div>
        <div className="stat stat-near"><b>{near}</b><span>perto do limite</span></div>
        <div className="stat stat-ok"><b>{ok}</b><span>em dia</span></div>
      </section>
      {[...byBike.values()].map((bike) => {
        const bikeAlerts = bike.rows.filter((r) => r.wear.status !== "ok").length;
        return (
          <section className="bike-card" key={bike.id}>
            <header>
              <h3><Link href={`/bikes/${bike.id}`}>{bike.name}</Link></h3>
              <span className="muted">{bikeAlerts === 0 ? "Tudo em dia" : `${bikeAlerts} ${bikeAlerts === 1 ? "alerta" : "alertas"}`}</span>
            </header>
            <ul className="plan-list">
              {bike.rows.map((r) => (
                <li className={`plan-item s-${r.wear.status}`} key={r.plan.id}>
                  <div>
                    <div className="plan-top">
                      <Link href={`/bikes/${r.bikeId}`}>{r.part.position ?? r.part.component.category.name}</Link>
                      <span className="plan-use">{r.plan.intervalKm ? km(r.wear.km) : null}{r.plan.intervalKm && r.plan.intervalHours ? " · " : null}{r.plan.intervalHours ? hours(r.wear.hours) : null}</span>
                    </div>
                    <div className="plan-sub">{r.plan.name} · {r.part.component.brand} {r.part.component.model}</div>
                    {r.plan.action === "REPLACE" && r.wear.status !== "ok" && (
                      <div className="plan-sub"><Link href={`/mercado?categoria=${r.part.component.categoryId}`}>Ver anúncios compatíveis</Link></div>
                    )}
                  </div>
                  <WearMeter wear={r.wear} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
