import { Anton, Inter } from "next/font/google";
import { BrandGear } from "./brand-gear";
import s from "./home.module.css";
import { BikeAvatar } from "@/components/bike-avatar";
import { Suspense } from "react";
import Link from "next/link";
import { Nav, WearMeter, hours, km } from "@/components/ui";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { loadDashboard } from "@/lib/tracker";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const ERROR_MESSAGES: Record<string, string> = {
  email_not_verified: "O e-mail da conta Google não está verificado.",
  access_denied: "O login com o Google foi cancelado.",
  invalid_state: "A sessão de login expirou. Tente de novo.",
  token_exchange_failed: "O Google recusou o login. Tente de novo.",
  invalid_id_token: "Não foi possível validar o login do Google. Tente de novo.",
  unexpected: "Não foi possível concluir o login. Tente de novo.",
  bike_nao_encontrada: "Bike não encontrada.",
  peca_nao_encontrada: "Peça não encontrada.",
};

const BIKE_OK: Record<string, string> = { aposentada: "Bike aposentada. O histórico continua guardado.", excluida: "Bike excluída." };
const SOURCE_LABELS = { MANUAL: "lançamento manual", STRAVA: "API do Strava", CONNECTOR: "conector" } as const;

export default function Home(props: PageProps<"/">) {
  return (
    <main className={`wide ${s.pf} ${anton.variable} ${inter.variable}`}>
      <header className="app-header">
        <div className="brand"><BrandGear size={32} />GearLog</div>
      </header>
      {/* The session is read at request time, so it streams in behind Suspense. */}
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <SessionArea searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function SessionArea({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const { erro, ok } = await searchParams;
  const errorCode = typeof erro === "string" ? erro : undefined;
  const user = await getCurrentUser();

  return (
    <>
      {errorCode && (
        <p className="alert" role="alert">
          {ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.unexpected}
        </p>
      )}
      {user && typeof ok === "string" && BIKE_OK[ok] && <p className="ok" role="status">{BIKE_OK[ok]}</p>}

      {user ? (
        <>
          <Nav isAdmin={user.role === "ADMIN"} />
          <section className="page-title">
            <h1>Olá, {user.name.split(" ")[0]}</h1>
            <p className="muted">Como estão as peças das suas bikes. Fonte dos pedais: <Link href="/fonte">{SOURCE_LABELS[user.activitySource]}</Link>.</p>
          </section>
          <Dashboard userId={user.id} />
          <RetiredBikes userId={user.id} />
          <form action="/auth/logout" method="post">
            <button className="button small" type="submit">Sair</button>
          </form>
        </>
      ) : (
        <section className="card">
          <p>Entre com sua conta Google. Depois você escolhe como lançar os pedais: à mão, pelo Strava.</p>
          <a className="button" href="/auth/google">
            Entrar com Google
          </a>
          {" "}
          <a className="button" href="/entrar">
            Usuário e senha
          </a>
        </section>
      )}
    </>
  );
}

/**
 * RF15, RF08, RF09: one expandable card per active bike (picture and name), each holding the
 * maintenance plans of its parts, most worn first. The athlete opens the bike they want to see.
 */
async function Dashboard({ userId }: { userId: string }) {
  const { rows, bikeCount, bikes } = await loadDashboard(userId);
  if (bikeCount === 0) {
    return (
      <section className="card empty">
        <span className="big" aria-hidden="true">🚲</span>
        <h2>Nenhuma bike ainda</h2>
        <p className="muted">Cadastre a primeira e depois instale as peças para acompanhar o desgaste.</p>
        <Link className="button" href="/configuracoes#nova-bike">Cadastrar bike</Link>
      </section>
    );
  }
  const due = rows.filter((r) => r.wear.status === "due").length;
  const near = rows.filter((r) => r.wear.status === "near").length;
  const ok = rows.length - due - near;
  const rowsByBike = new Map<string, typeof rows>();
  for (const r of rows) rowsByBike.set(r.bikeId, [...(rowsByBike.get(r.bikeId) ?? []), r]);
  // Bikes with the most alerts come first; bikes without parts still appear.
  const cards = bikes
    .map((bike) => {
      const bikeRows = rowsByBike.get(bike.id) ?? [];
      return { bike, rows: bikeRows, alerts: bikeRows.filter((r) => r.wear.status !== "ok").length, due: bikeRows.filter((r) => r.wear.status === "due").length };
    })
    .sort((a, b) => b.due - a.due || b.alerts - a.alerts);
  return (
    <>
      <section className="stats" aria-label="Resumo">
        <div className="stat stat-due"><b>{due}</b><span>{due === 1 ? "pede troca/revisão" : "pedem troca/revisão"}</span></div>
        <div className="stat stat-near"><b>{near}</b><span>perto do limite</span></div>
        <div className="stat stat-ok"><b>{ok}</b><span>em dia</span></div>
      </section>
      {cards.map(({ bike, rows: bikeRows, alerts, due: bikeDue }) => (
        <details className="bike-card" key={bike.id}>
          <summary className="bike-summary">
            <BikeAvatar bikeId={bike.id} hasPhoto={bike.photoVersion !== null} version={bike.photoVersion ?? 0} />
            <span className="bike-summary-text">
              <strong>{bike.name}</strong>
              <span className="muted">
                {bikeRows.length === 0 ? "Sem peças instaladas" : alerts === 0 ? "Tudo em dia" : `${alerts} ${alerts === 1 ? "alerta" : "alertas"}`}
              </span>
            </span>
            {bikeRows.length > 0 && <span className={`dot ${bikeDue > 0 ? "dot-due" : alerts > 0 ? "dot-near" : "dot-ok"}`} aria-hidden="true" />}
          </summary>
          {bikeRows.length === 0 ? (
            <p className="muted bike-empty">Abra a bike para adicionar as peças e acompanhar o desgaste. <Link href={`/bikes/${bike.id}`}>Abrir bike</Link></p>
          ) : (
            <>
              <ul className="plan-list">
                {bikeRows.map((r) => (
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
              <p className="bike-open"><Link href={`/bikes/${bike.id}`}>Abrir bike</Link></p>
            </>
          )}
        </details>
      ))}
    </>
  );
}

/** RF01: retired bikes stay reachable (history kept) and can be brought back. */
async function RetiredBikes({ userId }: { userId: string }) {
  const retired = await prisma.bike.findMany({ where: { userId, archivedAt: { not: null } }, orderBy: { archivedAt: "desc" }, select: { id: true, name: true } });
  return (
    <>
      <p className="bike-open"><Link className="button small" href="/configuracoes#nova-bike">+ Adicionar bike</Link></p>
      {retired.length > 0 && (
        <details className="card">
          <summary>Bikes aposentadas ({retired.length})</summary>
          <ul className="list">
            {retired.map((b) => <li key={b.id}><Link href={`/bikes/${b.id}`}>{b.name}</Link></li>)}
          </ul>
        </details>
      )}
    </>
  );
}
