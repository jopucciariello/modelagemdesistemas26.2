// RF26, RF27: workshop details and booking (booking authorizes sharing the bike history).
import Link from "next/link";
import { Suspense } from "react";
import s from "@/styles/oficinas.module.css";
import { connection } from "next/server";
import { bookOnGrid } from "@/app/actions/workshops";
import { Flash, Nav } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { freeStarts } from "@/lib/workshop-agenda";
import { formatSlot } from "@/lib/workshop";

const ERR = {
  dados_invalidos: "Escolha uma bike, um serviço e um horário.",
  sem_autorizacao: "Para agendar, autorize o compartilhamento do histórico da bike com a oficina.",
  horario_indisponivel: "Esse horário acabou de ser ocupado ou já passou. Escolha outro.",
};

export default function WorkshopPage(props: PageProps<"/oficinas/[id]">) {
  return (
    <main className={`${s.root}`}>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <Detail {...props} />
      </Suspense>
    </main>
  );
}

async function Detail({ params, searchParams }: PageProps<"/oficinas/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const { erro, servico } = await searchParams;
  await connection();
  const workshop = await prisma.workshop.findFirst({
    where: { id, active: true },
    include: {
      services: { where: { active: true }, orderBy: { name: "asc" } },
    },
  });
  const bikes = await prisma.bike.findMany({ where: { userId: user.id, archivedAt: null }, orderBy: { name: "asc" } });
  if (!workshop) return <><Nav /><p className="alert">Oficina não encontrada. <Link href="/oficinas">Voltar</Link></p></>;
  // RF26: the athlete picks the service first; the free starts depend on its duration.
  const chosen = workshop.services.find((x) => x.id === (typeof servico === "string" ? servico : "")) ?? null;
  const starts = chosen ? await freeStarts(workshop.id, chosen.id) : [];
  const endOf = (d: Date, min: number) => new Date(d.getTime() + min * 60_000);
  const hhmm = (d: Date) => d.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

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
        {workshop.services.length === 0 ? <p className="muted">Nenhum serviço disponível no momento.</p> : (
          <form method="get">
            <div className="row">
              <label>Serviço <select name="servico" defaultValue={chosen?.id ?? ""} required>
                <option value="" disabled>Escolha</option>
                {workshop.services.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.durationMin / 60} h)</option>)}
              </select></label>
              <button className="button small" type="submit">Ver horários</button>
            </div>
          </form>
        )}
        {chosen && (starts.length === 0 || bikes.length === 0 ? <p className="muted">{bikes.length === 0 ? "Cadastre uma bike para agendar." : "Sem horários livres para esse serviço nos próximos dias."}</p> : (
          <form action={bookOnGrid} className="stack">
            <input type="hidden" name="workshopId" value={workshop.id} />
            <input type="hidden" name="serviceId" value={chosen.id} />
            <div className="row">
              <label>Bike <select name="bikeId" required>{bikes.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
              <label>Horário <select name="startsAt" required>{starts.map((d) => <option key={d.getTime()} value={d.toISOString()}>{formatSlot(d)} às {hhmm(endOf(d, chosen.durationMin))}</option>)}</select></label>
            </div>
            <label className="check">
              <input type="checkbox" name="shareHistory" /> Compartilhar com a oficina os dados da bike, as peças instaladas e o histórico de manutenção enquanto o agendamento estiver ativo ou concluído (opcional).
            </label>
            <button className="button" type="submit">Agendar</button>
          </form>
        ))}
      </section>
    </>
  );
}
