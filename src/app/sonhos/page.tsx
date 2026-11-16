// RF20: the athlete's dreams (wanted parts with a maximum price).
import { Suspense } from "react";
import { createDream, deleteDream, updateDream } from "@/app/actions/dreams";
import { Flash, Nav } from "@/components/ui";
import { prisma } from "@/lib/db";
import { brl } from "@/lib/dreams";
import { requireUser } from "@/lib/guards";

const OK = { criado: "Sonho cadastrado.", atualizado: "Sonho atualizado.", removido: "Sonho removido." };
const ERR = { sonho_invalido: "Escolha a família e informe um preço máximo maior que zero.", sonho_nao_encontrado: "Sonho não encontrado." };

export default function DreamsPage(props: PageProps<"/sonhos">) {
  return (
    <main className="wide">
      <header><h1>Sonhos</h1><p className="muted">Diga a peça que você quer e o preço máximo. O GearLog avisa quando aparecer um anúncio compatível.</p></header>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <Dreams searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Dreams({ searchParams }: { searchParams: PageProps<"/sonhos">["searchParams"] }) {
  const user = await requireUser();
  const { ok, erro } = await searchParams;
  const [dreams, categories] = await Promise.all([
    prisma.dream.findMany({ where: { userId: user.id }, include: { category: true }, orderBy: { createdAt: "desc" } }),
    prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  const fields = (d?: (typeof dreams)[number]) => (
    <>
      <label>Família
        <select name="categoryId" required defaultValue={d?.categoryId ?? ""}>
          <option value="" disabled>Escolha…</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label>Palavras-chave (opcional)
        <input name="keywords" maxLength={120} defaultValue={d?.keywords ?? ""} placeholder="ex.: 700x28 tubeless" />
      </label>
      <label>Preço máximo (R$)
        <input name="maxPrice" inputMode="decimal" required defaultValue={d ? String(d.maxPriceCents / 100).replace(".", ",") : ""} />
      </label>
    </>
  );
  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <Flash ok={ok} erro={erro} okText={OK} errText={ERR} />
      <section className="card">
        <h2>Novo sonho</h2>
        <form action={createDream} className="stack">
          {fields()}
          <button className="button" type="submit">Cadastrar sonho</button>
        </form>
      </section>
      <section className="card">
        <h2>Meus sonhos</h2>
        {dreams.length === 0 ? <p className="muted">Nenhum sonho ainda.</p> : (
          <ul className="list">
            {dreams.map((d) => (
              <li key={d.id}>
                <div><strong>{d.category.name}</strong> até {brl(d.maxPriceCents)}{d.keywords ? <><br /><span className="muted">Palavras-chave: {d.keywords}</span></> : null}</div>
                <details>
                  <summary className="muted">editar</summary>
                  <form action={updateDream} className="stack">
                    <input type="hidden" name="id" value={d.id} />
                    {fields(d)}
                    <button className="button small" type="submit">Salvar</button>
                  </form>
                </details>
                <form action={deleteDream}>
                  <input type="hidden" name="id" value={d.id} />
                  <button className="button small" type="submit">Remover</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
