// RF30, RB14, RB15, RB16: the admin's catalog editor.
import { addCategoryPlan, createCategory, createComponent, deleteCategoryPlan, loadDefaultCatalog, toggleComponent, updateCategory } from "@/app/actions/catalog";
import { interval } from "@/components/ui";
import { prisma } from "@/lib/db";

function PlanRow({ i }: { i: number }) {
  return (
    <div className="row">
      <label>Plano <input name={`planName_${i}`} maxLength={80} placeholder="Ex.: Troca" /></label>
      <label>km <input name={`planKm_${i}`} type="number" min={0} step="any" /></label>
      <label>horas <input name={`planHours_${i}`} type="number" min={0} step="any" /></label>
      <label>Ação
        <select name={`planAction_${i}`} defaultValue="REPLACE">
          <option value="REPLACE">Troca</option>
          <option value="SERVICE">Revisão</option>
        </select>
      </label>
    </div>
  );
}

export async function AdminCatalog() {
  const categories = await prisma.category.findMany({
    include: { plans: { orderBy: { name: "asc" } }, components: { orderBy: [{ brand: "asc" }, { model: "asc" }] } },
    orderBy: { name: "asc" },
  });
  return (
    <>
      <section className="card">
        <h2>Catálogo de peças</h2>
        <p className="muted">Categorias com os planos padrão (métrica, intervalo e ação) e os componentes (marca/modelo). Só o administrador altera o catálogo (RB15).</p>
        <form action={loadDefaultCatalog}>
          <button className="button small" type="submit">Carregar catálogo inicial</button>
        </form>
        <p className="muted">Inclui as categorias da tabela de vida útil padrão dos requisitos (§4) que ainda não existem.</p>
      </section>

      {categories.map((c) => (
        <section className="card" key={c.id}>
          <h3>{c.name} {!c.active && <span className="muted">(inativa)</span>}</h3>
          <form action={updateCategory} className="row">
            <input type="hidden" name="id" value={c.id} />
            <label>Nome <input name="name" defaultValue={c.name} maxLength={60} required /></label>
            <label className="check"><input type="checkbox" name="wearsOnTrainer" defaultChecked={c.wearsOnTrainer} /> Desgasta em rolo (RB14)</label>
            <label className="check"><input type="checkbox" name="active" defaultChecked={c.active} /> Ativa</label>
            <button className="button small" type="submit">Salvar</button>
          </form>
          <ul className="list">
            {c.plans.map((p) => (
              <li key={p.id} className="row">
                <span>{p.name}: {interval(p)}</span>
                <form action={deleteCategoryPlan} className="inline">
                  <input type="hidden" name="id" value={p.id} />
                  <button className="button small" type="submit" disabled={c.plans.length <= 1}>Remover plano</button>
                </form>
              </li>
            ))}
          </ul>
          <details>
            <summary>Adicionar plano padrão</summary>
            <form action={addCategoryPlan} className="stack">
              <input type="hidden" name="categoryId" value={c.id} />
              <PlanRow i={0} />
              <button className="button small" type="submit">Adicionar</button>
            </form>
          </details>
          <h3>Componentes</h3>
          {c.components.length === 0 ? <p className="muted">Nenhum componente.</p> : (
            <ul className="list">
              {c.components.map((m) => (
                <li key={m.id} className="row">
                  <span>{m.brand} {m.model} {!m.active && <span className="muted">(inativo)</span>}</span>
                  <form action={toggleComponent} className="inline">
                    <input type="hidden" name="id" value={m.id} />
                    <button className="button small" type="submit">{m.active ? "Desativar" : "Reativar"}</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={createComponent} className="row">
            <input type="hidden" name="categoryId" value={c.id} />
            <label>Marca <input name="brand" required maxLength={60} /></label>
            <label>Modelo <input name="model" required maxLength={80} /></label>
            <button className="button small" type="submit">Adicionar componente</button>
          </form>
        </section>
      ))}

      <section className="card">
        <h2>Nova categoria</h2>
        <form action={createCategory} className="stack">
          <label>Nome <input name="name" required maxLength={60} /></label>
          <label className="check"><input type="checkbox" name="wearsOnTrainer" /> Desgasta em rolo (RB14)</label>
          <p className="muted">Pelo menos um plano, com intervalo em km, em horas ou nos dois (RB10, RB16).</p>
          <PlanRow i={0} />
          <PlanRow i={1} />
          <button className="button" type="submit">Criar categoria</button>
        </form>
      </section>
    </>
  );
}
