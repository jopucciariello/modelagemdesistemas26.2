// User settings: where the pedals come from (Fonte) and adding bikes (RF01, RF35).
import { Suspense } from "react";
import "@/app/portfolio.css";
import { createBike } from "@/app/actions/bikes";
import { NewBikeForm } from "@/components/new-bike-form";
import { Flash, Nav } from "@/components/ui";
import { SettingsTabs } from "@/components/settings-tabs";
import { prisma } from "@/lib/db";
import { pickerBikeModels } from "@/lib/catalog/pick";
import { requireUser } from "@/lib/guards";
import { toLocalDay } from "@/lib/dates";
import { listSourceBikes } from "@/lib/rides/sync";

const OK: Record<string, string> = {};
const ERR = { modelo_invalido: "Escolha um modelo do catálogo e a data em que as peças foram instaladas.", bike_invalida: "Informe o apelido, a marca e o modelo da bike.", bike_nao_encontrada: "Bike não encontrada.", peca_nao_encontrada: "Peça não encontrada." };

export default function SettingsPage(props: PageProps<"/configuracoes">) {
  return (
    <main className="wide pf">
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
  const models = await pickerBikeModels();
  const bikes = await prisma.bike.findMany({ where: { userId: user.id }, select: { stravaGearId: true } });
  const linked = new Set(bikes.map((b) => b.stravaGearId).filter(Boolean));
  const sourceBikes = (await listSourceBikes(user.id, user.activitySource))?.filter((s) => !linked.has(s.stravaGearId)) ?? null;
  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <Flash ok={ok} erro={erro} okText={OK} errText={ERR} />
      <SettingsTabs />
      <section className="card">
        <h2>Adicionar bike</h2>
        <NewBikeForm action={createBike} models={models} sourceBikes={sourceBikes ?? []} today={toLocalDay(new Date())} />
      </section>
    </>
  );
}
