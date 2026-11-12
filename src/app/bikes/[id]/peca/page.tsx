// RF02, RF03, RB15, RB16: install a catalog component; plans start from the category defaults.
import Link from "next/link";
import { Suspense } from "react";
import { createPart } from "@/app/actions/bikes";
import { Nav } from "@/components/ui";
import { prisma } from "@/lib/db";
import { toLocalDay } from "@/lib/dates";
import { requireUser } from "@/lib/guards";

const ERR: Record<string, string> = {
  componente: "Escolha um componente do catálogo.",
  data: "Informe a data de instalação.",
  planos: "A peça precisa de pelo menos um plano com intervalo em km ou em horas.",
};

export default function NewPartPage(props: PageProps<"/bikes/[id]/peca">) {
  return (
    <main className="wide">
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <NewPart {...props} />
      </Suspense>
    </main>
  );
}

async function NewPart({ params, searchParams }: PageProps<"/bikes/[id]/peca">) {
  const user = await requireUser();
  const { id } = await params;
  const { categoria, erro } = await searchParams;
  const bike = await prisma.bike.findFirst({ where: { id, userId: user.id, archivedAt: null } });
  const category = typeof categoria === "string"
    ? await prisma.category.findFirst({ where: { id: categoria, active: true }, include: { plans: true, components: { where: { active: true }, orderBy: [{ brand: "asc" }, { model: "asc" }] } } })
    : null;
  if (!bike || !category) {
    return (<><Nav isAdmin={user.role === "ADMIN"} /><p className="alert">Bike ou categoria não encontrada. <Link href="/bikes">Voltar</Link></p></>);
  }
  // Up to 3 extra empty rows let the athlete add plans beyond the category defaults (RB16).
  const rows = [...category.plans, ...Array.from({ length: Math.max(1, 3 - category.plans.length) }, () => null)];
  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <header>
        <h1>Nova peça: {category.name}</h1>
        <p className="muted">Na bike <Link href={`/bikes/${bike.id}`}>{bike.name}</Link>.</p>
      </header>
      {typeof erro === "string" && <p className="alert" role="alert">{ERR[erro] ?? "Confira os dados."}</p>}
      <section className="card">
        <form action={createPart} className="stack">
          <input type="hidden" name="bikeId" value={bike.id} />
          <input type="hidden" name="categoryId" value={category.id} />
          {category.components.length === 0 ? (
            <p className="alert">Esta categoria ainda não tem componentes no catálogo.</p>
          ) : (
            <label>Componente (marca e modelo)
              <select name="componentId" required>
                {category.components.map((c) => <option key={c.id} value={c.id}>{c.brand} {c.model}</option>)}
              </select>
            </label>
          )}
          <div className="row">
            <label>Data de instalação <input name="installedAt" type="date" required defaultValue={toLocalDay(new Date())} /></label>
            <label>Uso inicial (km) <input name="initialKm" type="number" min={0} step="any" defaultValue={0} /></label>
            <label>Uso inicial (horas) <input name="initialHours" type="number" min={0} step="any" defaultValue={0} /></label>
          </div>
          <h2>Planos de manutenção</h2>
          <p className="muted">Sugeridos pela categoria (RF03). Ajuste os intervalos ao manual da sua peça; deixe o nome vazio para ignorar uma linha.</p>
          {rows.map((p, i) => (
            <div className="row" key={i}>
              <label>Nome <input name={`planName_${i}`} defaultValue={p?.name ?? ""} maxLength={80} /></label>
              <label>Intervalo km <input name={`planKm_${i}`} type="number" min={0} step="any" defaultValue={p?.intervalKm ?? ""} /></label>
              <label>Intervalo horas <input name={`planHours_${i}`} type="number" min={0} step="any" defaultValue={p?.intervalHours ?? ""} /></label>
              <label>Ação
                <select name={`planAction_${i}`} defaultValue={p?.action ?? "REPLACE"}>
                  <option value="REPLACE">Troca</option>
                  <option value="SERVICE">Revisão</option>
                </select>
              </label>
            </div>
          ))}
          <button className="button" type="submit" disabled={category.components.length === 0}>Instalar peça</button>
        </form>
      </section>
    </>
  );
}
