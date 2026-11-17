// RF17, INV-041: showcase of ACTIVE listings with filters.
import { SellerBadge } from "@/components/seller-badge";
import Link from "next/link";
import { Suspense } from "react";
import { Nav } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { buildListingFilter, formatBRL } from "@/lib/market";

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default function MarketPage(props: PageProps<"/mercado">) {
  return (
    <main className="wide">
      <header><h1>Mercado de peças</h1></header>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <Market searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Market({ searchParams }: { searchParams: PageProps<"/mercado">["searchParams"] }) {
  const user = await requireUser();
  const sp = await searchParams;
  const q = { categoria: one(sp.categoria), condicao: one(sp.condicao), min: one(sp.min), max: one(sp.max), vendedor: one(sp.vendedor) };
  const [categories, listings] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.listing.findMany({
      where: buildListingFilter(q),
      include: { category: true, seller: { include: { merchant: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <p><Link className="button small" href="/mercado/novo">Anunciar uma peça</Link> <Link href="/mercado/meus">Meus anúncios</Link></p>
      <section className="card">
        <h2>Filtros</h2>
        <form method="get" className="row">
          <label>Família
            <select name="categoria" defaultValue={q.categoria ?? ""}>
              <option value="">Todas</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>Condição
            <select name="condicao" defaultValue={q.condicao ?? ""}>
              <option value="">Qualquer</option>
              <option value="NEW">Nova</option>
              <option value="USED">Usada</option>
            </select>
          </label>
          <label>Preço mínimo (R$) <input name="min" inputMode="decimal" defaultValue={q.min ?? ""} /></label>
          <label>Preço máximo (R$) <input name="max" inputMode="decimal" defaultValue={q.max ?? ""} /></label>
          <label>Vendedor
            <select name="vendedor" defaultValue={q.vendedor ?? ""}>
              <option value="">Todos</option>
              <option value="loja">Loja</option>
              <option value="atleta">Atleta</option>
            </select>
          </label>
          <button className="button" type="submit">Filtrar</button>
          <Link href="/mercado">Limpar</Link>
        </form>
      </section>
      <section className="card">
        <h2>Anúncios</h2>
        {listings.length === 0 ? <p className="muted">Nenhum anúncio ativo com esses filtros.</p> : (
          <ul className="list">
            {listings.map((l) => (
              <li key={l.id}>
                <Link href={`/mercado/${l.id}`}><strong>{l.title}</strong></Link>
                <span><strong>{formatBRL(l.priceCents)}</strong></span>
                <span className="muted">
                  {l.category.name} · {l.condition === "NEW" ? "Nova" : `Usada${l.usedKm !== null ? `, ${l.usedKm.toLocaleString("pt-BR")} km` : ""}`}
                  {" · "}{l.seller.merchant ? <SellerBadge merchant={l.seller.merchant} /> : "Atleta"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
