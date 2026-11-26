// RF17, INV-041: showcase of ACTIVE listings with filters.
import { SellerBadge } from "@/components/seller-badge";
import Link from "next/link";
import { Suspense } from "react";
import { Nav } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { buildListingFilter, formatBRL, splitPhotos } from "@/lib/market";
import s from "./mercado.module.css";
import { Photo } from "./photo";

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default function MarketPage(props: PageProps<"/mercado">) {
  return (
    <main className={`${s.root}`}>
      <header className={s.head}>
        <span className={s.eyebrow}>GearLog · Marketplace</span>
        <h1 className={s.title}>Mercado de peças</h1>
        <p className={s.sub}>Peças novas e usadas de atletas e lojistas. Combine direto com o vendedor.</p>
      </header>
      <Suspense fallback={<p className={s.sub}>Carregando…</p>}>
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
      include: { category: true, photos: { select: { id: true }, orderBy: { position: "asc" } }, seller: { include: { merchant: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <div className={s.actions}>
        <Link className="button" href="/mercado/novo">Anunciar uma peça</Link>
        <Link className={s.back} href="/mercado/meus">Meus anúncios</Link>
      </div>
      <section className={s.filters} aria-label="Filtros">
        <form method="get">
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
          <Link className={s.clear} href="/mercado">Limpar</Link>
        </form>
      </section>
      <section aria-label="Anúncios">
        {listings.length === 0 ? <p className={s.empty}>Nenhum anúncio ativo com esses filtros.</p> : (
          <ul className={s.grid}>
            {listings.map((l) => (
              <li key={l.id}>
                <Link href={`/mercado/${l.id}`} className={s.product}>
                  <Photo url={l.photos[0] ? `/api/v1/market/photos/${l.photos[0].id}` : splitPhotos(l.photoUrls)[0]} alt={`Foto de ${l.title}`}>
                    <span className={`${s.tag} ${l.condition === "NEW" ? s.tagNew : ""}`}>
                      {l.condition === "NEW" ? "Nova" : `Usada${l.usedKm !== null ? ` · ${l.usedKm.toLocaleString("pt-BR")} km` : ""}`}
                    </span>
                  </Photo>
                  <span className={s.body}>
                    <span className={s.cat}>{l.category.name}</span>
                    <strong className={s.name}>{l.title}</strong>
                    <span className={s.seller}>{l.seller.merchant ? <SellerBadge merchant={l.seller.merchant} /> : "Atleta"}</span>
                    <span className={s.price}>{formatBRL(l.priceCents)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
