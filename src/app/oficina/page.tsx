// RF25, RF29, RB21: the workshop owner's area (profile, services, slots, appointments and notices).
import Link from "next/link";
import { Suspense } from "react";
import { requestWorkshop, addWorkshopService, addWorkshopSlot, markNoticesRead, removeWorkshopService, removeWorkshopSlot, updateWorkshopProfile } from "@/app/actions/workshops";
import { Flash, Nav } from "@/components/ui";
import { prisma } from "@/lib/db";
import { getCurrentUser, getCurrentWorkshop } from "@/lib/session";
import { formatSlot } from "@/lib/workshop";
import { connection } from "next/server";

const OK = {
  perfil: "Perfil salvo.",
  servico: "Serviço cadastrado.",
  servico_removido: "Serviço removido dos novos agendamentos.",
  horario: "Horário cadastrado.",
  horario_removido: "Horário removido.",
  concluido: "Serviço concluído e registrado no histórico da bike.",
  pedido: "Pedido enviado. O administrador do GearLog vai analisar.",
};
const ERR = {
  perfil_invalido: "Informe o nome da oficina.",
  servico_invalido: "Informe o nome do serviço.",
  horario_invalido: "Informe um dia e uma hora no futuro.",
  horario_existe: "Esse horário já está cadastrado.",
  horario_ocupado: "Esse horário tem um agendamento ativo e não pode ser removido.",
  atendimento_invalido: "Atendimento não encontrado ou já concluído.",
  pedido_invalido: "Informe o nome (2+ letras), um contato (5+ caracteres) e uma descrição (10+ caracteres).",
  pedido_existe: "Já existe um pedido ou uma oficina com o seu e-mail.",
};

export default function WorkshopPage(props: PageProps<"/oficina">) {
  return (
    <main className="wide">
      <header><h1>Minha oficina</h1></header>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <Area searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Area({ searchParams }: { searchParams: PageProps<"/oficina">["searchParams"] }) {
  const { ok, erro } = await searchParams;
  const owned = await getCurrentWorkshop();
  if (!owned) {
    const user = await getCurrentUser();
    const request = user?.email ? await prisma.workshop.findUnique({ where: { ownerEmail: user.email.toLowerCase() }, select: { status: true, name: true } }) : null;
    return (
      <>
        <Nav isAdmin={user?.role === "ADMIN"} />
        <Flash ok={ok} erro={erro} okText={OK} errText={ERR} />
        {!user && (
          <>
            <p className="alert" role="alert">Entre com o Google para acessar a área da oficina.</p>
            <a className="button" href="/auth/google?next=/oficina">Entrar com Google</a>
          </>
        )}
        {user && request?.status === "PENDING" && <p className="muted">Seu pedido para “{request.name}” está em análise. Avisaremos quando o administrador decidir.</p>}
        {user && (!request || request.status === "REJECTED") && (
          <section className="card">
            <h2>Cadastrar minha oficina</h2>
            {request?.status === "REJECTED" && <p className="alert" role="alert">O pedido anterior foi recusado. Você pode enviar um novo.</p>}
            <p className="muted">Envie o pedido; o administrador confere que a oficina existe e aprova. Quando aprovada, você cadastra serviços e horários aqui.</p>
            <form action={requestWorkshop} className="stack">
              <label>Nome da oficina <input name="name" required minLength={2} maxLength={80} /></label>
              <label>Contato (telefone, e-mail ou Instagram) <input name="contact" required minLength={5} maxLength={120} /></label>
              <label>Conte sobre a oficina <textarea name="requestText" required minLength={10} maxLength={500} rows={4} /></label>
              <button className="button" type="submit">Enviar pedido</button>
            </form>
          </section>
        )}
      </>
    );
  }
  const { user, workshop } = owned;
  await connection();
  const now = new Date();
  const [services, slots, appointments, notices] = await Promise.all([
    prisma.workshopService.findMany({ where: { workshopId: workshop.id, active: true }, orderBy: { name: "asc" } }),
    prisma.workshopSlot.findMany({ where: { workshopId: workshop.id, startsAt: { gt: now } }, include: { appointments: { select: { status: true } } }, orderBy: { startsAt: "asc" } }),
    prisma.appointment.findMany({
      where: { workshopId: workshop.id, status: { not: "CANCELLED" } },
      include: { slot: true, bike: { select: { name: true } }, user: { select: { name: true } }, service: { select: { name: true } } },
    }),
    prisma.workshopNotice.findMany({ where: { workshopId: workshop.id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  appointments.sort((a, b) => a.slot.startsAt.getTime() - b.slot.startsAt.getTime());
  const unread = notices.filter((n) => !n.readAt).length;

  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <Flash ok={ok} erro={erro} okText={OK} errText={ERR} />
      <p className="muted">{workshop.name} · responsável: {user.email}</p>

      <section className="card">
        <h2>Avisos {unread > 0 && <span className="badge">{unread} novos</span>}</h2>
        {notices.length === 0 ? <p className="muted">Nenhum aviso.</p> : (
          <ul>{notices.map((n) => <li key={n.id}>{n.urgent && <span className="badge">Urgente</span>} {n.message} <span className="muted">({formatSlot(n.createdAt)})</span></li>)}</ul>
        )}
        {unread > 0 && <form action={markNoticesRead}><button className="button small" type="submit">Marcar como lidos</button></form>}
      </section>

      <section className="card">
        <h2>Agendamentos</h2>
        {appointments.length === 0 ? <p className="muted">Nenhum agendamento ativo.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Quando</th><th>Atleta</th><th>Bike</th><th>Serviço</th><th>Situação</th><th /></tr></thead>
            <tbody>{appointments.map((a) => (
              <tr key={a.id}>
                <td>{formatSlot(a.slot.startsAt)}</td><td>{a.user.name}</td><td>{a.bike.name}</td><td>{a.service?.name ?? "—"}</td>
                <td>{a.status === "COMPLETED" ? "Concluído" : "Agendado"}</td>
                <td><Link href={`/oficina/atendimentos/${a.id}`}>{a.status === "COMPLETED" ? "Ver" : "Abrir e concluir"}</Link></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>

      <section className="card">
        <h2>Perfil</h2>
        <form action={updateWorkshopProfile}>
          <div className="row">
            <label>Nome <input name="name" required maxLength={80} defaultValue={workshop.name} /></label>
            <label>Telefone <input name="phone" maxLength={30} defaultValue={workshop.phone ?? ""} /></label>
            <label>Endereço <input name="address" maxLength={160} defaultValue={workshop.address ?? ""} /></label>
          </div>
          <label>Descrição <textarea name="description" maxLength={500} defaultValue={workshop.description ?? ""} /></label>
          <button className="button small" type="submit">Salvar perfil</button>
        </form>
      </section>

      <section className="card">
        <h2>Serviços e níveis de revisão</h2>
        {services.map((s) => (
          <div key={s.id} className="row">
            <div><strong>{s.name}</strong>{s.description && <span className="muted"> · {s.description}</span>}
              {s.includes && <ul>{s.includes.split("\n").map((i) => <li key={i}>{i}</li>)}</ul>}</div>
            <form action={removeWorkshopService}><input type="hidden" name="id" value={s.id} /><button className="button small" type="submit">Remover</button></form>
          </div>
        ))}
        <form action={addWorkshopService}>
          <div className="row">
            <label>Nome <input name="name" required maxLength={80} placeholder="Ex.: Revisão completa" /></label>
            <label>Descrição <input name="description" maxLength={300} /></label>
          </div>
          <label>O que inclui (um item por linha) <textarea name="includes" rows={4} placeholder={"Troca de corrente\nRegulagem dos câmbios\nCentragem das rodas"} /></label>
          <button className="button small" type="submit">Adicionar serviço</button>
        </form>
      </section>

      <section className="card">
        <h2>Horários disponíveis</h2>
        <p className="muted">Horário de Brasília. Cada horário recebe um agendamento.</p>
        {slots.length === 0 ? <p className="muted">Nenhum horário futuro cadastrado.</p> : (
          <ul>{slots.map((s) => {
            const taken = s.appointments.some((a) => a.status !== "CANCELLED");
            return (
              <li key={s.id}>{formatSlot(s.startsAt)} {taken ? <span className="badge">Agendado</span> : (
                <form action={removeWorkshopSlot} style={{ display: "inline" }}><input type="hidden" name="id" value={s.id} /><button className="button small" type="submit">Remover</button></form>
              )}</li>
            );
          })}</ul>
        )}
        <form action={addWorkshopSlot} className="row">
          <label>Dia <input name="day" type="date" required /></label>
          <label>Hora <input name="time" type="time" required /></label>
          <button className="button small" type="submit">Adicionar horário</button>
        </form>
      </section>
    </>
  );
}
