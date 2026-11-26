// RF02, RF35: after creating a bike, the athlete checks every installed part and confirms or swaps it.
import Link from "next/link";
import { Suspense } from "react";
import "@/app/portfolio-pages.css";
import { fixPart } from "@/app/actions/bikes";
import { ComponentPicker } from "@/components/component-picker";
import { Flash, Nav } from "@/components/ui";
import { pickerCategories } from "@/lib/catalog/pick";
import { componentLabel } from "@/lib/catalog/rules";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guards";

const OK = {
  bike_modelo: "Bike criada com as peças de fábrica do catálogo.",
  bike_manual: "Bike criada. Ela ainda não tem peças.",
  peca_corrigida: "Peça atualizada.",
};
const ERR = { componente: "Escolha o componente, a marca e o modelo.", peca_com_historico: "Essa peça já tem histórico de manutenção; use “Trocar a peça inteira” na bike." };

export default function VerifyPage(props: PageProps<"/bikes/[id]/verificar">) {
  return (
    <main className="pf">
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <Verify {...props} />
      </Suspense>
    </main>
  );
}

async function Verify({ params, searchParams }: PageProps<"/bikes/[id]/verificar">) {
  const user = await requireUser();
  const { id } = await params;
  const { ok, erro, data } = await searchParams;
  const bike = await prisma.bike.findFirst({
    where: { id, userId: user.id },
    include: { parts: { where: { removedAt: null, inStock: false }, include: { component: true }, orderBy: { position: "asc" } } },
  });
  if (!bike) return (<><Nav isAdmin={user.role === "ADMIN"} /><p className="alert">Bike não encontrada. <Link href="/bikes">Voltar</Link></p></>);
  const categories = await pickerCategories();
  const day = typeof data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data) ? `?data=${data}` : "";
  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <header>
        <h1>Confira as peças de {bike.name}</h1>
        <p className="muted">Veja se cada peça é a que está instalada na sua bike. Se não for, troque pela certa. Depois é só confirmar.</p>
      </header>
      <Flash ok={ok} erro={erro} okText={OK} errText={ERR} />
      <section className="card">
        {bike.parts.length === 0 ? (
          <p className="muted">Nenhuma peça ainda. Adicione as que estão instaladas na bike.</p>
        ) : (
          <ul className="list">
            {bike.parts.map((p) => (
              <li key={p.id}>
                <div>
                  {p.position && <span className="muted">{p.position}: </span>}
                  <strong>{componentLabel(p.component)}</strong>
                </div>
                <details>
                  <summary>Não é essa peça: mudar</summary>
                  <form action={fixPart} className="row">
                    <input type="hidden" name="partId" value={p.id} />
                    <ComponentPicker categories={categories.filter((c) => c.id === p.component.categoryId)} defaultCategoryId={p.component.categoryId} defaultComponentId={p.componentId} lockCategory />
                    <button className="button small" type="submit">Salvar peça</button>
                  </form>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="row">
        <Link className="button" href={`/bikes/${bike.id}?ok=verificada`}>Está tudo certo</Link>
        <Link className="button small" href={`/bikes/${bike.id}/peca${day}`}>Adicionar peça</Link>
      </p>
    </>
  );
}
