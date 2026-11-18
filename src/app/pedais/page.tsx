// RF06, RF13, RF14: recent rides, a refresh button (sync) and a + button (new ride by hand).
import Link from "next/link";
import { refreshMessage } from "@/lib/rides/refresh-message";
import { Suspense } from "react";
import "@/app/portfolio-pages.css";
import { chooseRideBike, createManualRide, deleteManualRide, syncNow } from "@/app/actions/rides";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { Nav, km } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDay, toLocalDay } from "@/lib/dates";
import { formatDuration } from "@/lib/format";
import { requireUser } from "@/lib/guards";

const SPORTS: Record<string, string> = {
  Ride: "Pedal (estrada)",
  MountainBikeRide: "Mountain bike",
  GravelRide: "Gravel",
  EBikeRide: "E-bike",
  EMountainBikeRide: "E-MTB",
  VirtualRide: "Rolo (virtual)",
};
const SYNC_ERR: Record<string, string> = {
  not_linked: "A fonte ainda não está vinculada. Configure em Fonte.",
  unreachable: "A fonte não respondeu agora (ou o limite do Strava foi atingido). Seus dados anteriores continuam salvos; tente de novo mais tarde.",
  unauthorized: "A fonte recusou o acesso. Vincule de novo em Fonte.",
  bad_response: "A fonte respondeu algo inesperado. Seus dados anteriores continuam salvos.",
  unexpected: "A sincronização falhou. Seus dados anteriores continuam salvos.",
};
const SOURCE_LABEL = { MANUAL: "manual", STRAVA: "Strava", CONNECTOR: "conector" } as const;

export default function RidesPage(props: PageProps<"/pedais">) {
  return (
    <main className="wide pf">
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <Rides searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Rides({ searchParams }: { searchParams: PageProps<"/pedais">["searchParams"] }) {
  const user = await requireUser();
  const { ok, erro, n, refresh, espera } = await searchParams;
  const [bikes, rides, status, total] = await Promise.all([
    prisma.bike.findMany({ where: { userId: user.id, archivedAt: null }, orderBy: { createdAt: "asc" } }),
    prisma.ride.findMany({ where: { userId: user.id }, include: { bike: { select: { name: true } } }, orderBy: { startDate: "desc" }, take: 100 }),
    prisma.user.findUnique({ where: { id: user.id }, select: { lastSyncAt: true, lastSyncError: true } }),
    prisma.ride.count({ where: { userId: user.id } }),
  ]);
  const unassigned = rides.filter((r) => !r.bikeId).length;
  const syncError = typeof erro === "string" && erro.startsWith("sync_") ? erro.slice(5) : null;

  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <header className="rides-head">
        <div>
          <h1>Pedais recentes</h1>
          <p className="muted">
            {total > rides.length ? `${rides.length} de ${total} pedais. ` : ""}
            {user.activitySource !== "MANUAL" && (status?.lastSyncAt ? `Última atualização: ${status.lastSyncAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.` : "Ainda não atualizado.")}
          </p>
        </div>
        <div className="rides-actions">
          {user.activitySource !== "MANUAL" && (
            <form action={syncNow}>
              <button className="icon-button" type="submit" aria-label={`Atualizar pelo ${SOURCE_LABEL[user.activitySource]}`} title={`Atualizar pelo ${SOURCE_LABEL[user.activitySource]}`}>↻</button>
            </form>
          )}
          <a className="icon-button" href="#novo-pedal" aria-label="Lançar pedal" title="Lançar pedal">+</a>
        </div>
      </header>
      {erro === "pedal_invalido" && <p className="alert" role="alert">Informe bike, data, km e horas válidos.</p>}
      {syncError && <p className="alert" role="alert">{SYNC_ERR[syncError] ?? SYNC_ERR.unexpected}</p>}
      {user.activitySource !== "MANUAL" && status?.lastSyncError && !syncError && <p className="alert" role="alert">A última atualização falhou; os dados anteriores foram mantidos.</p>}
      {ok === "pedal" && <p className="ok" role="status">Pedal lançado.</p>}
      {ok === "removido" && <p className="ok" role="status">Pedal excluído.</p>}
      {ok === "bike_escolhida" && <p className="ok" role="status">Bike do pedal atualizada.</p>}
      {ok === "sync" && <p className="ok" role="status">Atualizado: {typeof n === "string" ? n : 0} pedais lidos da fonte.</p>}
      {ok === "sync" && typeof refresh === "string" && refreshMessage(refresh, typeof espera === "string" && espera !== "" ? Number(espera) : null) && (
        <p className={refresh === "queued" ? "ok" : "muted"} role="status">{refreshMessage(refresh, typeof espera === "string" && espera !== "" ? Number(espera) : null)}</p>
      )}
      {unassigned > 0 && <p className="muted">{unassigned} pedais ainda sem bike. Escolha a bike na própria linha do pedal ou associe as bikes da fonte na página de cada bike (RF05).</p>}

      <section className="card">
        {rides.length === 0 ? <p className="muted">Nenhum pedal ainda. Use o + para lançar um{user.activitySource !== "MANUAL" ? " ou ↻ para buscar da fonte" : ""}.</p> : (
          <div className="table-wrap">
            <table className="rides-table">
              <thead><tr><th>Distância</th><th>Tempo</th><th>Tipo</th><th>Bike</th><th>Data</th><th>Origem</th></tr></thead>
              <tbody>
                {rides.map((r) => (
                  <tr key={r.id}>
                    <td>{km(r.distanceKm)}</td>
                    <td>{formatDuration(r.movingHours)}</td>
                    <td>{SPORTS[r.sportType] ?? r.sportType}</td>
                    <td>
                      {r.source !== "MANUAL" && !r.stravaGearId ? (
                        <form action={chooseRideBike} className="inline">
                          <input type="hidden" name="rideId" value={r.id} />
                          <select name="bikeId" defaultValue={r.bikeId ?? ""} aria-label="Bike deste pedal">
                            <option value="">sem bike</option>
                            {bikes.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>{" "}
                          <button className="button small" type="submit">Salvar</button>
                        </form>
                      ) : (r.bike?.name ?? <span className="muted">sem bike</span>)}
                    </td>
                    <td>{formatDay(r.startDate)}</td>
                    <td>
                      {r.source === "MANUAL" ? (
                        <>
                          <span className="muted">{SOURCE_LABEL[r.source]}</span>{" "}
                          <form action={deleteManualRide} className="inline">
                            <input type="hidden" name="rideId" value={r.id} />
                            <ConfirmSubmit className="button small danger" message="Excluir este pedal? Ele deixa de contar no desgaste das peças e não dá para desfazer.">Excluir</ConfirmSubmit>
                          </form>
                        </>
                      ) : (
                        <>
                          <span className="muted">{SOURCE_LABEL[r.source]}</span>
                          {r.source === "STRAVA" && r.externalId && /^\d+$/.test(r.externalId) && (
                            <> · <a className="view-on-strava" href={`https://www.strava.com/activities/${r.externalId}`} rel="noreferrer" target="_blank">View on Strava</a></>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={`card new-ride-card${erro === "pedal_invalido" ? " open" : ""}`} id="novo-pedal">
        <div className="rides-head">
          <h2>Lançar pedal</h2>
          <a href="#" className="muted">Fechar</a>
        </div>
        {bikes.length === 0 ? <p><Link href="/configuracoes">Cadastre uma bike</Link> antes de lançar pedais.</p> : (
          <form action={createManualRide} className="row">
            <label>Bike
              <select name="bikeId" required>{bikes.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
            </label>
            <label>Data <input name="date" type="date" required defaultValue={toLocalDay(new Date())} /></label>
            <label>Tipo
              <select name="sportType" defaultValue="Ride">{Object.entries(SPORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </label>
            <label>Distância (km) <input name="distanceKm" type="number" min={0} step="any" required /></label>
            <label>Tempo em movimento (h) <input name="movingHours" type="number" min={0} step="any" required /></label>
            <button className="button" type="submit">Lançar</button>
          </form>
        )}
      </section>
    </>
  );
}
