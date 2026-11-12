// RF01, RF02, RF05, RF07-RF12, RB13, RB16: one bike with its parts, wear and history.
import Link from "next/link";
import { Suspense } from "react";
import { addManualMaintenance, linkSourceBike, replacePart, servicePlan, toggleArchiveBike, updateBike, updatePlan } from "@/app/actions/bikes";
import { BikeFields } from "@/components/bike-fields";
import { Flash, Nav, WearMeter, hours, interval, km } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDay, toLocalDay } from "@/lib/dates";
import { BIKE_TYPES } from "@/lib/forms";
import { requireUser } from "@/lib/guards";
import { canResetPlan, componentLabel } from "@/lib/catalog/rules";
import { listSourceBikes } from "@/lib/rides/sync";
import { loadBikeDetail } from "@/lib/tracker";

const OK: Record<string, string> = {
  bike: "Bike salva.",
  bike_modelo: "Bike criada com as peças de fábrica. Confira as datas e os planos.",
  troca_item: "Troca registrada: o contador desse item recomeçou.",
  desarquivada: "Bike reativada.",
  associada: "Associação com a fonte salva.",
  peca: "Peça instalada.",
  plano: "Plano atualizado.",
  revisao: "Revisão registrada: o contador desse plano recomeçou.",
  troca: "Troca registrada: a peça antiga foi para o histórico e a nova começou do zero.",
  manutencao: "Manutenção registrada no histórico.",
};
const ERR: Record<string, string> = {
  bike_invalida: "Informe o nome e o tipo da bike.",
  gear_em_uso: "Essa bike da fonte já está associada a outra bike sua.",
  plano_invalido: "O plano precisa de um intervalo em km ou em horas.",
  data: "Data inválida (não pode ser antes da instalação da peça).",
  componente: "Escolha um componente do catálogo.",
  peca_encerrada: "Essa peça já foi trocada.",
  manutencao_invalida: "Informe a data e o que foi feito.",
};
const EVENT_LABEL = { REPLACEMENT: "Troca", SERVICE: "Revisão", MANUAL: "Manutenção" } as const;

export default function BikePage(props: PageProps<"/bikes/[id]">) {
  return (
    <main className="wide">
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <Bike {...props} />
      </Suspense>
    </main>
  );
}

async function Bike({ params, searchParams }: PageProps<"/bikes/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const { ok, erro } = await searchParams;
  const detail = await loadBikeDetail(user.id, id);
  if (!detail) {
    return (<><Nav isAdmin={user.role === "ADMIN"} /><p className="alert">Bike não encontrada. <Link href="/bikes">Voltar</Link></p></>);
  }
  const { bike, parts, removed, events, totals, rideCount } = detail;
  const categoryIds = [...new Set(parts.map((p) => p.component.categoryId))];
  const [components, categories, sourceBikes] = await Promise.all([
    prisma.component.findMany({ where: { categoryId: { in: categoryIds }, active: true }, orderBy: [{ code: "asc" }, { brand: "asc" }] }),
    prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    listSourceBikes(user.id, user.activitySource),
  ]);
  const today = toLocalDay(new Date());

  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <header>
        <h1>{bike.name}</h1>
        <p className="muted">
          {BIKE_TYPES[bike.type]}{bike.brand ? ` · ${bike.brand}` : ""}{bike.model ? ` ${bike.model}` : ""}{bike.year ? ` · ${bike.year}` : ""} · {rideCount} pedais, {km(totals.km)}, {hours(totals.hours)}
          {bike.archivedAt && " · arquivada"}
        </p>
      </header>
      <Flash ok={ok} erro={erro} okText={OK} errText={ERR} />

      <section className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2>Peças instaladas</h2>
          {!bike.archivedAt && (
            <form action={`/bikes/${bike.id}/peca`} className="row">
              <label>Categoria
                <select name="categoria" required>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <button className="button small" type="submit" disabled={categories.length === 0}>Adicionar peça</button>
            </form>
          )}
        </div>
        {categories.length === 0 && <p className="muted">O catálogo ainda está vazio. Peça ao administrador para carregá-lo.</p>}
        {parts.length === 0 ? <p className="muted">Nenhuma peça instalada.</p> : (
          <ul className="list">
            {parts.map((part) => (
              <li key={part.id}>
                <div>
                  <strong>{part.position ?? part.component.category.name}</strong> · {componentLabel(part.component)}
                  <br /><span className="muted">Instalada em {formatDay(part.installedAt)}{part.initialKm || part.initialHours ? ` com uso inicial de ${km(part.initialKm)} e ${hours(part.initialHours)}` : ""}</span>
                </div>
                {part.planViews.length === 0 && <p className="muted">Sem desgaste regular (sem plano de manutenção).</p>}
                {part.planViews.map((plan) => (
                  <div key={plan.id} className="row">
                    <span>{plan.name}: {interval(plan)} · usou {plan.intervalKm ? km(plan.wear.km) : ""}{plan.intervalKm && plan.intervalHours ? " e " : ""}{plan.intervalHours ? hours(plan.wear.hours) : ""}{plan.lastServiceAt ? ` desde ${formatDay(plan.lastServiceAt)}` : ""}</span>
                    <WearMeter wear={plan.wear} />
                    <details>
                      <summary className="muted">ações</summary>
                      {canResetPlan(plan.action, part.planViews.length) && (
                        <form action={servicePlan} className="row">
                          <input type="hidden" name="planId" value={plan.id} />
                          <label>Data <input name="date" type="date" required defaultValue={today} /></label>
                          <button className="button small" type="submit">{plan.action === "SERVICE" ? "Registrar revisão" : `Registrar troca: ${plan.name}`}</button>
                        </form>
                      )}
                      <form action={updatePlan} className="row">
                        <input type="hidden" name="planId" value={plan.id} />
                        <label>Intervalo km <input name="intervalKm" type="number" min={0} step="any" defaultValue={plan.intervalKm ?? ""} /></label>
                        <label>Intervalo horas <input name="intervalHours" type="number" min={0} step="any" defaultValue={plan.intervalHours ?? ""} /></label>
                        <button className="button small" type="submit">Salvar intervalo</button>
                      </form>
                    </details>
                  </div>
                ))}
                <details>
                  <summary>Trocar a peça inteira</summary>
                  <form action={replacePart} className="row">
                    <input type="hidden" name="partId" value={part.id} />
                    <label>Data <input name="date" type="date" required defaultValue={today} /></label>
                    <label>Nova peça
                      <select name="componentId" defaultValue={part.componentId}>
                        {!components.some((c) => c.id === part.componentId) && <option value={part.componentId}>{part.component.brand} {part.component.model}</option>}
                        {components.filter((c) => c.categoryId === part.component.categoryId).map((c) => <option key={c.id} value={c.id}>{componentLabel(c)}</option>)}
                      </select>
                    </label>
                    <label>Observação <input name="note" maxLength={200} /></label>
                    <button className="button small" type="submit">Trocar peça</button>
                  </form>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Manutenção sem troca</h2>
        <form action={addManualMaintenance} className="row">
          <input type="hidden" name="bikeId" value={bike.id} />
          <label>Data <input name="date" type="date" required defaultValue={today} /></label>
          <label>Peça
            <select name="partId" defaultValue="">
              <option value="">(a bike toda)</option>
              {parts.map((p) => <option key={p.id} value={p.id}>{p.position ?? p.component.category.name}</option>)}
            </select>
          </label>
          <label>O que foi feito <input name="note" required maxLength={200} placeholder="Ex.: lubrificação da corrente" /></label>
          <button className="button small" type="submit">Registrar</button>
        </form>
      </section>

      <section className="card">
        <h2>Histórico de manutenção</h2>
        {events.length === 0 ? <p className="muted">Nada registrado ainda.</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th></tr></thead>
              <tbody>
                {events.map((e) => <tr key={e.id}><td>{formatDay(e.date)}</td><td>{EVENT_LABEL[e.type]}</td><td>{e.note}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
        {removed.length > 0 && (
          <details>
            <summary>Peças trocadas ({removed.length})</summary>
            <ul className="list">
              {removed.map((p) => (
                <li key={p.id}>{p.position ?? p.component.category.name} · {componentLabel(p.component)} <span className="muted">({formatDay(p.installedAt)} a {formatDay(p.removedAt!)})</span></li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {sourceBikes && (
        <section className="card">
          <h2>Bike na fonte dos pedais</h2>
          <p className="muted">Associe esta bike à bike do Strava ou do conector para os pedais importados contarem aqui (RF05).</p>
          <form action={linkSourceBike} className="row">
            <input type="hidden" name="bikeId" value={bike.id} />
            <label>Bike da fonte
              <select name="stravaGearId" defaultValue={bike.stravaGearId ?? ""}>
                <option value="">(nenhuma)</option>
                {sourceBikes.map((s) => <option key={s.stravaGearId} value={s.stravaGearId}>{s.name}</option>)}
              </select>
            </label>
            <button className="button small" type="submit">Salvar associação</button>
          </form>
        </section>
      )}

      <section className="card">
        <details>
          <summary>Editar bike</summary>
          <form action={updateBike} className="row">
            <input type="hidden" name="bikeId" value={bike.id} />
            <BikeFields bike={bike} />
            <button className="button small" type="submit">Salvar</button>
          </form>
        </details>
        <form action={toggleArchiveBike}>
          <input type="hidden" name="bikeId" value={bike.id} />
          <button className="button small" type="submit">{bike.archivedAt ? "Reativar bike" : "Arquivar bike"}</button>
        </form>
      </section>
    </>
  );
}
