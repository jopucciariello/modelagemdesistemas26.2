// User settings: where the pedals come from (Fonte) and adding bikes (RF01, RF35).
import { Suspense } from "react";
import { createBike } from "@/app/actions/bikes";
import { BikeFields } from "@/components/bike-fields";
import { Flash, Nav } from "@/components/ui";
import { SettingsTabs } from "@/components/settings-tabs";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { toLocalDay } from "@/lib/dates";
import { listSourceBikes, type SourceBikeOption } from "@/lib/rides/sync";

const OK: Record<string, string> = {};
const ERR = { modelo_invalido: "Escolha um modelo do catálogo e a data em que as peças foram instaladas.", bike_invalida: "Informe o nome e o tipo da bike.", bike_nao_encontrada: "Bike não encontrada.", peca_nao_encontrada: "Peça não encontrada." };

export default function SettingsPage(props: PageProps<"/configuracoes">) {
  return (
    <main className="wide">
      <header><h1>Configurações</h1></header>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <Settings searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Settings({ searchParams }: { searchParams: PageProps<"/configuracoes">["searchParams"] }) {
  const user = await requireUser();
  const { ok, erro } = await searchParams;
  const models = await prisma.bikeModel.findMany({ where: { active: true }, orderBy: [{ brand: "asc" }, { model: "asc" }] });
  const bikes = await prisma.bike.findMany({ where: { userId: user.id }, select: { stravaGearId: true } });
  const linked = new Set(bikes.map((b) => b.stravaGearId).filter(Boolean));
  const sourceBikes = (await listSourceBikes(user.id, user.activitySource))?.filter((s) => !linked.has(s.stravaGearId)) ?? null;
  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <Flash ok={ok} erro={erro} okText={OK} errText={ERR} />
      <SettingsTabs />
      {models.length > 0 && (
        <section className="card">
          <h2 id="nova-bike">Adicionar bike a partir de um modelo</h2>
          <p className="muted">Cria a bike com as peças de fábrica do catálogo já instaladas e com os planos de manutenção sugeridos (RF35).</p>
          <form action={createBike} className="row">
            <label>Modelo
              <select name="bikeModelId" required defaultValue="">
                <option value="" disabled>Escolha…</option>
                {models.map((m) => <option key={m.id} value={m.id}>{m.brand} {m.model}{m.version ? ` (${m.version})` : ""}</option>)}
              </select>
            </label>
            <label>Nome (opcional) <input name="name" maxLength={60} /></label>
            <label>Ano <input name="year" type="number" min={1900} max={2100} /></label>
            <label>Peças instaladas em <input name="installedAt" type="date" required defaultValue={toLocalDay(new Date())} /></label>
            <SourceBikeSelect bikes={sourceBikes} withStart />
            <button className="button" type="submit">Criar</button>
          </form>
        </section>
      )}
      <section className="card">
        <h2>Adicionar bike nova</h2>
        <form action={createBike} className="row">
          <BikeFields />
          <SourceBikeSelect bikes={sourceBikes} />
          <button className="button" type="submit">Cadastrar</button>
        </form>
      </section>
    </>
  );
}

/** RF05: the bike on the ride source; its rides (also from before today) count for the new bike. */
function SourceBikeSelect({ bikes, withStart }: { bikes: SourceBikeOption[] | null; withStart?: boolean }) {
  if (!bikes || bikes.length === 0) return null;
  return (
    <>
      <label>Bike no Strava
        <select name="stravaGearId" defaultValue="">
          <option value="">(nenhuma)</option>
          {bikes.map((s) => <option key={s.stravaGearId} value={s.stravaGearId}>{s.name}</option>)}
        </select>
      </label>
      {withStart && (
        <label className="check">
          <input type="checkbox" name="startAtFirstRide" /> Montada do zero: contar desde o primeiro pedal dessa bike no Strava (ignora a data acima)
        </label>
      )}
    </>
  );
}
