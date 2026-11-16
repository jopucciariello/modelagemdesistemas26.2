// RF16, RB19: the author's own listings: edit, mark as sold, close.
import Link from "next/link";
import { Suspense } from "react";
import { closeListing, markSold, updateListing } from "@/app/actions/market";
import { ListingFields } from "@/components/listing-fields";
import { Flash, Nav } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { ERROR_TEXT, formatBRL } from "@/lib/market";

const OK = { editado: "Anúncio atualizado.", vendido: "Anúncio marcado como vendido.", encerrado: "Anúncio encerrado." };
const STATUS = { ACTIVE: "Ativo", SOLD: "Vendido", REMOVED: "Encerrado" } as const;

export default function MyListingsPage(props: PageProps<"/mercado/meus">) {
  return (
    <main className="wide">
      <header><h1>Meus anúncios</h1></header>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
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
      <p><Link className="button small" href="/mercado/novo">Anunciar uma peça</Link> <Link href="/mercado">Voltar ao mercado</Link></p>
      <section className="card">
        {listings.length === 0 ? <p className="muted">Você ainda não anunciou nada.</p> : (
          <ul className="list">
            {listings.map((l) => (
              <li key={l.id}>
                <Link href={`/mercado/${l.id}`}><strong>{l.title}</strong></Link>
                <span>{formatBRL(l.priceCents)} · {STATUS[l.status]}</span>
                <span className="muted">{l.category.name} · {l.condition === "NEW" ? "Nova" : "Usada"}</span>
                {l.status === "REMOVED" && l.removedReason && <span className="alert">Removido pela moderação: {l.removedReason}</span>}
                {l.status === "ACTIVE" && (
                  <>
                    <div className="row">
                      <Link className="button small" href={`/mercado/meus?editar=${l.id}`}>Editar</Link>
                      <form action={markSold}><input type="hidden" name="id" value={l.id} /><button className="button small" type="submit">Marcar como vendido</button></form>
                      <form action={closeListing}><input type="hidden" name="id" value={l.id} /><button className="button small" type="submit">Encerrar</button></form>
                    </div>
                    {editar === l.id && (
                      <form action={updateListing} className="stack">
                        <input type="hidden" name="id" value={l.id} />
                        <ListingFields categories={categories} listing={l} />
                        <button className="button" type="submit">Salvar</button>
                      </form>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
