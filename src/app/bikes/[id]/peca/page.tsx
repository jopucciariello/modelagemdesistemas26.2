// RF02, RF03, RB15, RB16: install a catalog component; plans start from the component's own
// plans or, without them, from the family defaults.
import Link from "next/link";
import { Suspense } from "react";
import "@/app/portfolio-pages.css";
import { createPart } from "@/app/actions/bikes";
import { ComponentPicker } from "@/components/component-picker";
import { Nav } from "@/components/ui";
import { pickerCategories } from "@/lib/catalog/pick";
import { POSITIONS, componentLabel, plansFor, priceRange } from "@/lib/catalog/rules";
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
    <main className="wide pf">
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <NewPart {...props} />
      </Suspense>
    </main>
  );
}

async function NewPart({ params, searchParams }: PageProps<"/bikes/[id]/peca">) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  const { categoria, componente, erro } = sp;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const bike = await prisma.bike.findFirst({ where: { id, userId: user.id, archivedAt: null } });
  if (!bike) {
    return (<><Nav isAdmin={user.role === "ADMIN"} /><p className="alert">Bike não encontrada. <Link href="/bikes">Voltar</Link></p></>);
  }
  const categories = await pickerCategories();
  const category = typeof categoria === "string"
    ? await prisma.category.findFirst({ where: { id: categoria, active: true }, include: { plans: true } })
    : null;
  const component = category && typeof componente === "string" && componente
    ? await prisma.component.findFirst({ where: { id: componente, categoryId: category.id, active: true }, include: { plans: true } })
    : null;
  // RF31: a part typed by hand (brand and model not in the catalog) has no catalog plans.
  const manual = category && !component && str(sp.manualBrand) && str(sp.manualModel)
    ? { id: "", code: null, brand: str(sp.manualBrand).slice(0, 60), model: str(sp.manualModel).slice(0, 80), details: null, priceMin: null, priceMax: null, plans: [] as Plan[] }
    : null;
  const chosen = component ?? manual;

  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <header>
        <h1>Nova peça</h1>
        <p className="muted">Na bike <Link href={`/bikes/${bike.id}`}>{bike.name}</Link>.</p>
      </header>
      {typeof erro === "string" && <p className="alert" role="alert">{ERR[erro] ?? "Confira os dados."}</p>}

      <section className="card">
        <h2>1. Componente, marca e modelo</h2>
        {categories.length === 0 ? <p className="alert">O catálogo ainda está vazio.</p> : (
          <form method="get" className="row">
            <ComponentPicker categories={categories} names={{ category: "categoria", component: "componente" }} defaultCategoryId={category?.id ?? ""} />
            <button className="button small" type="submit">Escolher</button>
          </form>
        )}
      </section>

      {category && chosen && (
        <PartForm
          bikeId={bike.id}
          category={category}
          component={chosen}
          defaultDay={/^\d{4}-\d{2}-\d{2}$/.test(str(sp.data)) ? str(sp.data) : toLocalDay(new Date())}
          manual={manual ? { brand: manual.brand, model: manual.model, requestAdd: sp.requestAdd === "on" } : null}
        />
      )}
    </>
  );
}

type Plan = { name: string; intervalKm: number | null; intervalHours: number | null; action: "REPLACE" | "SERVICE"; warnKm?: number | null; warnHours?: number | null };

function PartForm({ bikeId, category, component, manual, defaultDay }: {
  manual: { brand: string; model: string; requestAdd: boolean } | null;
  defaultDay: string;
  bikeId: string;
  category: { id: string; plans: Plan[] };
  component: { id: string; code: string | null; brand: string; model: string; details: string | null; priceMin: number | null; priceMax: number | null; plans: Plan[] };
}) {
  const plans = plansFor(component.plans, category.plans);
  // Up to 3 extra empty rows let the athlete add plans (RB16).
  const rows = [...plans, ...Array.from({ length: Math.max(1, 3 - plans.length) }, () => null)];
  const price = priceRange(component.priceMin, component.priceMax);
  return (
    <section className="card">
      <h2>2. {componentLabel(component)}</h2>
      {(component.details || price) && <p className="muted">{[component.details, price && `Preço de referência: ${price}`].filter(Boolean).join(" · ")}</p>}
      <form action={createPart} className="stack">
        <input type="hidden" name="bikeId" value={bikeId} />
        <input type="hidden" name="categoryId" value={category.id} />
        <input type="hidden" name="componentId" value={component.id} />
        {manual && (
          <>
            <input type="hidden" name="manualBrand" value={manual.brand} />
            <input type="hidden" name="manualModel" value={manual.model} />
            {manual.requestAdd && <input type="hidden" name="requestAdd" value="on" />}
          </>
        )}
        <div className="row">
          <label>Posição
            <select name="position" defaultValue="">
              <option value="">(não se aplica)</option>
              {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label>Data de instalação <input name="installedAt" type="date" required defaultValue={defaultDay} /></label>
          <label>Peça
            <select name="condition" defaultValue="NEW">
              <option value="NEW">Nova</option>
              <option value="USED">Usada</option>
            </select>
          </label>
          <label>Condição, se usada <input name="usedCondition" maxLength={200} placeholder="ex.: boa, com 2.000 km de uso" /></label>
          <label>Uso inicial (km) <input name="initialKm" type="number" min={0} step="any" defaultValue={0} /></label>
          <label>Uso inicial (horas) <input name="initialHours" type="number" min={0} step="any" defaultValue={0} /></label>
        </div>
        <h3>Planos de manutenção</h3>
        <p className="muted">
          {plans.length === 0
            ? "Este componente não tem desgaste regular no catálogo. Você pode instalar sem planos ou criar um."
            : component.plans.length > 0
              ? "Sugeridos pelo catálogo para este componente (RF03). Ajuste ao manual da sua peça."
              : "Sugeridos pela família (RF03). Ajuste ao manual da sua peça."}
          {" "}O intervalo é a média da faixa do catálogo, e a barra fica amarela a partir do mínimo (sem esse valor, a partir de 80%). Deixe o nome vazio para ignorar uma linha.
        </p>
        {rows.map((p, i) => (
          <div className="row" key={i}>
            <label>Nome <input name={`planName_${i}`} defaultValue={p?.name ?? ""} maxLength={80} /></label>
            <label>Intervalo km <input name={`planKm_${i}`} type="number" min={0} step="any" defaultValue={p?.intervalKm ?? ""} /></label>
            <label>Intervalo horas <input name={`planHours_${i}`} type="number" min={0} step="any" defaultValue={p?.intervalHours ?? ""} /></label>
            <label>Amarelo a partir de (km) <input name={`planWarnKm_${i}`} type="number" min={0} step="any" defaultValue={p?.warnKm ?? ""} /></label>
            <label>Amarelo a partir de (h) <input name={`planWarnHours_${i}`} type="number" min={0} step="any" defaultValue={p?.warnHours ?? ""} /></label>
            <label>Ação
              <select name={`planAction_${i}`} defaultValue={p?.action ?? "REPLACE"}>
                <option value="REPLACE">Troca</option>
                <option value="SERVICE">Revisão</option>
              </select>
            </label>
          </div>
        ))}
        <button className="button" type="submit">Instalar peça</button>
      </form>
    </section>
  );
}
