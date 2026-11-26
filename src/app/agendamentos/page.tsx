// RF26, RF29: the athlete's appointments and cancellation.
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { cancelAppointment } from "@/app/actions/workshops";
import { Flash, Nav } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { formatSlot, isLateCancellation, LATE_CANCEL_HOURS } from "@/lib/workshop";

const OK = { agendado: "Revisão agendada. A oficina já pode ver o histórico da bike.", cancelado: "Agendamento cancelado. A oficina foi avisada." };
const ERR = { nao_cancelavel: "Esse agendamento não pode mais ser cancelado." };
const STATUS = { SCHEDULED: "Agendado", COMPLETED: "Concluído", CANCELLED: "Cancelado" } as const;

export default function AppointmentsPage(props: PageProps<"/agendamentos">) {
  return (
    <main>
      <header><h1>Meus agendamentos</h1></header>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <List searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function List({ searchParams }: { searchParams: PageProps<"/agendamentos">["searchParams"] }) {
  const user = await requireUser();
  const { ok, erro } = await searchParams;
  await connection();
  const now = new Date();
  const appts = await prisma.appointment.findMany({
    where: { userId: user.id },
    include: { slot: true, workshop: { select: { name: true } }, bike: { select: { id: true, name: true } }, service: { select: { name: true } } },
  });
  appts.sort((a, b) => b.slot.startsAt.getTime() - a.slot.startsAt.getTime());
  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <Flash ok={ok} erro={erro} okText={OK} errText={ERR} />
      <p><Link href="/oficinas">Agendar em uma oficina</Link></p>
      {appts.length === 0 ? <p className="muted">Nenhum agendamento.</p> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Quando</th><th>Oficina</th><th>Bike</th><th>Serviço</th><th>Situação</th><th /></tr></thead>
          <tbody>{appts.map((a) => (
            <tr key={a.id}>
              <td>{formatSlot(a.slot.startsAt)}</td><td>{a.workshop.name}</td>
              <td><Link href={`/bikes/${a.bike.id}`}>{a.bike.name}</Link></td><td>{a.service?.name ?? "—"}</td><td>{STATUS[a.status]}</td>
              <td>{a.status === "SCHEDULED" && (
                <form action={cancelAppointment}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="button small" type="submit">Cancelar</button>
                  {isLateCancellation(a.slot.startsAt, now) && <span className="muted"> menos de {LATE_CANCEL_HOURS} h: a oficina será avisada com urgência</span>}
                </form>
              )}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
