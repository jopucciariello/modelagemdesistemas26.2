// RF30, RF35, RB14, RB15, RB16: the admin's catalog editor, in the shape of the catalog spreadsheet.
import { addCategoryPlan, createCategory, createComponent, deleteCategoryPlan, loadCatalogSeed, toggleComponent, updateCategory } from "@/app/actions/catalog";
import { interval } from "@/components/ui";
import { componentLabel, priceRange } from "@/lib/catalog/rules";
import { seed } from "@/lib/catalog/seed";
import { prisma } from "@/lib/db";

function PlanRow({ i }: { i: number }) {
  return (
    <div className="row">
      <label>Plano <input name={`planName_${i}`} maxLength={80} placeholder="Ex.: Corrente" /></label>
      <label>km <input name={`planKm_${i}`} type="number" min={0} step="any" /></label>
      <label>horas <input name={`planHours_${i}`} type="number" min={0} step="any" /></label>
      <label>amarelo (km) <input name={`planWarnKm_${i}`} type="number" min={0} step="any" /></label>
      <label>amarelo (h) <input name={`planWarnHours_${i}`} type="number" min={0} step="any" /></label>
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
  const [categories, bikeModels] = await Promise.all([
    prisma.category.findMany({
      include: {
        plans: { orderBy: { name: "asc" } },
        components: { include: { plans: { orderBy: { name: "asc" } } }, orderBy: [{ code: "asc" }, { brand: "asc" }, { model: "asc" }] },
      },
      orderBy: { name: "asc" },
    }),
    prisma.bikeModel.findMany({ include: { parts: { include: { component: true } } }, orderBy: { code: "asc" } }),
  ]);
  return (
    <>
      <section className="card">
        <h2>Catálogo de peças</h2>
        <p className="muted">
          Famílias (categorias) com os planos padrão, componentes com código, modalidade, faixa de preço e planos próprios, e bikes-modelo com as peças
          de fábrica. Só o administrador altera o catálogo (RB15).
        </p>
        <form action={loadCatalogSeed}>
          <button className="button small" type="submit">Carregar catálogo da planilha</button>
        </form>
        <p className="muted">
          {seed.components.length} componentes e {seed.bikeModels.length} bikes-modelo. Recarregar atualiza os itens pelo código, sem duplicar.
        </p>
      </section>

      {categories.map((c) => (
        <section className="card" key={c.id}>
          <h3>{c.name} <span className="muted">({c.components.length} componentes){!c.active && " · inativa"}</span></h3>
          <form action={updateCategory} className="row">
            <input type="hidden" name="id" value={c.id} />
            <label>Nome <input name="name" defaultValue={c.name} maxLength={60} required /></label>
            <label className="check"><input type="checkbox" name="wearsOnTrainer" defaultChecked={c.wearsOnTrainer} /> Desgasta em rolo (RB14)</label>
            <label className="check"><input type="checkbox" name="active" defaultChecked={c.active} /> Ativa</label>
            <button className="button small" type="submit">Salvar</button>
          </form>
          <p className="muted">Planos padrão (valem para componentes sem plano próprio):</p>
          {c.plans.length === 0 ? <p className="muted">Nenhum: sem desgaste regular.</p> : (
            <ul className="list">
              {c.plans.map((p) => (
                <li key={p.id} className="row">
                  <span>{p.name}: {interval(p)}</span>
                  <form action={deleteCategoryPlan} className="inline">
                    <input type="hidden" name="id" value={p.id} />
                    <button className="button small" type="submit">Remover plano</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <details>
            <summary>Adicionar plano padrão</summary>
            <form action={addCategoryPlan} className="stack">
              <input type="hidden" name="categoryId" value={c.id} />
              <PlanRow i={0} />
              <button className="button small" type="submit">Adicionar</button>
            </form>
          </details>
          <details>
            <summary>Componentes</summary>
            {c.components.length === 0 ? <p className="muted">Nenhum componente.</p> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Componente</th><th>Modalidade</th><th>Preço</th><th>Planos</th><th></th></tr></thead>
                  <tbody>
                    {c.components.map((m) => (
                      <tr key={m.id}>
                        <td>{componentLabel(m)}{!m.active && <span className="muted"> (inativo)</span>}{m.details && <><br /><span className="muted">{m.details}</span></>}</td>
                        <td>{[m.modality, m.subcategory].filter(Boolean).join(" · ")}</td>
                        <td>{priceRange(m.priceMin, m.priceMax) ?? "—"}</td>
                        <td>{m.plans.length ? m.plans.map((p) => `${p.name}: ${interval(p)}`).join("; ") : <span className="muted">padrão da família</span>}</td>
                        <td>
                          <form action={toggleComponent} className="inline">
                            <input type="hidden" name="id" value={m.id} />
                            <button className="button small" type="submit">{m.active ? "Desativar" : "Reativar"}</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </details>
          <details>
            <summary>Adicionar componente</summary>
            <form action={createComponent} className="stack">
              <input type="hidden" name="categoryId" value={c.id} />
              <div className="row">
                <label>Código <input name="code" maxLength={20} placeholder="Ex.: TRX-052" /></label>
                <label>Marca <input name="brand" required maxLength={60} /></label>
                <label>Modelo <input name="model" required maxLength={80} /></label>
              </div>
              <div className="row">
                <label>Modalidade <input name="modality" maxLength={40} placeholder="MTB, Road, Gravel…" /></label>
                <label>Subcategoria <input name="subcategory" maxLength={60} placeholder="XC / Trail" /></label>
                <label>Preço mín (R$) <input name="priceMin" type="number" min={0} step="any" /></label>
                <label>Preço máx (R$) <input name="priceMax" type="number" min={0} step="any" /></label>
              </div>
              <label>Detalhes <input name="details" maxLength={200} /></label>
              <p className="muted">Planos próprios (opcional; vazio usa os planos padrão da família):</p>
              <PlanRow i={0} />
              <PlanRow i={1} />
              <button className="button small" type="submit">Adicionar componente</button>
            </form>
          </details>
        </section>
      ))}

      <section className="card">
        <h2>Bikes-modelo (RF35)</h2>
        {bikeModels.length === 0 ? <p className="muted">Nenhuma. Carregue o catálogo da planilha.</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Bike</th><th>Categoria</th><th>Peças de fábrica</th></tr></thead>
              <tbody>
                {bikeModels.map((b) => (
                  <tr key={b.id}>
                    <td>{b.code} · {b.brand} {b.model}{b.version && <><br /><span className="muted">{b.version}</span></>}</td>
                    <td>{b.category}</td>
                    <td>{b.parts.map((p) => `${p.position}: ${componentLabel(p.component)}`).join("; ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Nova família</h2>
        <form action={createCategory} className="stack">
          <label>Nome <input name="name" required maxLength={60} /></label>
          <label className="check"><input type="checkbox" name="wearsOnTrainer" /> Desgasta em rolo (RB14)</label>
          <p className="muted">Planos padrão (opcional): intervalo em km, em horas ou nos dois (RB10, RB16).</p>
          <PlanRow i={0} />
          <PlanRow i={1} />
          <button className="button" type="submit">Criar família</button>
        </form>
      </section>
    </>
  );
}
