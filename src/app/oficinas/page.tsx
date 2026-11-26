// RF26: workshops the athlete can book.
import Link from "next/link";
import { Suspense } from "react";
import s from "@/styles/oficinas.module.css";
import { connection } from "next/server";
import { Flash, Nav } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guards";

export default function WorkshopsPage(props: PageProps<"/oficinas">) {
  return (
    <main className={`wide ${s.root}`}>
      <header><h1>Oficinas</h1></header>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <List searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function List({ searchParams }: { searchParams: PageProps<"/oficinas">["searchParams"] }) {
  const user = await requireUser();
  const { erro } = await searchParams;
  await connection();
  const workshops = await prisma.workshop.findMany({
    where: { active: true },
    include: { _count: { select: { services: { where: { active: true } } } } },
    orderBy: { name: "asc" },
  });
  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <Flash erro={erro} errText={{ oficina_invalida: "Oficina ou horário não encontrado." }} okText={{}} />
      <p className={s.links}><Link href="/agendamentos">Meus agendamentos</Link><Link href="/oficina">Sou responsável por uma oficina</Link></p>
      {workshops.length === 0 ? <p className="muted">Nenhuma oficina cadastrada ainda.</p> : (
        <ul className={s.rows}>{workshops.map((w) => (
          <li key={w.id}>
            <Link className={s.row} href={`/oficinas/${w.id}`}>
              <span>
                <span className={s.rowTitle}>{w.name}</span>
                <span className={s.rowMeta}>{[w.address, w.phone].filter(Boolean).join(" · ")}</span>
                {w.description && <span className={s.rowMeta}>{w.description}</span>}
                <span className={s.rowStats}>{w._count.services} serviço(s) · atende seg–sáb, 8h–19h</span>
              </span>
              <span className={s.arrow} aria-hidden>→</span>
            </Link>
          </li>
        ))}</ul>
      )}
    </>
  );
}
