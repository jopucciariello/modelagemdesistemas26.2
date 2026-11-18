// RF26, RF27: workshop details and booking (booking authorizes sharing the bike history).
import Link from "next/link";
import { Suspense } from "react";
import s from "@/styles/oficinas.module.css";
import { connection } from "next/server";
import { bookAppointment } from "@/app/actions/workshops";
import { Flash, Nav } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { formatSlot } from "@/lib/workshop";

const ERR = {
  dados_invalidos: "Escolha uma bike, um serviço e um horário.",
  sem_autorizacao: "Para agendar, autorize o compartilhamento do histórico da bike com a oficina.",
  horario_indisponivel: "Esse horário acabou de ser ocupado ou já passou. Escolha outro.",
};

export default function WorkshopPage(props: PageProps<"/oficinas/[id]">) {
  return (
    <main className={`wide ${s.root}`}>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <Detail {...props} />
      </Suspense>
    </main>
  );
}

async function Detail({ params, searchParams }: PageProps<"/oficinas/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const { erro } = await searchParams;
  await connection();
  const workshop = await prisma.workshop.findFirst({
    where: { id, active: true },
    include: {
      services: { where: { active: true }, orderBy: { name: "asc" } },
      slots: { where: { startsAt: { gt: new Date() }, appointments: { none: { status: { not: "CANCELLED" } } } }, orderBy: { startsAt: "asc" }, take: 60 },
    },
  });
  const bikes = await prisma.bike.findMany({ where: { userId: user.id, archivedAt: null }, orderBy: { name: "asc" } });
  if (!workshop) return <><Nav /><p className="alert">Oficina não encontrada. <Link href="/oficinas">Voltar</Link></p></>;
  const canBook = bikes.length > 0 && workshop.services.length > 0 && workshop.slots.length > 0;

  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <p><Link href="/oficinas">← Oficinas</Link></p>
      <Flash erro={erro} errText={ERR} okText={{}} />
      <section className="card">
        <h1>{workshop.name}</h1>
        <p className="muted">{[workshop.address, workshop.phone].filter(Boolean).join(" · ")}</p>
        {workshop.description && <p>{workshop.description}</p>}
      </section>
      <section className="card">
        <h2>Serviços</h2>
        {workshop.services.length === 0 ? <p className="muted">Nenhum serviço cadastrado.</p> : workshop.services.map((s) => (
          <div key={s.id}>
            <strong>{s.name}</strong>{s.description && <span className="muted"> · {s.description}</span>}
            {s.includes && <ul>{s.includes.split("\n").map((i) => <li key={i}>{i}</li>)}</ul>}
          </div>
        ))}
      </section>
      <section className="card">
        <h2>Agendar revisão</h2>
        {bikes.length === 0 && <p className="alert">Cadastre uma bike antes de agendar. <Link href="/configuracoes">Adicionar bike</Link></p>}
        {!canBook ? <p className="muted">Sem horários livres ou serviços no momento.</p> : (
          <form action={bookAppointment}>
            <input type="hidden" name="workshopId" value={workshop.id} />
            <div className="row">
              <label>Bike <select name="bikeId" required>{bikes.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
              <label>Serviço <select name="serviceId" required>{workshop.services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
              <label>Horário <select name="slotId" required>{workshop.slots.map((s) => <option key={s.id} value={s.id}>{formatSlot(s.startsAt)}</option>)}</select></label>
            </div>
            <label>
              <input type="checkbox" name="consent" /> Autorizo a oficina a ver os dados da bike, as peças instaladas e o histórico de manutenção enquanto o agendamento estiver ativo ou concluído.
            </label>
            <button className="button" type="submit">Agendar</button>
          </form>
        )}
      </section>
    </>
  );
}
