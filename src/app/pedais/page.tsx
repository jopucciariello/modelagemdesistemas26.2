// RF06, RF13, RF14: rides typed by hand and the sync with the athlete's source.
import Link from "next/link";
import { Suspense } from "react";
import { createManualRide, deleteManualRide, syncNow } from "@/app/actions/rides";
import { Nav, hours, km } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDay, toLocalDay } from "@/lib/dates";
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
    <main className="wide">
      <header><h1>Pedais</h1></header>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <Rides searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Rides({ searchParams }: { searchParams: PageProps<"/pedais">["searchParams"] }) {
  const user = await requireUser();
  const { ok, erro, n } = await searchParams;
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
      {erro === "pedal_invalido" && <p className="alert" role="alert">Informe bike, data, km e horas válidos.</p>}
      {syncError && <p className="alert" role="alert">{SYNC_ERR[syncError] ?? SYNC_ERR.unexpected}</p>}
      {ok === "pedal" && <p className="ok" role="status">Pedal lançado.</p>}
      {ok === "removido" && <p className="ok" role="status">Pedal removido.</p>}
      {ok === "sync" && <p className="ok" role="status">Sincronizado: {typeof n === "string" ? n : 0} pedais lidos da fonte.</p>}

      {user.activitySource !== "MANUAL" && (
        <section className="card">
          <h2>Sincronizar com {SOURCE_LABEL[user.activitySource]}</h2>
          <p className="muted">
            {status?.lastSyncAt ? `Última sincronização: ${status.lastSyncAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.` : "Ainda não sincronizado."}
            {status?.lastSyncError && " A última tentativa falhou; os dados anteriores foram mantidos."}
          </p>
          <form action={syncNow}><button className="button" type="submit">Sincronizar agora</button></form>
          {unassigned > 0 && <p className="muted">{unassigned} pedais importados ainda sem bike. Associe as bikes da fonte na página de cada bike (RF05).</p>}
        </section>
      )}

      <section className="card">
        <h2>Lançar pedal à mão</h2>
        {bikes.length === 0 ? <p><Link href="/bikes">Cadastre uma bike</Link> antes de lançar pedais.</p> : (
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

      <section className="card">
        <h2>Últimos pedais {total > rides.length && <span className="muted">({rides.length} de {total})</span>}</h2>
        {rides.length === 0 ? <p className="muted">Nenhum pedal ainda.</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Data</th><th>Bike</th><th>Tipo</th><th>Distância</th><th>Tempo</th><th></th></tr></thead>
              <tbody>
                {rides.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDay(r.startDate)}</td>
                    <td>{r.bike?.name ?? <span className="muted">sem bike</span>}</td>
                    <td>{SPORTS[r.sportType] ?? r.sportType}</td>
                    <td>{km(r.distanceKm)}</td>
                    <td>{hours(r.movingHours)}</td>
                    <td>
                      {r.source === "MANUAL" ? (
                        <form action={deleteManualRide} className="inline">
                          <input type="hidden" name="rideId" value={r.id} />
                          <button className="button small" type="submit">Remover</button>
                        </form>
                      ) : <span className="muted">{SOURCE_LABEL[r.source]}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
