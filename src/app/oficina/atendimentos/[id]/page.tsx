// RF27, RF28, RNF03, RB09: the workshop reads the booked bike (read-only) and concludes the service.
import Link from "next/link";
import { Suspense } from "react";
import s from "@/styles/oficinas.module.css";
import { concludeAppointment } from "@/app/actions/workshops";
import { Flash, Nav } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDay, toLocalDay } from "@/lib/dates";
import { getCurrentWorkshop } from "@/lib/session";
import { CONDITION_LABEL, FREE_ROWS, visitRows } from "@/lib/visit";
import { canWorkshopAccessBike, canWorkshopReadHistory, formatSlot } from "@/lib/workshop";
import { connection } from "next/server";

const ERR = {
  visita_vazia: "Informe a data e pelo menos um item do serviço.",
  data: "A data é anterior à instalação de uma peça trocada.",
  plano_invalido: "Esse item não pode ser zerado.",
};

function ConditionSelect({ name }: { name: string }) {
  return (
    <select name={name} defaultValue="">
      <option value="">—</option>
      {Object.entries(CONDITION_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

export default function VisitPage(props: PageProps<"/oficina/atendimentos/[id]">) {
  return (
    <main className={`wide ${s.root}`}>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <Detail {...props} />
      </Suspense>
    </main>
  );
}

async function Detail({ params, searchParams }: PageProps<"/oficina/atendimentos/[id]">) {
  const owned = await getCurrentWorkshop();
  const { id } = await params;
  const { erro } = await searchParams;
  if (!owned) return <p className="alert" role="alert">Acesso restrito à oficina. <Link href="/oficina">Voltar</Link></p>;
  const { workshop } = owned;
  const appt = await prisma.appointment.findFirst({
    where: { id, workshopId: workshop.id },
    include: { slot: true, user: { select: { name: true } }, service: true, bike: true },
  });
  // RNF03, RB09: re-checked on every request, from the appointment itself.
  if (!appt || !canWorkshopAccessBike([appt], workshop.id, appt.bikeId)) {
    return <><Nav /><p className="alert" role="alert">Sem acesso a esta bike: não há agendamento ativo ou concluído com a sua oficina. <Link href="/oficina">Voltar</Link></p></>;
  }
  // RF27, RNF03: the history is read only when the athlete chose to share it at booking.
  const shared = canWorkshopReadHistory([appt], workshop.id, appt.bikeId);
  const [parts, events] = !shared ? [[], []] : await Promise.all([
    prisma.part.findMany({ where: { bikeId: appt.bikeId, removedAt: null }, include: { plans: true, component: { include: { category: true } } }, orderBy: { installedAt: "asc" } }),
    prisma.maintenanceEvent.findMany({ where: { bikeId: appt.bikeId }, include: { visit: { select: { shop: true } } }, orderBy: { date: "desc" }, take: 50 }),
  ]);
  await connection();
  const today = toLocalDay(new Date());
  const rows = visitRows(parts);
  const items = appt.service?.includes ? appt.service.includes.split("\n") : [];
  const open = appt.status === "SCHEDULED";

  return (
    <>
      <Nav />
      <p><Link href="/oficina">← Minha oficina</Link></p>
      <Flash erro={erro} errText={ERR} okText={{}} />
      <section className="card">
        <h1>{appt.bike.name}</h1>
        <p className="muted">
          {[appt.bike.brand, appt.bike.model, appt.bike.year].filter(Boolean).join(" ")} · atleta {appt.user.name} · {formatSlot(appt.slot.startsAt)} · {open ? "Agendado" : "Concluído"}
        </p>
        <p><strong>Serviço:</strong> {appt.service?.name ?? "—"}</p>
        {items.length > 0 && <><p className="muted">O que o serviço inclui:</p><ul>{items.map((i) => <li key={i}>{i}</li>)}</ul></>}
        <p className="muted">
          {shared
            ? "O atleta escolheu compartilhar o histórico desta bike ao agendar. O acesso é somente leitura e termina se o agendamento for cancelado."
            : "O atleta não compartilhou o histórico desta bike: você vê só os dados do agendamento e pode registrar o serviço em itens livres."}
        </p>
      </section>

      <section className="card">
        <h2>Peças instaladas</h2>
        {!shared ? <p className="muted">Histórico não compartilhado.</p> : parts.length === 0 ? <p className="muted">Nenhuma peça cadastrada.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Posição / família</th><th>Componente</th><th>Instalada em</th></tr></thead>
            <tbody>{parts.map((p) => (
              <tr key={p.id}><td>{p.position ?? p.component.category.name}</td><td>{p.component.brand} {p.component.model}</td><td>{formatDay(p.installedAt)}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </section>

      <section className="card">
        <h2>Histórico de manutenção</h2>
        {!shared ? <p className="muted">Histórico não compartilhado.</p> : events.length === 0 ? <p className="muted">Sem registros.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Data</th><th>Registro</th></tr></thead>
            <tbody>{events.map((e) => <tr key={e.id}><td>{formatDay(e.date)}</td><td>{e.note}{e.visit?.shop ? ` · ${e.visit.shop}` : ""}</td></tr>)}</tbody>
          </table></div>
        )}
      </section>

      {open && (
        <section className="card">
          <h2>Concluir serviço</h2>
          <p className="muted">Marque o que foi feito. Itens revisados ou trocados zeram o contador e todos vão para o histórico da bike com o nome da oficina.</p>
          <form action={concludeAppointment}>
            <input type="hidden" name="id" value={appt.id} />
            <div className="row">
              <label>Data <input name="date" type="date" required defaultValue={today} /></label>
              <label>Observação geral <input name="note" maxLength={200} defaultValue={appt.service?.name ?? ""} /></label>
            </div>
            <div className="table-wrap"><table>
              <thead><tr><th>Item</th><th>O que foi feito</th><th>Condição</th><th>Detalhe</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key}>
                    <td>{r.label}</td>
                    <td>
                      <select name={`${r.key}_act`} defaultValue="">
                        <option value="">—</option>
                        <option value="check">Verificado / ajustado</option>
                        {r.canReset && <option value="reset">{r.resetLabel}</option>}
                        <option value="replace">Peça inteira trocada (mesmo modelo)</option>
                      </select>
                    </td>
                    <td><ConditionSelect name={`${r.key}_cond`} /></td>
                    <td><input name={`${r.key}_note`} maxLength={200} /></td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(FREE_ROWS, 0) }, (_, i) => (
                  <tr key={`free_${i}`}>
                    <td><input name={`free_${i}_label`} maxLength={80} defaultValue={items[i] ?? ""} placeholder="Item do serviço" /></td>
                    <td>
                      <select name={`free_${i}_act`} defaultValue="check">
                        <option value="check">Verificado / ajustado</option>
                        <option value="replace">Trocado</option>
                      </select>
                    </td>
                    <td><ConditionSelect name={`free_${i}_cond`} /></td>
                    <td><input name={`free_${i}_note`} maxLength={200} /></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            <button className="button" type="submit">Concluir e registrar no histórico</button>
          </form>
        </section>
      )}
    </>
  );
}
