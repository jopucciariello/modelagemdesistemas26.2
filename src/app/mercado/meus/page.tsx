// RF16, RB19: the author's own listings: edit, mark as sold, close.
import Link from "next/link";
import { Suspense } from "react";
import { closeListing, markSold, updateListing } from "@/app/actions/market";
import { ListingFields } from "@/components/listing-fields";
import { Flash, Nav } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { ERROR_TEXT, formatBRL, splitPhotos } from "@/lib/market";
import s from "../mercado.module.css";
import { Photo } from "../photo";

const OK = { editado: "Anúncio atualizado.", vendido: "Anúncio marcado como vendido.", encerrado: "Anúncio encerrado." };
const STATUS = { ACTIVE: "Ativo", SOLD: "Vendido", REMOVED: "Encerrado" } as const;

export default function MyListingsPage(props: PageProps<"/mercado/meus">) {
  return (
    <main className={`wide ${s.root}`}>
      <header className={s.head}>
        <span className={s.eyebrow}>Marketplace</span>
        <h1 className={s.title}>Meus anúncios</h1>
      </header>
      <Suspense fallback={<p className={s.sub}>Carregando…</p>}>
        <Mine searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Mine({ searchParams }: { searchParams: PageProps<"/mercado/meus">["searchParams"] }) {
  const user = await requireUser();
  const { ok, erro, editar } = await searchParams;
  const [categories, listings] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.listing.findMany({ where: { sellerId: user.id }, include: { category: true }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <Flash ok={ok} erro={erro} okText={OK} errText={ERROR_TEXT} />
      <div className={s.actions}>
        <Link className="button" href="/mercado/novo">Anunciar uma peça</Link>
        <Link className={s.back} href="/mercado">← Voltar ao mercado</Link>
      </div>
      <section aria-label="Meus anúncios">
        {listings.length === 0 ? <p className={s.empty}>Você ainda não anunciou nada.</p> : (
          <ul className={s.mine}>
            {listings.map((l) => (
              <li key={l.id} className={s.mineItem}>
                <Photo url={splitPhotos(l.photoUrls)[0]} alt={`Foto de ${l.title}`} />
                <div className={s.mineBody}>
                  <span className={s.cat}>{l.category.name} · {l.condition === "NEW" ? "Nova" : "Usada"} · {STATUS[l.status]}</span>
                  <Link className={s.name} href={`/mercado/${l.id}`}>{l.title}</Link>
                  <span className={s.price} style={{ paddingTop: 0, fontSize: "1.4rem" }}>{formatBRL(l.priceCents)}</span>
                  {l.status === "REMOVED" && l.removedReason && <span className="alert">Removido pela moderação: {l.removedReason}</span>}
                  {l.status === "ACTIVE" && (
                    <div className="row">
                      <Link className="button small" href={`/mercado/meus?editar=${l.id}`}>Editar</Link>
                      <form action={markSold}><input type="hidden" name="id" value={l.id} /><button className="button small" type="submit">Marcar como vendido</button></form>
                      <form action={closeListing}><input type="hidden" name="id" value={l.id} /><button className="button small" type="submit">Encerrar</button></form>
                    </div>
                  )}
                </div>
                {l.status === "ACTIVE" && editar === l.id && (
                  <form action={updateListing} className={`stack ${s.edit}`}>
                    <input type="hidden" name="id" value={l.id} />
                    <ListingFields categories={categories} listing={l} />
                    <button className="button" type="submit">Salvar</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
