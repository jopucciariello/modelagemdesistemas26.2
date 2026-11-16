// RF16, RB20: one listing; the seller's e-mail is shown only to signed-in users (INV-043).
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Flash, Nav } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { formatBRL, splitPhotos } from "@/lib/market";

const OK = { publicado: "Anúncio publicado." };
const STATUS = { ACTIVE: "Ativo", SOLD: "Vendido", REMOVED: "Encerrado" } as const;

export default function ListingPage(props: PageProps<"/mercado/[id]">) {
  return (
    <main className="wide">
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <Listing {...props} />
      </Suspense>
    </main>
  );
}

async function Listing({ params, searchParams }: PageProps<"/mercado/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const { ok, erro } = await searchParams;
  const l = await prisma.listing.findUnique({ where: { id }, include: { category: true, seller: { include: { merchant: true } } } });
  // INV-041: inactive listings are visible only to their author.
  if (!l || (l.status !== "ACTIVE" && l.sellerId !== user.id)) notFound();
  const photos = splitPhotos(l.photoUrls);
  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <Flash ok={ok} erro={erro} okText={OK} errText={{}} />
      <header><h1>{l.title}</h1></header>
      {l.status !== "ACTIVE" && <p className="alert">Este anúncio está {STATUS[l.status].toLowerCase()}.</p>}
      <section className="card">
        <p><strong>{formatBRL(l.priceCents)}</strong></p>
        <p className="muted">
          {l.category.name} · {l.condition === "NEW" ? "Nova" : "Usada"}
          {l.condition === "USED" && l.usedKm !== null ? ` · ${l.usedKm.toLocaleString("pt-BR")} km de uso (informada pelo vendedor)` : ""}
        </p>
        {l.description && <p>{l.description}</p>}
        {photos.length > 0 && (
          <div className="row">
            {photos.map((u) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={u} src={u} alt={`Foto de ${l.title}`} loading="lazy" style={{ maxWidth: "100%", maxHeight: "16rem" }} />
            ))}
          </div>
        )}
      </section>
      <section className="card">
        <h2>Vendedor</h2>
        <p>{l.seller.merchant ? l.seller.merchant.name : "Atleta"}</p>
        {/* RB20: contact only for signed-in users; no payment inside GearLog. */}
        <p>Contato: <a href={`mailto:${l.seller.email}`}>{l.seller.email}</a></p>
        <p className="muted">O GearLog não processa pagamento nem intermedeia a negociação.</p>
      </section>
      <p><Link href="/mercado">Voltar ao mercado</Link></p>
    </>
  );
}
