// RF01: the athlete's bikes.
import Link from "next/link";
import { Suspense } from "react";
import { createBike } from "@/app/actions/bikes";
import { BikeFields } from "@/components/bike-fields";
import { Flash, Nav } from "@/components/ui";
import { prisma } from "@/lib/db";
import { BIKE_TYPES } from "@/lib/forms";
import { requireUser } from "@/lib/guards";

const OK = { arquivada: "Bike arquivada. O histórico continua guardado." };
const ERR = { bike_invalida: "Informe o nome e o tipo da bike.", bike_nao_encontrada: "Bike não encontrada.", peca_nao_encontrada: "Peça não encontrada." };

export default function BikesPage(props: PageProps<"/bikes">) {
  return (
    <main className="wide">
      <header><h1>Bikes</h1></header>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <Bikes searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Bikes({ searchParams }: { searchParams: PageProps<"/bikes">["searchParams"] }) {
  const user = await requireUser();
  const { ok, erro } = await searchParams;
  const bikes = await prisma.bike.findMany({
    where: { userId: user.id },
    include: { _count: { select: { parts: { where: { removedAt: null } } } } },
    orderBy: [{ archivedAt: "asc" }, { createdAt: "asc" }],
  });
  const active = bikes.filter((b) => !b.archivedAt);
  const archived = bikes.filter((b) => b.archivedAt);
  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <Flash ok={ok} erro={erro} okText={OK} errText={ERR} />
      <section className="card">
        <h2>Suas bikes</h2>
        {active.length === 0 ? <p className="muted">Nenhuma bike ainda.</p> : (
          <ul className="list">
            {active.map((b) => (
              <li key={b.id}>
                <Link href={`/bikes/${b.id}`}><strong>{b.name}</strong></Link>
                <span className="muted">{BIKE_TYPES[b.type]}{b.brand ? ` · ${b.brand}` : ""}{b.model ? ` ${b.model}` : ""}{b.year ? ` · ${b.year}` : ""} · {b._count.parts} {b._count.parts === 1 ? "peça" : "peças"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="card">
        <h2>Nova bike</h2>
        <form action={createBike} className="row">
          <BikeFields />
          <button className="button" type="submit">Cadastrar</button>
        </form>
      </section>
      {archived.length > 0 && (
        <section className="card">
          <h2>Arquivadas</h2>
          <ul className="list">
            {archived.map((b) => <li key={b.id}><Link href={`/bikes/${b.id}`}>{b.name}</Link></li>)}
          </ul>
        </section>
      )}
    </>
  );
}
