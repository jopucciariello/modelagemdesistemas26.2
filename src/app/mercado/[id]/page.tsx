// RF16, RB20: one listing; the seller's e-mail is shown only to signed-in users (INV-043).
import { SellerBadge } from "@/components/seller-badge";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Flash, Nav } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { formatBRL, splitPhotos } from "@/lib/market";
import s from "../mercado.module.css";
import { Photo } from "../photo";

const OK = { publicado: "Anúncio publicado." };
const STATUS = { ACTIVE: "Ativo", SOLD: "Vendido", REMOVED: "Encerrado" } as const;

export default function ListingPage(props: PageProps<"/mercado/[id]">) {
  return (
    <main className={`wide ${s.root}`}>
      <Suspense fallback={<p className={s.sub}>Carregando…</p>}>
        <Listing {...props} />
      </Suspense>
    </main>
  );
}

async function Listing({ params, searchParams }: PageProps<"/mercado/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const { ok, erro } = await searchParams;
  const l = await prisma.listing.findUnique({ where: { id }, include: { category: true, photos: { select: { id: true }, orderBy: { position: "asc" } }, seller: { include: { merchant: true } } } });
  // INV-041: inactive listings are visible only to their author.
  if (!l || (l.status !== "ACTIVE" && l.sellerId !== user.id)) notFound();
  const photos = [...l.photos.map((p) => `/api/v1/market/photos/${p.id}`), ...splitPhotos(l.photoUrls)];
  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <Flash ok={ok} erro={erro} okText={OK} errText={{}} />
      <header className={s.head}>
        <span className={s.eyebrow}>{l.category.name}</span>
        <h1 className={s.title}>{l.title}</h1>
      </header>
      {l.status !== "ACTIVE" && <p className="alert">Este anúncio está {STATUS[l.status].toLowerCase()}.</p>}
      <div className={s.detail}>
        <div className={s.gallery}>
          {photos.length > 0
            ? photos.map((u) => <Photo key={u} url={u} alt={`Foto de ${l.title}`} />)
            : <Photo alt={l.title} />}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <section className={s.panel}>
            <span className={s.big}>{formatBRL(l.priceCents)}</span>
            <div className={s.metaRow}>
              <span className={s.pill}>{l.condition === "NEW" ? "Nova" : "Usada"}</span>
              {l.condition === "USED" && l.usedKm !== null && <span className={s.pill}>{l.usedKm.toLocaleString("pt-BR")} km de uso</span>}
            </div>
            {l.condition === "USED" && l.usedKm !== null && <p className={s.note}>Quilometragem informada pelo vendedor.</p>}
            {l.description && <p>{l.description}</p>}
          </section>
          <section className={s.panel}>
            <h2>Vendedor</h2>
            <p>{l.seller.merchant ? <SellerBadge merchant={l.seller.merchant} /> : "Atleta"}</p>
            {/* RB20: contact only for signed-in users; no payment inside GearLog. */}
            <p>Contato: <a href={`mailto:${l.seller.email}`}>{l.seller.email}</a></p>
            <p className={s.note}>O GearLog não processa pagamento nem intermedeia a negociação.</p>
          </section>
        </div>
      </div>
      <p><Link className={s.back} href="/mercado">← Voltar ao mercado</Link></p>
    </>
  );
}
